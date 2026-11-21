"""
Lahore Rush — Blender model builder (125 bike + rider, tonga, stray dog + cat, Minar-e-Pakistan, Badshahi Masjid, traffic).

Builds the game's hero models from primitives with bevels, smooth shading and PBR materials,
then exports each as .glb into public/models/ and writes models.json.

Run (headless):
  blender --background --factory-startup --python blender/build_models.py -- <out_dir> [preview]

Conventions (match the game):
  * 1 Blender unit = 1 metre, Z up, origin on the ground at the model centre.
  * Vehicles face +Y in Blender — the glTF exporter maps that to -Z, the game's forward (verified in the .glb).
  * The dog and cat face +X (the game turns them to cross the road); their legs are Leg_* nodes for the trot.
  * Rickshaw wheels are separate objects named Wheel_* with applied transforms, so the game can spin them.
"""
import bpy, bmesh, math, os, sys, json, random
from mathutils import Vector

argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
OUT = os.path.abspath(argv[0] if argv else 'public/models')
PREVIEW = len(argv) > 1 and argv[1] == 'preview'
os.makedirs(OUT, exist_ok=True)
random.seed(7)

# ------------------------------------------------------------------ helpers
_mats = {}
def reset():
    _mats.clear()
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete()
    for block in (bpy.data.meshes, bpy.data.materials, bpy.data.images):
        for b in list(block):
            if b.users == 0:
                block.remove(b)

def mat(name, color, metal=0.0, rough=0.5, emit=None, strength=3.0, alpha=1.0):
    key = (name, color, metal, rough, emit, alpha)
    if key in _mats and _mats[key].name in bpy.data.materials:
        return _mats[key]
    m = bpy.data.materials.new(name)
    if hasattr(m, "use_nodes") and not m.node_tree: m.use_nodes = True
    p = m.node_tree.nodes.get('Principled BSDF')
    c = [((color >> 16) & 255) / 255, ((color >> 8) & 255) / 255, (color & 255) / 255]
    lin = [x / 12.92 if x <= 0.04045 else ((x + 0.055) / 1.055) ** 2.4 for x in c]
    p.inputs['Base Color'].default_value = (*lin, 1)
    p.inputs['Metallic'].default_value = metal
    p.inputs['Roughness'].default_value = rough
    if emit is not None:
        e = [((emit >> 16) & 255) / 255, ((emit >> 8) & 255) / 255, (emit & 255) / 255]
        e = [x / 12.92 if x <= 0.04045 else ((x + 0.055) / 1.055) ** 2.4 for x in e]
        p.inputs['Emission Color'].default_value = (*e, 1)
        p.inputs['Emission Strength'].default_value = strength
    if alpha < 1:
        p.inputs['Alpha'].default_value = alpha
        try:
            m.surface_render_method = 'BLENDED'
        except Exception:
            m.blend_method = 'BLEND'
    m.diffuse_color = (*lin, alpha)
    _mats[key] = m
    return m

def _finish(o, m, bevel=0.0, segs=2, smooth=False, name=None):
    if name:
        o.name = name
    o.data.materials.clear()
    o.data.materials.append(m)
    bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)
    if bevel > 0:
        mod = o.modifiers.new('bevel', 'BEVEL')
        mod.width = bevel
        mod.segments = segs
        mod.limit_method = 'ANGLE'
        mod.harden_normals = False
    if smooth:
        for poly in o.data.polygons:
            poly.use_smooth = True
    return o

def box(size, loc, m, bevel=0.02, rot=(0, 0, 0), name=None):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc, rotation=rot)
    o = bpy.context.active_object
    o.scale = size
    return _finish(o, m, bevel, name=name)

def cyl(r, depth, loc, m, rot=(0, 0, 0), verts=24, bevel=0.0, name=None, r2=None):
    if r2 is None:
        bpy.ops.mesh.primitive_cylinder_add(radius=r, depth=depth, vertices=verts, location=loc, rotation=rot)
    else:
        bpy.ops.mesh.primitive_cone_add(radius1=r, radius2=r2, depth=depth, vertices=verts, location=loc, rotation=rot)
    o = bpy.context.active_object
    return _finish(o, m, bevel, smooth=True, name=name)

def sphere(r, loc, m, scale=(1, 1, 1), segs=20, name=None):
    bpy.ops.mesh.primitive_uv_sphere_add(radius=r, location=loc, segments=segs, ring_count=max(8, segs // 2))
    o = bpy.context.active_object
    o.scale = scale
    return _finish(o, m, smooth=True, name=name)

def torus(R, r, loc, m, rot=(0, 0, 0), name=None, maj=32, mn=12):
    bpy.ops.mesh.primitive_torus_add(major_radius=R, minor_radius=r, location=loc, rotation=rot, major_segments=maj, minor_segments=mn)
    o = bpy.context.active_object
    return _finish(o, m, smooth=True, name=name)

def tapered_box(size, loc, m, top_scale=(1, 0.7), shift_y=0.0, bevel=0.06, name=None):
    """Box whose top face is scaled (x, y) and shifted along Y — car cabins, cowls."""
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc)
    o = bpy.context.active_object
    o.scale = size
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    bm = bmesh.new(); bm.from_mesh(o.data)
    for v in bm.verts:
        if v.co.z > 0:
            v.co.x *= top_scale[0]; v.co.y = v.co.y * top_scale[1] + shift_y
    bm.to_mesh(o.data); bm.free()
    return _finish(o, m, bevel, name=name)

def export(name, flip=False):
    # Models are authored nose toward +Y; the glTF exporter maps Blender +Y to -Z, the game's forward.
    # (flip=True turns a model 180 deg first — only needed for models authored nose toward -Y.)
    if flip:
        for o in bpy.context.scene.objects:
            if o.parent is None:
                o.location = (-o.location.x, -o.location.y, o.location.z)
                o.rotation_euler.z += math.pi
        bpy.ops.object.select_all(action='SELECT')
        bpy.ops.object.transform_apply(location=False, rotation=True, scale=False)
    # apply modifiers on export; selection = everything in the scene
    bpy.ops.object.select_all(action='SELECT')
    path = os.path.join(OUT, f'{name}.glb')
    bpy.ops.export_scene.gltf(filepath=path, export_format='GLB', use_selection=True, export_apply=True, export_yup=True)
    print(f'[build] exported {path}')
    if PREVIEW:
        render_preview(name)

def render_preview(name):
    scn = bpy.context.scene
    for o in list(bpy.data.objects):
        if o.type in ('CAMERA', 'LIGHT'):
            bpy.data.objects.remove(o)
    objs = [o for o in scn.objects if o.type == 'MESH']
    mn = Vector((min(min((o.matrix_world @ Vector(c)).x for c in o.bound_box) for o in objs),
                 min(min((o.matrix_world @ Vector(c)).y for c in o.bound_box) for o in objs), 0))
    mx = Vector((max(max((o.matrix_world @ Vector(c)).x for c in o.bound_box) for o in objs),
                 max(max((o.matrix_world @ Vector(c)).y for c in o.bound_box) for o in objs),
                 max(max((o.matrix_world @ Vector(c)).z for c in o.bound_box) for o in objs)))
    center = (mn + mx) / 2
    size = max((mx - mn).length, 1)
    cam_data = bpy.data.cameras.new('cam'); cam = bpy.data.objects.new('cam', cam_data)
    scn.collection.objects.link(cam)
    k = 0.62 if size < 4 else 1.0
    cam.location = center + Vector((size * 1.15 * k, size * 1.25 * k, size * 0.7 * k))
    d = center + Vector((0, 0, mx.z * 0.45)) - cam.location
    cam.rotation_euler = d.to_track_quat('-Z', 'Y').to_euler()
    cam_data.lens = 35
    scn.camera = cam
    sun = bpy.data.objects.new('sun', bpy.data.lights.new('sun', 'SUN'))
    sun.data.energy = 3.5; sun.rotation_euler = (0.8, 0.2, 0.6)
    scn.collection.objects.link(sun)
    scn.render.engine = 'BLENDER_WORKBENCH'
    scn.display.shading.light = 'STUDIO'
    scn.display.shading.color_type = 'MATERIAL'
    scn.display.shading.show_shadows = True
    scn.display.shading.show_cavity = True
    scn.render.resolution_x, scn.render.resolution_y = 900, 640
    scn.render.filepath = os.path.join(os.path.dirname(os.path.abspath(__file__)), '_preview', f'{name}.png')
    bpy.ops.render.render(write_still=True)
    bpy.data.objects.remove(cam); bpy.data.objects.remove(sun)

# ------------------------------------------------------------------ palettes
GREEN, YELLOW, RED, BLUE, WHITE = 0x1b7f3b, 0xffd60a, 0xd62828, 0x1565c0, 0xffffff
ART = [0xd62828, 0xffd60a, 0x0b8f3a, 0x1565c0, 0xe91e63, 0xff7f11, 0x00acc1, 0xffffff]

def M():
    return {
        'body': mat('body_green', GREEN, 0.15, 0.35),
        'trim': mat('trim_yellow', YELLOW, 0.3, 0.35),
        'chrome': mat('chrome', 0xe6e6e6, 1.0, 0.12),
        'dark': mat('dark', 0x161616, 0.2, 0.6),
        'rubber': mat('rubber', 0x121212, 0.0, 0.85),
        'canopy': mat('canopy', 0x1c1c1c, 0.0, 0.7),
        'seat': mat('seat', 0x8b1a1a, 0.0, 0.45),
        'glass': mat('glass', 0x9fc4d8, 0.0, 0.05, alpha=0.35),
        'head': mat('headlamp', 0xfff6d0, 0.0, 0.1, emit=0xfff3c4, strength=6),
        'tail': mat('taillamp', 0xff2020, 0.0, 0.2, emit=0xff2020, strength=4),
        'amber': mat('amber', 0xffa000, 0.0, 0.2, emit=0xffa000, strength=3),
        'skin': mat('skin', 0xb07a52, 0.0, 0.6),
        'kurta': mat('kurta', 0xd9d2bf, 0.0, 0.75),
        'cap': mat('cap', 0x2b2b2b, 0.0, 0.7),
        'plate': mat('plate', 0xf5f5f5, 0.0, 0.5),
    }

def art_stripes(x, y0, y1, z0, z1, normal_x, count=4):
    """Zig-zag truck-art bands painted on a side panel at x (facing ±X)."""
    rows = count
    h = (z1 - z0) / rows
    for r in range(rows):
        col = mat(f'art{r}', ART[r % len(ART)], 0.1, 0.4)
        n = int((y1 - y0) / 0.11)
        for i in range(n):
            y = y0 + (i + 0.5) * (y1 - y0) / n
            ang = 0.6 if i % 2 else -0.6
            box((0.012, 0.13, h * 0.42), (x + normal_x * 0.006, y, z0 + (r + 0.5) * h), col, bevel=0, rot=(ang, 0, 0))

def flower(x, y, z, normal_x, col):
    for k in range(6):
        a = k / 6 * math.pi * 2
        sphere(0.035, (x + normal_x * 0.01, y + math.cos(a) * 0.045, z + math.sin(a) * 0.045), col, scale=(0.4, 1, 1), segs=10)
    sphere(0.025, (x + normal_x * 0.015, y, z), mat('flower_mid', YELLOW, 0, 0.4), scale=(0.5, 1, 1), segs=10)

# ------------------------------------------------------------------ RICKSHAW
def build_rickshaw():
    reset(); m = M()
    # chassis + floor
    box((1.32, 2.7, 0.12), (0, 0.05, 0.42), m['dark'], 0.02)
    # rear passenger tub (rounded)
    box((1.52, 1.36, 0.64), (0, -0.62, 0.82), m['body'], 0.07)
    box((1.58, 1.4, 0.07), (0, -0.62, 1.15), m['trim'], 0.03)
    box((1.58, 1.4, 0.05), (0, -0.62, 0.5), m['chrome'], 0.02)
    # truck-art on both sides + back
    for s in (-1, 1):
        art_stripes(s * 0.765, -1.25, 0.02, 0.56, 0.84, s, count=3)
        for i, y in enumerate((-1.1, -0.82, -0.54, -0.26)):
            flower(s * 0.77, y, 0.99, s, mat(f'fl{i}', ART[(i + 4) % len(ART)], 0, 0.4))
    for r in range(3):
        col = mat(f'artb{r}', ART[(r + 2) % len(ART)], 0.1, 0.4)
        box((1.3, 0.012, 0.07), (0, -1.305, 0.62 + r * 0.12), col, 0)
    # tail lights + plate + reflectors
    for s in (-1, 1):
        box((0.2, 0.04, 0.12), (s * 0.58, -1.31, 1.0), m['tail'], 0.01)
    box((0.44, 0.02, 0.15), (0, -1.315, 0.62), m['plate'], 0.01)
    for i in range(5):
        box((0.04, 0.01, 0.08), (-0.12 + i * 0.06, -1.33, 0.62), m['dark'], 0)
    # driver section: floor, cowl (tapered nose), lower apron
    box((1.06, 1.0, 0.08), (0, 0.52, 0.52), m['dark'], 0.02)
    tapered_box((1.04, 0.22, 0.9), (0, 1.02, 0.96), m['body'], top_scale=(0.92, 0.7), shift_y=-0.05, bevel=0.05)
    box((0.94, 0.5, 0.14), (0, 0.9, 0.56), m['body'], 0.04)
    for r in range(2):
        box((0.7, 0.01, 0.06), (0, 1.14, 0.74 + r * 0.1), mat(f'artc{r}', ART[r * 3], 0.1, 0.4), 0, rot=(-0.2, 0, 0))
    # headlight with chrome bezel, indicators
    cyl(0.15, 0.1, (0, 1.15, 1.18), m['chrome'], rot=(math.pi / 2, 0, 0), verts=32)
    cyl(0.12, 0.02, (0, 1.205, 1.18), m['head'], rot=(math.pi / 2, 0, 0), verts=32)
    for s in (-1, 1):
        cyl(0.05, 0.05, (s * 0.42, 1.14, 0.72), m['amber'], rot=(math.pi / 2, 0, 0), verts=16)
    # windscreen + frame
    box((1.08, 0.025, 0.62), (0, 1.0, 1.72), m['glass'], 0, rot=(0.12, 0, 0))
    box((1.14, 0.07, 0.05), (0, 1.03, 1.4), m['chrome'], 0.01)
    box((1.14, 0.06, 0.04), (0, 0.96, 2.03), m['chrome'], 0.01)
    # pillars
    for x, y in ((-0.74, 0.98), (0.74, 0.98), (-0.74, -1.27), (0.74, -1.27), (-0.74, 0.0), (0.74, 0.0)):
        cyl(0.03, 1.0, (x, y, 1.6), m['chrome'], verts=12)
    # canopy: rounded roof shell + rim
    cyl(0.82, 2.62, (0, -0.14, 2.12), m['canopy'], rot=(math.pi / 2, 0, 0), verts=40)
    o = bpy.context.active_object; o.scale = (1, 1, 0.28); bpy.ops.object.transform_apply(scale=True)
    box((1.62, 2.62, 0.1), (0, -0.14, 2.1), m['canopy'], 0.03)
    box((1.66, 2.66, 0.05), (0, -0.14, 2.05), m['trim'], 0.02)
    # jhalar fringe
    for i in range(16):
        y = 1.1 - i * 0.16
        for s in (-1, 1):
            c = mat(f'fr{i % 4}', [RED, YELLOW, BLUE, WHITE][i % 4], 0.1, 0.4)
            box((0.02, 0.08, 0.17), (s * 0.84, y, 1.95), c, 0.005)
            sphere(0.025, (s * 0.84, y, 1.85), c, segs=8)
    for i in range(9):
        c = mat(f'fr{i % 4}', [RED, YELLOW, BLUE, WHITE][i % 4], 0.1, 0.4)
        box((0.08, 0.02, 0.17), (-0.72 + i * 0.18, 1.18, 1.95), c, 0.005)
    # rolled side flaps
    for s in (-1, 1):
        cyl(0.07, 1.3, (s * 0.8, -0.6, 2.0), m['canopy'], rot=(math.pi / 2, 0, 0), verts=12)
    # seats
    box((1.3, 0.62, 0.18), (0, -0.84, 1.18), m['seat'], 0.06)
    box((1.3, 0.12, 0.62), (0, -1.2, 1.55), m['seat'], 0.05)
    box((0.56, 0.45, 0.14), (0, 0.22, 1.08), m['dark'], 0.05)
    # handlebar + column + mirrors
    cyl(0.028, 0.92, (0, 0.78, 1.33), m['chrome'], rot=(0, math.pi / 2, 0), verts=12)
    for s in (-1, 1):
        cyl(0.04, 0.12, (s * 0.44, 0.78, 1.33), m['rubber'], rot=(0, math.pi / 2, 0), verts=12)
        cyl(0.014, 0.38, (s * 0.52, 0.8, 1.5), m['chrome'], rot=(0, s * 0.55, 0), verts=8)
        sphere(0.08, (s * 0.62, 0.8, 1.67), m['chrome'], scale=(1, 0.35, 0.7), segs=16)
    cyl(0.035, 0.7, (0, 0.94, 0.98), m['chrome'], rot=(0.3, 0, 0), verts=12)
    # mudguards
    for s in (-1, 1):
        box((0.27, 0.8, 0.05), (s * 0.68, -0.92, 0.7), m['body'], 0.02)
    box((0.28, 0.62, 0.05), (0, 1.17, 0.66), m['trim'], 0.02)
    for s in (-1, 1):
        box((0.045, 0.045, 0.48), (s * 0.13, 1.17, 0.55), m['chrome'], 0.01)
    # exhaust
    cyl(0.055, 0.62, (0.45, -1.3, 0.36), m['chrome'], rot=(math.pi / 2, 0, 0), verts=16)
    # driver (seated, hands on bar)
    box((0.42, 0.26, 0.56), (0, 0.22, 1.45), m['kurta'], 0.08)
    sphere(0.14, (0, 0.24, 1.92), m['skin'], segs=16)
    cyl(0.13, 0.12, (0, 0.24, 2.05), m['cap'], verts=16)
    box((0.2, 0.06, 0.05), (0, 0.37, 1.88), m['cap'], 0.01)  # moustache
    for s in (-1, 1):
        box((0.1, 0.46, 0.1), (s * 0.26, 0.48, 1.52), m['kurta'], 0.03, rot=(-0.4, 0, 0))
        box((0.16, 0.46, 0.14), (s * 0.11, 0.44, 1.12), mat('pants', 0x55524a, 0, 0.8), 0.04)
    # wheels (separate, transforms applied, origin at hub)
    def wheel(name, x, y, z):
        parts = []
        parts.append(torus(0.235, 0.075, (x, y, z), m['rubber'], rot=(0, math.pi / 2, 0)))
        parts.append(cyl(0.17, 0.12, (x, y, z), m['chrome'], rot=(0, math.pi / 2, 0), verts=24))
        parts.append(cyl(0.06, 0.2, (x, y, z), m['dark'], rot=(0, math.pi / 2, 0), verts=16))
        for k in range(6):
            a = k / 6 * math.pi
            parts.append(box((0.02, 0.32, 0.03), (x, y, z), m['dark'], 0, rot=(a, 0, 0)))
        for p in parts:
            p.select_set(True)
            for mod in p.modifiers:
                bpy.context.view_layer.objects.active = p
                bpy.ops.object.modifier_apply(modifier=mod.name)
        bpy.ops.object.select_all(action='DESELECT')
        for p in parts: p.select_set(True)
        bpy.context.view_layer.objects.active = parts[0]
        bpy.ops.object.join()
        w = bpy.context.active_object
        w.name = name
        bpy.context.scene.cursor.location = (x, y, z)
        bpy.ops.object.origin_set(type='ORIGIN_CURSOR')
        bpy.context.scene.cursor.location = (0, 0, 0)
    wheel('Wheel_RL', -0.7, -0.92, 0.31)
    wheel('Wheel_RR', 0.7, -0.92, 0.31)
    wheel('Wheel_F', 0, 1.18, 0.31)
    export('rickshaw')

# ------------------------------------------------------------------ TRUCK (Pakistani decorated)
def build_truck():
    reset(); m = M()
    body = mat('truck_red', 0xc81d25, 0.2, 0.35)
    wood = mat('wood', 0x7a5230, 0, 0.7)
    # chassis
    box((2.2, 8.0, 0.3), (0, 0, 0.75), m['dark'], 0.03)
    # cargo bed with painted wooden panels
    box((2.4, 4.8, 1.5), (0, -1.0, 1.7), wood, 0.04)
    for s in (-1, 1):
        for r in range(4):
            c = mat(f'tart{r}', ART[r % len(ART)], 0.1, 0.4)
            box((0.02, 4.6, 0.26), (s * 1.215, -1.0, 1.15 + r * 0.34), c, 0)
        for i in range(6):
            flower(s * 1.22, -3.0 + i * 0.8, 2.05, s, mat(f'tfl{i}', ART[(i + 3) % len(ART)], 0, 0.4))
    for r in range(4):
        box((2.3, 0.02, 0.26), (0, -3.41, 1.15 + r * 0.34), mat(f'tart{r}', ART[r % len(ART)], 0.1, 0.4), 0)
    # cab with tapered windscreen
    tapered_box((2.3, 1.9, 1.7), (0, 2.5, 1.75), body, top_scale=(0.96, 0.8), shift_y=-0.15, bevel=0.08)
    box((2.0, 0.03, 0.65), (0, 3.37, 2.0), m['glass'], 0, rot=(-0.1, 0, 0))
    box((2.32, 0.1, 0.3), (0, 3.45, 1.0), m['chrome'], 0.03)            # bumper
    for s in (-1, 1):
        cyl(0.16, 0.1, (s * 0.85, 3.47, 1.35), m['chrome'], rot=(math.pi / 2, 0, 0), verts=24)
        cyl(0.12, 0.02, (s * 0.85, 3.52, 1.35), m['head'], rot=(math.pi / 2, 0, 0), verts=24)
    # the famous painted "taj" crown over the cab
    tapered_box((2.3, 0.45, 1.2), (0, 2.25, 3.2), body, top_scale=(0.85, 1), bevel=0.05)
    for r in range(3):
        box((2.2, 0.02, 0.3), (0, 2.48, 2.85 + r * 0.33), mat(f'tart{r + 1}', ART[(r + 1) % len(ART)], 0.1, 0.4), 0)
    for i in range(7):
        sphere(0.08, (-0.95 + i * 0.32, 2.3, 3.85), mat(f'bulb{i % 4}', 0xffffff, 0, 0.2, emit=[0xff2a2a, 0xffd60a, 0x2bff88, 0x00e5ff][i % 4], strength=5), segs=10)
    # chains / jingles at the back
    for i in range(12):
        box((0.04, 0.03, 0.34), (-1.05 + i * 0.19, -3.45, 0.55), m['chrome'], 0.005)
    for s in (-1, 1):
        box((0.3, 0.05, 0.14), (s * 1.0, -3.42, 1.0), m['tail'], 0.01)
    # wheels (6) with hubs
    for x in (-1.0, 1.0):
        for y in (2.6, -1.6, -2.6):
            torus(0.38, 0.14, (x, y, 0.5), m['rubber'], rot=(0, math.pi / 2, 0))
            cyl(0.26, 0.28, (x, y, 0.5), m['chrome'], rot=(0, math.pi / 2, 0), verts=24)
    export('truck')

# ------------------------------------------------------------------ BUS
def build_bus():
    reset(); m = M()
    body = mat('bus_yellow', 0xffc21a, 0.15, 0.4)
    box((2.45, 8.6, 2.4), (0, 0, 1.6), body, 0.15)
    for s in (-1, 1):
        box((0.04, 7.6, 0.72), (s * 1.23, 0.2, 2.15), m['glass'], 0)
        for i in range(9):
            box((0.05, 0.08, 0.74), (s * 1.235, -3.4 + i * 0.85, 2.15), m['dark'], 0)
        for r in range(3):
            box((0.02, 8.2, 0.12), (s * 1.24, 0, 0.95 + r * 0.16), mat(f'bart{r}', ART[(r * 2) % len(ART)], 0.1, 0.4), 0)
    box((2.2, 0.04, 0.85), (0, 4.31, 2.2), m['glass'], 0)
    box((2.2, 0.04, 0.6), (0, -4.31, 2.25), m['glass'], 0)
    box((2.0, 6.5, 0.3), (0, 0.5, 2.97), m['dark'], 0.04)        # roof rack
    for i in range(5):
        box((random.uniform(0.5, 0.9), random.uniform(0.6, 1.0), random.uniform(0.3, 0.6)), (random.uniform(-0.6, 0.6), 3.0 - i * 1.3, 3.3), mat(f'lug{i}', random.choice([0x8b5a2b, 0x2e6b8a, 0xb33a3a, 0xd9c08a]), 0, 0.8), 0.04)
    for s in (-1, 1):
        box((0.3, 0.05, 0.16), (s * 1.0, -4.32, 0.95), m['tail'], 0.01)
        cyl(0.14, 0.05, (s * 0.85, 4.33, 1.0), m['head'], rot=(math.pi / 2, 0, 0), verts=20)
    for x in (-1.05, 1.05):
        for y in (3.0, -2.8):
            torus(0.38, 0.14, (x, y, 0.5), m['rubber'], rot=(0, math.pi / 2, 0))
            cyl(0.26, 0.3, (x, y, 0.5), m['chrome'], rot=(0, math.pi / 2, 0), verts=24)
    export('bus')

# ================================================================== LAHORE RUSH additions
def limb(p0, p1, r, m, verts=12, r2=None, name=None):
    """Cylinder (or cone r -> r2) running from p0 to p1."""
    p0, p1 = Vector(p0), Vector(p1)
    d = p1 - p0
    rot = d.to_track_quat('Z', 'Y').to_euler()
    return cyl(r, d.length, tuple((p0 + p1) / 2), m, rot=tuple(rot), verts=verts, r2=r2, name=name)

def join_as(name, parts, origin):
    """Apply modifiers, join parts into one object called `name`, origin at `origin` (wheels spin around it)."""
    bpy.ops.object.select_all(action='DESELECT')
    for p in parts:
        bpy.context.view_layer.objects.active = p
        for mod in list(p.modifiers):
            bpy.ops.object.modifier_apply(modifier=mod.name)
    for p in parts:
        p.select_set(True)
    bpy.context.view_layer.objects.active = parts[0]
    bpy.ops.object.join()
    o = bpy.context.active_object
    o.name = name
    bpy.context.scene.cursor.location = origin
    bpy.ops.object.origin_set(type='ORIGIN_CURSOR')
    bpy.context.scene.cursor.location = (0, 0, 0)
    return o

def shaped_sphere(r, loc, m, scale, fn, segs=32, bevel=0.0):
    """UV sphere whose unit-space vertices are reshaped by fn(Vector) before scaling."""
    bpy.ops.mesh.primitive_uv_sphere_add(radius=1, location=(0, 0, 0), segments=segs, ring_count=segs // 2)
    o = bpy.context.active_object
    bm = bmesh.new(); bm.from_mesh(o.data)
    for v in bm.verts:
        fn(v.co)
    bm.to_mesh(o.data); bm.free()
    o.scale = (r * scale[0], r * scale[1], r * scale[2])
    o.location = loc
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    return _finish(o, m, bevel, smooth=True)

def arc_boxes(cy, cz, R, a0, a1, n, size_x, thick, m, x=0.0, bevel=0.005):
    """A curved strip (mudguards) made of short boxes along an arc in the YZ plane."""
    out = []
    for i in range(n):
        a = a0 + (a1 - a0) * (i + 0.5) / n
        seg = 2 * R * math.sin((a1 - a0) / n / 2) * 1.08
        out.append(box((size_x, seg, thick), (x, cy + math.cos(a) * R, cz + math.sin(a) * R), m, bevel, rot=(a + math.pi / 2, 0, 0)))
    return out

# ------------------------------------------------------------------ 125 MOTORCYCLE + RIDER
def spoked_wheel(name, y, m, front):
    z = 0.31
    parts = [
        torus(0.262, 0.056, (0, y, z), m['tyre'], rot=(0, math.pi / 2, 0), maj=40, mn=14),
        torus(0.222, 0.014, (0, y, z), m['chrome'], rot=(0, math.pi / 2, 0), maj=40, mn=8),
        cyl(0.075 if front else 0.09, 0.13, (0, y, z), m['alu'], rot=(0, math.pi / 2, 0), verts=24, bevel=0.01),
        cyl(0.02, 0.2, (0, y, z), m['chrome'], rot=(0, math.pi / 2, 0), verts=12),
    ]
    for k in range(18):
        a = k / 18 * math.pi * 2
        side = 0.035 if k % 2 else -0.035
        p_rim = (0, y + math.cos(a + 0.3) * 0.218, z + math.sin(a + 0.3) * 0.218)
        p_hub = (side, y + math.cos(a) * 0.05, z + math.sin(a) * 0.05)
        parts.append(limb(p_hub, p_rim, 0.0045, m['chrome'], verts=4))
    # tread blocks for a bit of grip detail
    for k in range(28):
        a = k / 28 * math.pi * 2
        parts.append(box((0.1, 0.03, 0.014), (0, y + math.cos(a) * 0.316, z + math.sin(a) * 0.316), m['tyre'], 0, rot=(a + math.pi / 2, 0, 0)))
    return join_as(name, parts, (0, y, z))

def bike_mats():
    return {
        'paint': mat('paint', 0xc4121a, 0.35, 0.22),          # recoloured by the garage
        'stripe': mat('stripe', 0xf5f5f5, 0.2, 0.3),          # tank stripe (recoloured too)
        'chrome': mat('chrome', 0xeeeeee, 1.0, 0.08),
        'alu': mat('alu', 0xb9bcc0, 0.9, 0.3),
        'engine': mat('engine', 0x8e9196, 0.75, 0.38),
        'black': mat('black', 0x111111, 0.3, 0.45),
        'matte': mat('matte', 0x1b1b1b, 0.0, 0.8),
        'tyre': mat('tyre', 0x0d0d0d, 0.0, 0.92),
        'seat': mat('seat', 0x161616, 0.05, 0.55),
        'head': mat('headlamp', 0xfff6d0, 0.0, 0.05, emit=0xfff3c4, strength=8),
        'tail': mat('taillamp', 0xff1a1a, 0.0, 0.2, emit=0xff1a1a, strength=5),
        'amber': mat('amber', 0xffa000, 0.0, 0.2, emit=0xffa000, strength=3),
        'glass': mat('glass', 0xdfefff, 0.0, 0.02, alpha=0.5),
        'plate': mat('plate', 0xf4f4f0, 0.0, 0.4),
        'plateg': mat('plate_green', 0x0b6e3a, 0.0, 0.4),
        'gauge': mat('gauge', 0xf2f2f2, 0.0, 0.3, emit=0xbfe3ff, strength=0.6),
        'fringe': [mat(f'fringe{i}', c, 0.1, 0.4) for i, c in enumerate([0xd62828, 0xffd60a, 0x0b8f3a, 0x1565c0, 0xffffff])],
        # rider
        'skin': mat('skin', 0xa8714a, 0.0, 0.55),
        'kameez': mat('kameez', 0xf1ede2, 0.0, 0.78),        # recolourable
        'vest': mat('vest', 0x1e1e24, 0.0, 0.7),
        'hair': mat('hair', 0x141010, 0.0, 0.6),
        'shades': mat('shades', 0x0a0a0a, 0.8, 0.05),
        'chappal': mat('chappal', 0x6b3e1e, 0.0, 0.6),
    }

def build_bike():
    reset(); m = bike_mats()
    YF, YR, ZW = 0.64, -0.6, 0.31
    # ---- wheels (spin in game)
    spoked_wheel('Wheel_F', YF, m, True)
    spoked_wheel('Wheel_R', YR, m, False)
    # ---- front end: fork (raked), headlamp, gauges, handlebar, mirrors
    for s in (-1, 1):
        limb((s * 0.085, YF, ZW), (s * 0.08, YF - 0.2, 0.98), 0.024, m['chrome'], verts=16)
        limb((s * 0.085, YF + 0.01, ZW - 0.02), (s * 0.085, YF - 0.06, 0.56), 0.034, m['alu'], verts=16)   # lower leg
    box((0.22, 0.08, 0.05), (0, YF - 0.19, 0.95), m['black'], 0.012)                                    # triple clamp
    box((0.22, 0.08, 0.04), (0, YF - 0.21, 1.03), m['chrome'], 0.012)
    # front mudguard (chrome, follows the wheel)
    arc_boxes(YF, ZW, 0.34, math.radians(25), math.radians(150), 9, 0.13, 0.012, m['chrome'])
    # headlamp bucket + lens + chrome ring
    cyl(0.105, 0.15, (0, YF - 0.12, 0.93), m['chrome'], rot=(math.pi / 2, 0, 0), verts=32, r2=0.085)
    cyl(0.098, 0.015, (0, YF - 0.04, 0.93), m['head'], rot=(math.pi / 2, 0, 0), verts=32)
    torus(0.1, 0.012, (0, YF - 0.035, 0.93), m['chrome'], rot=(math.pi / 2, 0, 0), maj=32, mn=8)
    for s in (-1, 1):  # indicators on stalks
        limb((s * 0.09, YF - 0.16, 0.95), (s * 0.2, YF - 0.12, 0.95), 0.008, m['chrome'], verts=6)
        sphere(0.03, (s * 0.21, YF - 0.11, 0.95), m['amber'], scale=(1, 1.4, 0.8), segs=12)
    # speedo pod
    cyl(0.055, 0.05, (0, YF - 0.26, 1.07), m['black'], rot=(math.pi / 2 - 0.5, 0, 0), verts=24)
    cyl(0.046, 0.006, (0, YF - 0.24, 1.085), m['gauge'], rot=(math.pi / 2 - 0.5, 0, 0), verts=24)
    # handlebar: rises then sweeps back
    hb_y, hb_z = YF - 0.34, 1.1
    limb((0, YF - 0.24, 1.04), (0, hb_y, hb_z), 0.012, m['chrome'], verts=8)
    for s in (-1, 1):
        limb((0, hb_y, hb_z), (s * 0.2, hb_y + 0.01, hb_z + 0.03), 0.012, m['chrome'], verts=8)
        limb((s * 0.2, hb_y + 0.01, hb_z + 0.03), (s * 0.36, hb_y - 0.06, hb_z + 0.02), 0.012, m['chrome'], verts=8)
        limb((s * 0.3, hb_y - 0.035, hb_z + 0.022), (s * 0.4, hb_y - 0.075, hb_z + 0.018), 0.019, m['matte'], verts=12)   # grips
        limb((s * 0.22, hb_y + 0.01, hb_z + 0.03), (s * 0.26, hb_y - 0.07, hb_z + 0.02), 0.006, m['alu'], verts=6)       # levers
        limb((s * 0.18, hb_y, hb_z + 0.03), (s * 0.24, hb_y + 0.02, hb_z + 0.34), 0.006, m['chrome'], verts=6)          # mirror stalks
        cyl(0.05, 0.015, (s * 0.245, hb_y + 0.02, hb_z + 0.37), m['chrome'], rot=(math.pi / 2, 0, 0), verts=20)
        cyl(0.044, 0.004, (s * 0.245, hb_y + 0.012, hb_z + 0.37), m['glass'], rot=(math.pi / 2, 0, 0), verts=20)
    # handlebar jhalar (tassels) — every Lahori 125 has some flair
    for i in range(10):
        x = -0.18 + i * 0.04
        box((0.012, 0.012, 0.12), (x, hb_y + 0.02, hb_z - 0.07), m['fringe'][i % 5], 0)
    # ---- frame + tank + seat
    limb((0, YF - 0.22, 0.98), (0, 0.18, 0.42), 0.03, m['black'], verts=12)                  # down tube
    limb((0, YF - 0.22, 1.0), (0, -0.25, 0.86), 0.028, m['black'], verts=12)                 # backbone
    limb((0, -0.25, 0.86), (0, -0.72, 0.82), 0.022, m['black'], verts=12)                    # rear subframe
    # tank: wide at the front, tapering into the seat, flat underside
    def tank_shape(v):
        if v.z < 0: v.z *= 0.45
        k = 0.78 + 0.3 * max(-1, min(1, v.y))
        v.x *= k
        v.z += 0.12 * max(0, v.y)
    shaped_sphere(1, (0, 0.2, 0.93), m['paint'], (0.175, 0.31, 0.12), tank_shape, segs=40)
    for s in (-1, 1):
        box((0.012, 0.36, 0.035), (s * 0.15, 0.2, 0.95), m['stripe'], 0.004, rot=(-0.12, 0, s * 0.18))      # stripe
        box((0.01, 0.12, 0.06), (s * 0.135, 0.06, 0.89), m['matte'], 0.01)                                     # knee pad
    cyl(0.035, 0.02, (0, 0.28, 1.07), m['chrome'], verts=20)                                                   # fuel cap
    # seat
    tapered_box((0.27, 0.7, 0.1), (0, -0.37, 0.9), m['seat'], top_scale=(0.92, 0.96), bevel=0.045)
    box((0.2, 0.62, 0.012), (0, -0.37, 0.955), mat('seat_stitch', 0x2a2a2a, 0, 0.5), 0.004)
    limb((-0.13, -0.6, 0.86), (0.13, -0.6, 0.86), 0.012, m['chrome'], verts=8)                                # grab rail
    for s in (-1, 1):
        limb((s * 0.13, -0.6, 0.86), (s * 0.13, -0.2, 0.84), 0.012, m['chrome'], verts=8)
    # side covers (paint) + badge
    for s in (-1, 1):
        tapered_box((0.03, 0.26, 0.18), (s * 0.12, -0.24, 0.71), m['paint'], top_scale=(1, 1.25), bevel=0.02)
        box((0.006, 0.12, 0.03), (s * 0.137, -0.24, 0.72), m['chrome'], 0.003)
    # ---- engine: finned cylinder tilted forward, crankcase, round side covers
    eng_y = 0.08
    box((0.24, 0.36, 0.22), (0, eng_y - 0.02, 0.42), m['engine'], 0.05)                        # crankcase
    for k in range(7):
        box((0.22 - k * 0.004, 0.2, 0.018), (0, eng_y + 0.12 + k * 0.007, 0.56 + k * 0.032), m['engine'], 0.004, rot=(-0.28, 0, 0))   # fins
    box((0.16, 0.14, 0.24), (0, eng_y + 0.13, 0.66), m['engine'], 0.03, rot=(-0.28, 0, 0))     # barrel core
    box((0.2, 0.17, 0.06), (0, eng_y + 0.2, 0.8), m['alu'], 0.02, rot=(-0.28, 0, 0))          # rocker cover
    cyl(0.1, 0.04, (0.135, eng_y - 0.03, 0.43), m['chrome'], rot=(0, math.pi / 2, 0), verts=28, bevel=0.01)   # clutch cover (right)
    cyl(0.085, 0.04, (-0.135, eng_y - 0.06, 0.44), m['alu'], rot=(0, math.pi / 2, 0), verts=28, bevel=0.01)  # magneto (left)
    box((0.08, 0.1, 0.08), (0.06, eng_y - 0.04, 0.66), m['black'], 0.02)                       # carb
    cyl(0.05, 0.1, (0.08, eng_y - 0.14, 0.68), m['black'], rot=(math.pi / 2, 0, 0), verts=16)  # air filter snout
    # crash guard (very Pakistani)
    limb((-0.2, eng_y + 0.26, 0.42), (0.2, eng_y + 0.26, 0.42), 0.014, m['chrome'], verts=8)
    for s in (-1, 1):
        limb((s * 0.2, eng_y + 0.26, 0.42), (s * 0.06, eng_y + 0.32, 0.78), 0.014, m['chrome'], verts=8)
    # exhaust: header out of the head, down, under, then the long chrome muffler on the right
    pts = [(0.04, eng_y + 0.3, 0.72), (0.08, eng_y + 0.34, 0.5), (0.13, eng_y + 0.22, 0.27), (0.17, eng_y - 0.2, 0.27), (0.19, -0.3, 0.33)]
    for a, b in zip(pts, pts[1:]):
        limb(a, b, 0.022, m['chrome'], verts=14)
        sphere(0.022, b, m['chrome'], segs=12)
    limb((0.19, -0.28, 0.33), (0.2, -0.86, 0.42), 0.048, m['chrome'], verts=28, r2=0.042)       # muffler
    cyl(0.03, 0.03, (0.2, -0.875, 0.42), m['black'], rot=(math.pi / 2 - 0.15, 0, 0), verts=16)
    box((0.02, 0.24, 0.07), (0.235, -0.5, 0.39), m['chrome'], 0.01, rot=(-0.15, 0, 0))         # heat shield
    # ---- rear: swingarm, shocks, chain guard, mudguard, tail lamp, plate, saree guard, mud flap
    for s in (-1, 1):
        limb((s * 0.1, -0.08, 0.38), (s * 0.1, YR, ZW), 0.022, m['black'], verts=10)                   # swingarm
        limb((s * 0.13, YR + 0.05, ZW + 0.02), (s * 0.13, -0.5, 0.84), 0.018, m['chrome'], verts=10)  # shock rod
        limb((s * 0.13, YR + 0.03, 0.4), (s * 0.13, -0.53, 0.72), 0.032, m['black'], verts=14)          # damper body
        for k in range(8):                                                                               # spring coils
            t = (k + 0.5) / 8
            torus(0.034, 0.006, (s * 0.13, YR + 0.03 + (0.07 - 0.0) * t + 0.0, 0.42 + 0.3 * t), m['chrome'], rot=(0.2, 0, 0), maj=14, mn=5)
    box((0.04, 0.6, 0.08), (-0.13, -0.27, 0.36), m['black'], 0.015, rot=(0.07, 0, 0))              # chain guard
    arc_boxes(YR, ZW, 0.33, math.radians(20), math.radians(140), 8, 0.14, 0.012, m['paint'])         # rear guard (paint)
    box((0.13, 0.07, 0.07), (0, -0.93, 0.82), m['tail'], 0.015)                                     # tail lamp
    box((0.15, 0.04, 0.03), (0, -0.92, 0.86), m['chrome'], 0.01)
    box((0.2, 0.01, 0.11), (0, -0.97, 0.7), m['plate'], 0.006, rot=(0.25, 0, 0))                   # number plate
    box((0.2, 0.006, 0.025), (0, -0.976, 0.745), m['plateg'], 0.002, rot=(0.25, 0, 0))
    for s in (-1, 1):
        limb((s * 0.08, -0.88, 0.8), (s * 0.24, -0.9, 0.8), 0.007, m['chrome'], verts=6)
        sphere(0.025, (s * 0.25, -0.9, 0.8), m['amber'], scale=(1, 1.4, 0.8), segs=12)
    # saree guard (left, over the rear wheel)
    for k in range(6):
        a = math.radians(-20 + k * 26)
        limb((-0.17, YR, ZW), (-0.17, YR + math.cos(a) * 0.3, ZW + math.sin(a) * 0.3), 0.006, m['chrome'], verts=5)
    torus(0.3, 0.007, (-0.17, YR, ZW), m['chrome'], rot=(0, math.pi / 2, 0), maj=28, mn=5)
    # rubber mud flap with a fringe
    box((0.16, 0.008, 0.18), (0, -0.84, 0.36), m['matte'], 0.004, rot=(0.15, 0, 0))
    for i in range(7):
        box((0.01, 0.006, 0.07), (-0.06 + i * 0.02, -0.85, 0.24), m['fringe'][i % 5], 0)
    # pegs, kick lever (right), gear lever (left), side stand
    for s in (-1, 1):
        limb((s * 0.1, -0.02, 0.33), (s * 0.24, -0.02, 0.33), 0.014, m['matte'], verts=8)
        limb((s * 0.11, -0.42, 0.52), (s * 0.22, -0.44, 0.52), 0.012, m['matte'], verts=8)            # pillion pegs
    limb((0.16, -0.14, 0.42), (0.19, -0.33, 0.48), 0.012, m['chrome'], verts=6)                         # kick start
    limb((-0.15, 0.02, 0.33), (-0.16, 0.16, 0.36), 0.01, m['chrome'], verts=6)                          # gear lever
    limb((-0.1, -0.1, 0.3), (-0.2, -0.22, 0.04), 0.012, m['black'], verts=6)                            # side stand (up-ish)
    # ---- rider: a sharp Lahori munda — kameez with collar + buttons, waistcoat, rolled sleeves, watch, aviators
    m.update({
        'beard': mat('beard', 0x2a1d16, 0.0, 0.85),
        'lip': mat('lip', 0x8a4a3a, 0.0, 0.5),
        'gold': mat('gold_trim', 0xd4af37, 1.0, 0.25),
        'lens': mat('lens', 0x1a2a3a, 0.9, 0.04),
        'sole': mat('sole', 0x3a2414, 0.0, 0.7),
        'eye': mat('eye_white', 0xf2efe8, 0.0, 0.3),
    })
    hip = Vector((0, -0.22, 0.99))
    chest = Vector((0, -0.1, 1.34))
    sh = Vector((0, -0.05, 1.5))
    # torso: pelvis, abdomen and a broad chest built from ellipsoids, slight forward lean
    sphere(0.19, tuple(hip + Vector((0, 0, 0.05))), m['kameez'], scale=(1.05, 0.85, 0.7), segs=20)
    sphere(0.17, tuple((hip + chest) / 2), m['kameez'], scale=(1.0, 0.78, 1.0), segs=20)
    sphere(0.2, tuple(chest), m['kameez'], scale=(1.08, 0.7, 0.95), segs=24)
    sphere(0.19, tuple(sh), m['kameez'], scale=(1.18, 0.62, 0.42), segs=20)      # shoulders
    # long kameez skirt draping over the seat and thighs
    limb(tuple(hip + Vector((0, 0.0, 0.08))), tuple(hip + Vector((0, -0.04, -0.2))), 0.2, m['kameez'], verts=20, r2=0.245)
    for s_ in (-1, 1):
        box((0.17, 0.3, 0.02), (s_ * 0.1, -0.05, 0.92), m['kameez'], 0.008, rot=(-0.12, 0, 0))   # front panels over the thighs
    # placket + gold buttons, band collar
    box((0.035, 0.01, 0.26), tuple(chest + Vector((0, 0.142, 0.05))), m['kameez'], 0.004, rot=(-0.12, 0, 0))
    for k in range(3):
        sphere(0.009, tuple(chest + Vector((0, 0.15, 0.14 - k * 0.07))), m['gold'], segs=8)
    torus(0.062, 0.016, tuple(sh + Vector((0, 0.02, 0.08))), m['kameez'], rot=(0.15, 0, 0), maj=20, mn=6)
    # waistcoat: back + two front panels left open in the middle, with buttons
    sphere(0.203, tuple(chest + Vector((0, -0.006, -0.01))), m['vest'], scale=(1.085, 0.71, 0.93), segs=28)
    for s_ in (-1, 1):
        box((0.12, 0.02, 0.36), tuple(chest + Vector((s_ * 0.085, 0.128, -0.03))), m['vest'], 0.01, rot=(-0.12, 0, s_ * 0.12))
        for k in range(3):
            sphere(0.008, tuple(chest + Vector((s_ * 0.035, 0.142, 0.08 - k * 0.08))), m['gold'], segs=8)
    # neck
    limb(tuple(sh + Vector((0, 0.015, 0.04))), tuple(sh + Vector((0, 0.03, 0.15))), 0.052, m['skin'], verts=14)

    # ---- head (its own object so the game can turn it)
    hc = sh + Vector((0, 0.04, 0.26))
    head_parts = [
        sphere(0.1, tuple(hc), m['skin'], scale=(0.92, 1.02, 1.1), segs=24),                               # cranium
        sphere(0.075, tuple(hc + Vector((0, 0.035, -0.07))), m['skin'], scale=(0.95, 1.0, 0.85), segs=18),  # jaw
        sphere(0.077, tuple(hc + Vector((0, 0.03, -0.075))), m['beard'], scale=(0.98, 1.0, 0.8), segs=18),  # stubble beard
        limb(tuple(hc + Vector((0, 0.09, 0.0))), tuple(hc + Vector((0, 0.125, -0.035))), 0.018, m['skin'], verts=10, r2=0.012),  # nose
        box((0.065, 0.02, 0.016), tuple(hc + Vector((0, 0.104, -0.058))), m['beard'], 0.006),            # moustache
        box((0.04, 0.012, 0.008), tuple(hc + Vector((0, 0.102, -0.08))), m['lip'], 0.003),
        # hair: short sides + a quiff
        sphere(0.104, tuple(hc + Vector((0, -0.018, 0.03))), m['hair'], scale=(0.95, 1.0, 0.95), segs=22),
        sphere(0.06, tuple(hc + Vector((0, 0.05, 0.085))), m['hair'], scale=(1.3, 1.0, 0.6), segs=14),
        # aviators: two lenses, gold bridge and arms
        sphere(0.028, tuple(hc + Vector((-0.036, 0.098, 0.012))), m['lens'], scale=(1.1, 0.35, 0.85), segs=14),
        sphere(0.028, tuple(hc + Vector((0.036, 0.098, 0.012))), m['lens'], scale=(1.1, 0.35, 0.85), segs=14),
        box((0.03, 0.006, 0.005), tuple(hc + Vector((0, 0.104, 0.026))), m['gold'], 0.001),
    ]
    for s_ in (-1, 1):
        head_parts.append(limb(tuple(hc + Vector((s_ * 0.066, 0.09, 0.02))), tuple(hc + Vector((s_ * 0.088, 0.0, 0.015))), 0.003, m['gold'], verts=5))
        head_parts.append(sphere(0.024, tuple(hc + Vector((s_ * 0.093, 0.0, -0.005))), m['skin'], scale=(0.4, 0.8, 1.2), segs=10))     # ears
        head_parts.append(box((0.04, 0.01, 0.008), tuple(hc + Vector((s_ * 0.036, 0.1, 0.045))), m['hair'], 0.003, rot=(0, s_ * 0.15, 0)))  # eyebrows
    join_as('RiderHead', head_parts, tuple(sh + Vector((0, 0.03, 0.12))))

    # ---- arms: kameez sleeve rolled to the elbow, forearm, gold watch, hand wrapped on the grip
    for s_ in (-1, 1):
        shoulder = sh + Vector((s_ * 0.2, 0, -0.02))
        elbow = Vector((s_ * 0.3, 0.14, 1.23))
        wrist = Vector((s_ * 0.345, hb_y - 0.1, hb_z + 0.035))
        grip = Vector((s_ * 0.35, hb_y - 0.055, hb_z + 0.022))
        limb(tuple(shoulder), tuple(elbow), 0.055, m['kameez'], verts=14, r2=0.05)
        torus(0.05, 0.016, tuple(elbow), m['kameez'], rot=(1.0, 0, 0), maj=16, mn=6)                       # rolled cuff
        sphere(0.045, tuple(elbow), m['skin'], segs=12)
        limb(tuple(elbow), tuple(wrist), 0.038, m['skin'], verts=12, r2=0.03)
        if s_ < 0:
            torus(0.033, 0.009, tuple(wrist + Vector((0, 0.01, 0))), m['gold'], rot=(1.3, 0, 0), maj=16, mn=6)  # watch
            box((0.03, 0.012, 0.03), tuple(wrist + Vector((0, 0.012, 0.03))), m['gold'], 0.004)
        sphere(0.034, tuple(grip + Vector((0, 0.0, 0.015))), m['skin'], scale=(1.4, 1.0, 0.8), segs=12)    # palm over the grip
        for f in range(4):
            limb(tuple(grip + Vector((s_ * (-0.035 + f * 0.022), 0.015, 0.025))), tuple(grip + Vector((s_ * (-0.035 + f * 0.022), 0.03, -0.022))), 0.009, m['skin'], verts=6)
    # ---- legs: baggy shalwar, gathered at the ankle; peshawari chappals with crossed straps
    for s_ in (-1, 1):
        hp = hip + Vector((s_ * 0.1, 0.02, -0.03))
        knee = Vector((s_ * 0.175, 0.2, 0.86))
        ankle = Vector((s_ * 0.205, 0.02, 0.44))
        limb(tuple(hp), tuple(knee), 0.09, m['kameez'], verts=16, r2=0.075)
        sphere(0.078, tuple(knee), m['kameez'], segs=14)
        limb(tuple(knee), tuple(ankle), 0.075, m['kameez'], verts=16, r2=0.05)
        for k in range(3):                                                                                   # folds
            t_ = 0.3 + k * 0.22
            torus(0.07 - k * 0.006, 0.008, tuple(knee.lerp(ankle, t_)), m['kameez'], rot=(0.35, 0, 0), maj=16, mn=5)
        torus(0.045, 0.012, tuple(ankle), m['kameez'], rot=(0.2, 0, 0), maj=14, mn=5)                      # cuff
        foot = ankle + Vector((0, 0.05, -0.065))
        sphere(0.04, tuple(foot + Vector((0, 0.02, 0.015))), m['skin'], scale=(1.0, 2.2, 0.7), segs=12)
        box((0.09, 0.24, 0.025), tuple(foot), m['sole'], 0.008)
        for k in range(2):
            box((0.095, 0.025, 0.02), tuple(foot + Vector((0, 0.02 + k * 0.06, 0.03))), m['chappal'], 0.005, rot=(0, 0, (0.5 if k else -0.5)))
        box((0.06, 0.04, 0.03), tuple(foot + Vector((0, 0.1, 0.022))), m['chappal'], 0.008)
    export('bike')

# ------------------------------------------------------------------ TONGA (horse cart, faces +Y)
def build_tonga():
    reset()
    wood = mat('tonga_wood', 0x5a2e14, 0.1, 0.45)
    paint = mat('tonga_paint', 0x0b5e3a, 0.2, 0.35)
    gold = mat('brass', 0xd4a23a, 1.0, 0.25)
    canopy = mat('tonga_canopy', 0x1c1c1c, 0.0, 0.75)
    seat = mat('tonga_seat', 0x8b1a1a, 0.0, 0.5)
    horse = mat('horse', 0x5b3a22, 0.0, 0.6)
    mane = mat('mane', 0x1a120c, 0.0, 0.7)
    black = mat('t_black', 0x111111, 0.2, 0.5)
    white = mat('t_white', 0xf2efe6, 0, 0.6)
    plume = [mat(f'plume{i}', c, 0, 0.5) for i, c in enumerate([0xd62828, 0xffd60a, 0xe91e63, 0x1565c0])]
    # cart body (behind the axle), two big wheels
    box((1.35, 1.5, 0.12), (0, -0.6, 1.0), wood, 0.03)
    box((1.4, 0.06, 0.45), (0, -1.35, 1.25), paint, 0.02)
    for s in (-1, 1):
        box((0.06, 1.5, 0.3), (s * 0.68, -0.6, 1.18), paint, 0.015)
        for i in range(4):
            sphere(0.03, (s * 0.71, -1.2 + i * 0.4, 1.2), gold, segs=10)
    box((1.3, 0.55, 0.14), (0, -0.25, 1.32), seat, 0.05)                     # front bench (forward-facing)
    box((1.3, 0.12, 0.45), (0, -0.52, 1.58), seat, 0.04)
    box((1.3, 0.55, 0.14), (0, -1.0, 1.32), seat, 0.05)                      # rear bench (backward-facing)
    box((1.3, 0.12, 0.45), (0, -0.73, 1.58), seat, 0.04)
    # canopy on four posts
    for x in (-0.62, 0.62):
        for y in (-1.25, 0.1):
            cyl(0.02, 1.2, (x, y, 1.75), gold, verts=8)
    cyl(0.7, 1.55, (0, -0.58, 2.35), canopy, rot=(math.pi / 2, 0, 0), verts=32)
    o = bpy.context.active_object; o.scale = (1, 1, 0.3); bpy.ops.object.transform_apply(scale=True)
    for i in range(14):
        box((0.06, 0.02, 0.12), (-0.65 + i * 0.1, 0.18, 2.22), plume[i % 4], 0)
    for side in (-1, 1):
        for i in range(10):
            box((0.02, 0.06, 0.12), (side * 0.72, -1.3 + i * 0.15, 2.22), plume[i % 4], 0)
    # wheels
    for s in (-1, 1):
        x = s * 0.8
        torus(0.62, 0.035, (x, -0.6, 0.66), black, rot=(0, math.pi / 2, 0), maj=40, mn=8)
        torus(0.58, 0.03, (x, -0.6, 0.66), wood, rot=(0, math.pi / 2, 0), maj=40, mn=8)
        cyl(0.1, 0.16, (x, -0.6, 0.66), gold, rot=(0, math.pi / 2, 0), verts=16)
        for k in range(12):
            a = k / 12 * math.pi * 2
            limb((x, -0.6, 0.66), (x, -0.6 + math.cos(a) * 0.58, 0.66 + math.sin(a) * 0.58), 0.018, wood, verts=6)
    cyl(0.03, 1.7, (0, -0.6, 0.66), black, rot=(0, math.pi / 2, 0), verts=8)
    # shafts to the horse
    for s in (-1, 1):
        limb((s * 0.4, 0.1, 1.0), (s * 0.32, 2.2, 1.15), 0.03, wood, verts=8)
    # driver (kochwan) on the front bench, reins in hand
    k_mat = mat('k_kurta', 0xe8e2d0, 0, 0.75)
    limb((0, -0.2, 1.42), (0, -0.12, 1.92), 0.16, k_mat, verts=14, r2=0.18)
    sphere(0.12, (0, -0.1, 2.1), mat('k_skin', 0x9a6040, 0, 0.55), segs=16)
    cyl(0.13, 0.12, (0, -0.1, 2.22), mat('k_turban', 0xf2f2f2, 0, 0.6), verts=16, r2=0.15)
    for s in (-1, 1):
        limb((s * 0.18, -0.1, 1.85), (s * 0.18, 0.25, 1.55), 0.045, k_mat, verts=10)
        limb((s * 0.18, 0.25, 1.55), (s * 0.32, 2.0, 1.6), 0.006, black, verts=4)              # reins
        limb((s * 0.1, -0.15, 1.42), (s * 0.12, 0.2, 1.38), 0.07, k_mat, verts=10)
        limb((s * 0.12, 0.2, 1.38), (s * 0.12, 0.3, 1.02), 0.06, k_mat, verts=10)
    # horse
    sphere(0.4, (0, 2.0, 1.45), horse, scale=(0.75, 1.55, 0.85), segs=28)                      # barrel
    sphere(0.3, (0, 2.5, 1.55), horse, scale=(0.85, 0.9, 1.0), segs=20)                         # chest
    limb((0, 2.62, 1.6), (0, 2.95, 2.25), 0.17, horse, verts=16, r2=0.12)                       # neck
    sphere(0.12, (0, 3.08, 2.2), horse, scale=(0.9, 1.9, 0.95), segs=18)                        # head
    sphere(0.08, (0, 3.28, 2.13), mat('muzzle', 0x2a1a10, 0, 0.6), scale=(1, 1.1, 0.9), segs=12)
    for s in (-1, 1):
        cyl(0.03, 0.12, (s * 0.06, 2.98, 2.36), horse, verts=8, r2=0.008)                       # ears
        sphere(0.022, (s * 0.09, 3.12, 2.27), black, segs=8)
        for y in (1.55, 2.45):
            limb((s * 0.17, y, 1.25), (s * 0.17, y + 0.04, 0.6), 0.07, horse, verts=10, r2=0.05)
            limb((s * 0.17, y + 0.04, 0.6), (s * 0.17, y, 0.08), 0.045, horse, verts=10)
            cyl(0.06, 0.08, (s * 0.17, y, 0.04), black, verts=12)
            torus(0.05, 0.015, (s * 0.17, y, 0.14), white, maj=12, mn=5)                        # white socks band
    for i in range(7):
        box((0.04, 0.12, 0.12), (0, 2.65 + i * 0.05, 1.82 + i * 0.07), mane, 0.01, rot=(-0.6, 0, 0))
    limb((0, 1.4, 1.6), (0, 1.25, 0.9), 0.05, mane, verts=8, r2=0.025)                           # tail
    # harness, brass bells and the colourful plume (kalgi)
    torus(0.24, 0.035, (0, 2.62, 1.75), mat('collar', 0x8b1a1a, 0, 0.5), rot=(0.5, 0, 0), maj=24, mn=8)
    for k in range(7):
        a = k / 7 * math.pi * 2
        sphere(0.03, (math.cos(a) * 0.25, 2.62, 1.75 + math.sin(a) * 0.22), gold, segs=10)
    box((0.55, 0.5, 0.05), (0, 2.0, 1.82), mat('saddle_cloth', 0xd62828, 0, 0.6), 0.02)
    for i in range(4):
        limb((0, 3.0, 2.34), (math.sin(i) * 0.05, 2.95 - i * 0.03, 2.72), 0.02, plume[i], verts=6, r2=0.005)
    export('tonga')

# ------------------------------------------------------------------ MINAR-E-PAKISTAN
def build_minar():
    reset()
    stone = mat('minar_stone', 0xe9e4d8, 0.0, 0.55)
    marble = mat('minar_marble', 0xf7f5ef, 0.05, 0.3)
    green = mat('minar_green', 0x0b6e3a, 0.1, 0.5)
    shade = mat('minar_shade', 0xcfc8b8, 0.0, 0.6)
    lamp = mat('minar_lamp', 0xfff3c4, 0, 0.2, emit=0xfff0c0, strength=8)
    # star-shaped platform: stacked rotated squares
    for i, (s, h) in enumerate([(34, 1.2), (26, 1.2), (19, 1.2)]):
        z = 0.6 + i * 1.2
        box((s, s, h), (0, 0, z), shade if i % 2 == 0 else stone, 0.05)
        box((s, s, h), (0, 0, z), shade if i % 2 == 0 else stone, 0.05, rot=(0, 0, math.pi / 4))
    # the four flower-petal walls rising around the base
    for k in range(4):
        a = k * math.pi / 2 + math.pi / 4
        cx, cy = math.cos(a) * 5.2, math.sin(a) * 5.2
        bpy.ops.mesh.primitive_cylinder_add(radius=4.2, depth=0.5, vertices=48, location=(cx, cy, 3.6 + 4.0), rotation=(math.pi / 2, 0, a + math.pi / 2))
        o = bpy.context.active_object
        o.scale = (1, 1.9, 1)
        bpy.ops.object.transform_apply(scale=True, rotation=True)
        bm = bmesh.new(); bm.from_mesh(o.data)
        bmesh.ops.delete(bm, geom=[v for v in bm.verts if v.co.z < 3.6 + 4.0 - 0.01 - 3.0], context='VERTS')
        bm.to_mesh(o.data); bm.free()
        _finish(o, marble, smooth=True)
    # fluted, tapering shaft with balconies
    z0 = 3.6
    levels = [(4.2, 3.4, 14), (3.4, 2.8, 14), (2.8, 2.3, 12), (2.3, 1.9, 10), (1.9, 1.6, 8)]
    z = z0
    for i, (r0, r1, h) in enumerate(levels):
        cyl(r0, h, (0, 0, z + h / 2), stone, verts=20, r2=r1)
        for k in range(20):                                   # flutes
            a = (k + 0.5) / 20 * math.pi * 2
            limb((math.cos(a) * r0 * 0.99, math.sin(a) * r0 * 0.99, z), (math.cos(a) * r1 * 0.99, math.sin(a) * r1 * 0.99, z + h), 0.12, shade, verts=6)
        z += h
        if i < len(levels) - 1:
            cyl(r1 + 0.8, 0.5, (0, 0, z + 0.25), marble, verts=32)        # balcony
            for k in range(16):
                a = k / 16 * math.pi * 2
                cyl(0.06, 0.8, (math.cos(a) * (r1 + 0.75), math.sin(a) * (r1 + 0.75), z + 0.9), marble, verts=6)
            torus(r1 + 0.75, 0.07, (0, 0, z + 1.3), marble, maj=40, mn=6)
            cyl(r1 + 0.3, 0.3, (0, 0, z + 0.65), green, verts=32)
    # top: lantern + dome + finial
    cyl(1.7, 2.4, (0, 0, z + 1.2), marble, verts=16)
    for k in range(8):
        a = k / 8 * math.pi * 2
        box((0.5, 0.08, 1.6), (math.cos(a) * 1.71, math.sin(a) * 1.71, z + 1.2), mat('minar_dark', 0x40444a, 0, 0.6), 0, rot=(0, 0, a + math.pi / 2))
    sphere(1.8, (0, 0, z + 2.4), marble, scale=(1, 1, 1.25), segs=28)
    cyl(0.12, 2.6, (0, 0, z + 5.6), mat('minar_gold', 0xd4af37, 1.0, 0.25), verts=10)
    sphere(0.35, (0, 0, z + 4.6), mat('minar_gold', 0xd4af37, 1.0, 0.25), segs=12)
    for k in range(4):
        a = k * math.pi / 2 + math.pi / 4
        sphere(0.6, (math.cos(a) * 14, math.sin(a) * 14, 4.2), lamp, segs=10)
    export('minar')

# ------------------------------------------------------------------ BADSHAHI MOSQUE (faces +X toward the road)
def build_badshahi():
    reset()
    red = mat('sandstone', 0xa8452e, 0.0, 0.7)
    red_dk = mat('sandstone_dk', 0x7f3020, 0.0, 0.75)
    marble = mat('b_marble', 0xf6f3ea, 0.05, 0.3)
    dark = mat('b_recess', 0x3a2218, 0.0, 0.8)
    gold = mat('b_gold', 0xd4af37, 1.0, 0.25)
    W, D, H = 84, 26, 22                    # prayer hall (W along Y = along the road)
    box((D, W, H), (0, 0, H / 2), red, 0.1)
    box((D + 1, W + 1, 1.2), (0, 0, H + 0.6), red_dk, 0.05)
    # white marble panel bands + arched bays on the facade (+X face)
    for i in range(-5, 6):
        if i == 0: continue
        y = i * 7.2
        box((0.4, 4.2, 9.5), (D / 2 + 0.1, y, 6.5), dark, 0.05)
        box((0.5, 4.8, 0.5), (D / 2 + 0.15, y, 11.5), marble, 0.02)
        for s in (-1, 1):
            box((0.5, 0.45, 10.5), (D / 2 + 0.15, y + s * 2.4, 6.2), marble, 0.02)
        cyl(2.1, 0.5, (D / 2 + 0.16, y, 11.3), dark, rot=(0, math.pi / 2, 0), verts=16)
    box((0.5, W, 0.6), (D / 2 + 0.15, 0, 15.5), marble, 0.02)
    # central iwan: tall projecting portal with a huge pointed arch
    box((6, 22, H + 8), (D / 2 + 2, 0, (H + 8) / 2), red, 0.1)
    box((0.6, 13, 20), (D / 2 + 5.1, 0, 10.5), dark, 0.05)
    cyl(6.5, 0.6, (D / 2 + 5.1, 0, 20.5), dark, rot=(0, math.pi / 2, 0), verts=24)
    for s in (-1, 1):
        box((0.7, 1.0, H + 8), (D / 2 + 5.2, s * 7.4, (H + 8) / 2), marble, 0.03)
        cyl(0.7, 4, (D / 2 + 5, s * 10.5, H + 10), marble, verts=8)                      # pinnacles
        sphere(0.9, (D / 2 + 5, s * 10.5, H + 12.3), marble, segs=12)
    box((0.7, 22, 1.0), (D / 2 + 5.2, 0, H + 7.5), marble, 0.03)
    # three marble domes on drums (central one bigger)
    for y, r in ((0, 11.5), (-24, 8.5), (24, 8.5)):
        cyl(r * 0.92, 4.5, (0, y, H + 3.4), marble, verts=40)
        shaped_sphere(r, (0, y, H + 5.4), marble, (1, 1, 1.1), lambda v: setattr(v, 'z', v.z * (1.0 + 0.35 * max(0, v.z) ** 3) if v.z > 0 else v.z * 0.2), segs=40)
        cyl(0.4, 1.8, (0, y, H + 5.4 + r * 1.42), gold, verts=10)
        sphere(0.6, (0, y, H + 5.4 + r * 1.3), gold, segs=12)
        torus(r * 0.92, 0.35, (0, y, H + 5.6), red_dk, maj=48, mn=6)
    # small chhatris along the parapet
    for i in range(-6, 7):
        if abs(i) in (0, 3): continue
        y = i * 6.4
        for dx in (-0.8, 0.8):
            for dy in (-0.8, 0.8):
                cyl(0.12, 2.0, (D / 2 - 1.5 + dx, y + dy, H + 2.2), marble, verts=6)
        sphere(1.2, (D / 2 - 1.5, y, H + 3.3), marble, scale=(1, 1, 1.15), segs=14)
    # corner minarets of the hall + the four tall courtyard minarets (toward the road)
    def minaret(x, y, h, r):
        cyl(r * 1.3, 2.5, (x, y, 1.25), red_dk, verts=8)
        cyl(r, h, (x, y, h / 2), red, verts=8, r2=r * 0.82)
        for k in range(1, 4):
            zk = h * k / 4
            cyl(r * (1 - 0.18 * k / 4) + 0.12, 0.7, (x, y, zk), marble, verts=8)
            cyl(r * (1 - 0.18 * k / 4) + 1.0, 0.4, (x, y, zk + 0.5), marble, verts=16)
        for k in range(8):
            a = k / 8 * math.pi * 2
            cyl(0.1, 2.6, (x + math.cos(a) * r * 0.85, y + math.sin(a) * r * 0.85, h + 1.3), marble, verts=6)
        cyl(r * 1.05, 0.4, (x, y, h + 2.7), marble, verts=16)
        sphere(r * 0.9, (x, y, h + 2.9), marble, scale=(1, 1, 1.2), segs=16)
        cyl(0.12, 1.2, (x, y, h + 4.3), gold, verts=8)
    for s in (-1, 1):
        minaret(D / 2 - 1, s * (W / 2 + 1), 30, 1.8)
        minaret(-D / 2 + 1, s * (W / 2 + 1), 30, 1.8)
        minaret(D / 2 + 60, s * (W / 2 + 18), 54, 2.6)                   # courtyard minarets, 54 m
    # courtyard floor + boundary wall toward the road
    box((60, W + 36, 0.6), (D / 2 + 30, 0, 0.3), mat('courtyard', 0xb75a3c, 0, 0.8), 0.05)
    box((2.0, W + 36, 7), (D / 2 + 60, 0, 3.5), red, 0.05)
    for i in range(-9, 10):
        box((0.3, 3.2, 4.6), (D / 2 + 61.05, i * 6.2, 3.2), dark, 0.02)
    box((2.4, W + 37, 0.6), (D / 2 + 60, 0, 7.2), marble, 0.02)
    export('badshahi')

# ------------------------------------------------------------------ STRAY DOG + CAT (face +X, legs are separate Leg_* nodes for the trot)
def _legs(prefix_pts, r_top, r_bot, m, paw_m, paw_r):
    for name, top, bot in prefix_pts:
        parts = [limb(top, bot, r_top, m, verts=10, r2=r_bot), sphere(paw_r, bot, paw_m, scale=(1.4, 1, 0.6), segs=10), sphere(r_top * 1.15, top, m, segs=10)]
        join_as(name, parts, top)

def build_dog():
    reset()
    fur = mat('fur', 0xb88a52, 0.0, 0.85)            # recoloured in the game (tan / black / white / brindle)
    light = mat('fur_light', 0xe8d4b0, 0.0, 0.85)
    dark = mat('dog_dark', 0x1a1410, 0.0, 0.4)
    pink = mat('dog_tongue', 0xd9707a, 0.0, 0.5)
    collar = mat('dog_collar', 0xc4121a, 0.1, 0.5)
    # lean desi stray: deep chest, tucked waist
    sphere(0.2, (0.18, 0, 0.5), fur, scale=(1.3, 0.85, 1.0), segs=24)        # chest
    sphere(0.16, (-0.18, 0, 0.5), fur, scale=(1.3, 0.8, 0.85), segs=22)      # loin
    sphere(0.12, (0.3, 0, 0.42), light, scale=(0.9, 0.75, 1.0), segs=16)     # pale chest patch
    limb((0.32, 0, 0.56), (0.45, 0, 0.72), 0.085, fur, verts=14, r2=0.07)    # neck
    sphere(0.1, (0.5, 0, 0.76), fur, scale=(1.1, 0.95, 0.95), segs=20)       # skull
    limb((0.55, 0, 0.73), (0.7, 0, 0.7), 0.055, light, verts=12, r2=0.038)   # muzzle
    sphere(0.025, (0.715, 0, 0.71), dark, segs=10)                           # nose
    sphere(0.02, (0.68, 0, 0.665), pink, scale=(1.2, 0.8, 0.5), segs=8)      # tongue
    for s in (-1, 1):
        sphere(0.016, (0.6, s * 0.05, 0.79), dark, segs=8)                   # eyes
        limb((0.47, s * 0.055, 0.83), (0.47, s * 0.085, 0.93), 0.035, fur, verts=8, r2=0.006)   # perked ears
    torus(0.085, 0.015, (0.38, 0, 0.64), collar, rot=(0, math.pi / 2 + 0.6, 0), maj=16, mn=6)
    # tail curled over the back
    pts = [(-0.36, 0, 0.56), (-0.46, 0, 0.66), (-0.42, 0, 0.78), (-0.32, 0, 0.8)]
    for i, (a, b) in enumerate(zip(pts, pts[1:])):
        limb(a, b, 0.03 - i * 0.006, fur, verts=8, r2=0.024 - i * 0.006)
    _legs([('Leg_FL', (0.22, 0.09, 0.42), (0.24, 0.09, 0.03)), ('Leg_FR', (0.22, -0.09, 0.42), (0.24, -0.09, 0.03)),
           ('Leg_BL', (-0.22, 0.08, 0.42), (-0.25, 0.08, 0.03)), ('Leg_BR', (-0.22, -0.08, 0.42), (-0.25, -0.08, 0.03))], 0.034, 0.024, fur, light, 0.032)
    export('dog')

def build_cat():
    reset()
    fur = mat('fur', 0x8a8a8a, 0.0, 0.8)             # recoloured in the game (ginger / black / grey / white)
    stripe = mat('stripe_fur', 0x3a3a3a, 0.0, 0.85)
    light = mat('fur_light', 0xf2efe6, 0.0, 0.8)
    eye = mat('cat_eye', 0xc9d43a, 0.0, 0.2, emit=0x8fa020, strength=0.6)
    dark = mat('cat_dark', 0x111111, 0.0, 0.4)
    sphere(0.12, (0.0, 0, 0.27), fur, scale=(1.75, 0.8, 0.85), segs=22)       # long low body
    sphere(0.09, (0.12, 0, 0.27), light, scale=(0.9, 0.7, 0.8), segs=14)      # white chest
    for k in range(5):                                                         # tabby stripes lying flat over the back
        sphere(0.05, (-0.15 + k * 0.065, 0, 0.345), stripe, scale=(0.32, 1.85, 0.55), segs=12)
    sphere(0.075, (0.25, 0, 0.39), fur, scale=(1.0, 1.05, 0.95), segs=18)     # head
    sphere(0.035, (0.31, 0, 0.37), light, scale=(0.8, 1.2, 0.7), segs=10)     # muzzle
    sphere(0.01, (0.335, 0, 0.375), mat('cat_nose', 0xd98080, 0, 0.5), segs=6)
    for s in (-1, 1):
        sphere(0.016, (0.31, s * 0.033, 0.405), eye, scale=(0.6, 1, 1.1), segs=10)
        limb((0.24, s * 0.04, 0.44), (0.235, s * 0.05, 0.5), 0.028, fur, verts=4, r2=0.002)   # pointy ears
        for k in range(2):
            limb((0.32, s * 0.03, 0.37 - k * 0.01), (0.33, s * 0.1, 0.38 - k * 0.02), 0.002, light, verts=4)   # whiskers
    pts = [(-0.2, 0, 0.3), (-0.3, 0, 0.36), (-0.33, 0, 0.48), (-0.3, 0, 0.56)]   # tail up, question-mark curl
    for i, (a, b) in enumerate(zip(pts, pts[1:])):
        limb(a, b, 0.02, fur if i % 2 == 0 else stripe, verts=8, r2=0.017)
    _legs([('Leg_FL', (0.13, 0.05, 0.22), (0.14, 0.05, 0.015)), ('Leg_FR', (0.13, -0.05, 0.22), (0.14, -0.05, 0.015)),
           ('Leg_BL', (-0.14, 0.05, 0.22), (-0.15, 0.05, 0.015)), ('Leg_BR', (-0.14, -0.05, 0.22), (-0.15, -0.05, 0.015))], 0.022, 0.016, fur, light, 0.02)
    export('cat')

# ------------------------------------------------------------------ run
BUILDERS = {
    'bike': build_bike, 'tonga': build_tonga, 'dog': build_dog, 'cat': build_cat,
    'minar': build_minar, 'badshahi': build_badshahi,
    'rickshaw': build_rickshaw, 'truck': build_truck, 'bus': build_bus,
}
only = [a for a in argv[2:]] if len(argv) > 2 else list(BUILDERS)
for name in only:
    BUILDERS[name]()

with open(os.path.join(OUT, 'models.json'), 'w') as f:
    json.dump({
        '_help': 'Built by blender/build_models.py. Delete a name from the list to fall back to the procedural model.',
        'models': list(BUILDERS),
    }, f, indent=2)
print('[build] done')
