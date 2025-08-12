import bpy, os, sys, math
from mathutils import Vector, Euler

def get_arg(flag, default=None):
    if '--' not in sys.argv:
        return default
    args = sys.argv[sys.argv.index('--')+1:]
    for i in range(len(args)-1):
        if args[i].lower()==flag.lower():
            return args[i+1]
    return default

OUT_DIR = get_arg('--output_dir') or get_arg('--OutDir') or ''
SCAN    = get_arg('--scan_path')
GLB     = get_arg('--glb_name', 'character.glb')
GLTF    = get_arg('--gltf_name', 'character.gltf')
BLEND   = get_arg('--blend_name', 'character.blend')

def clear_scene():
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)
    for d in (bpy.data.meshes, bpy.data.materials, bpy.data.armatures, bpy.data.images):
        for b in list(d):
            if b.users == 0:
                d.remove(b)

def import_scan(path):
    if not path or not os.path.exists(path):
        raise RuntimeError(f"Scan file not found: {path}")
    ext = os.path.splitext(path)[1].lower()
    if ext == '.glb' or ext == '.gltf':
        bpy.ops.import_scene.gltf(filepath=path)
    elif ext == '.obj':
        bpy.ops.import_scene.obj(filepath=path)
    else:
        raise RuntimeError(f"Unsupported scan format: {ext}")
    roots = [o for o in bpy.context.scene.objects if o.parent is None]
    return roots

def unify_mesh(root):
    bpy.ops.object.select_all(action='DESELECT')
    to_join = []
    for o in bpy.context.scene.objects:
        if o.type == 'MESH':
            o.select_set(True)
            to_join.append(o)
    if not to_join:
        raise RuntimeError('No mesh found in scan')
    bpy.context.view_layer.objects.active = to_join[0]
    bpy.ops.object.join()
    mesh = bpy.context.active_object
    mesh.name = 'CharacterMesh'
    mesh.location = (0,0,0)
    mesh.rotation_euler = (0,0,0)
    mesh.scale = (1,1,1)
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    return mesh

def build_armature(mesh):
    bpy.ops.object.armature_add(enter_editmode=True, location=(0,0,0))
    arm = bpy.context.active_object
    arm.name = 'Armature'
    eb = arm.data.edit_bones
    bpy.ops.armature.select_all(action='SELECT'); bpy.ops.armature.delete()

    def bone(name, head, tail, parent=None):
        b = eb.new(name); b.head = Vector(head); b.tail = Vector(tail)
        if parent: b.parent = parent
        return b

    b_root = bone('root', (0,0,0.0), (0,0,0.2))
    b_hips = bone('hips', (0,0,0.2), (0,0,0.6), b_root)
    b_spn  = bone('spine', (0,0,0.6), (0,0,1.1), b_hips)
    b_chs  = bone('chest', (0,0,1.1), (0,0,1.4), b_spn)
    b_head = bone('head', (0,0,1.4), (0,0,1.75), b_chs)
    b_jaw  = bone('jaw', (0,0,1.48), (0,0,1.33), b_head)

    b_lu = bone('upper_arm.L', (0.35,0,1.32), (0.8,0,1.1), b_chs)
    b_ru = bone('upper_arm.R', (-0.35,0,1.32), (-0.8,0,1.1), b_chs)
    b_ll = bone('thigh.L', (0.18,0,0.6), (0.18,0,0.1), b_hips)
    b_rl = bone('thigh.R', (-0.18,0,0.6), (-0.18,0,0.1), b_hips)

    bpy.ops.object.mode_set(mode='OBJECT')

    # Skin with automatic weights
    bpy.ops.object.select_all(action='DESELECT')
    mesh.select_set(True); arm.select_set(True)
    bpy.context.view_layer.objects.active = arm
    bpy.ops.object.parent_set(type='ARMATURE_AUTO')
    return arm

def add_idle(arm, start=1, end=121, fps=24):
    scn = bpy.context.scene
    scn.frame_start = start; scn.frame_end = end; scn.render.fps = fps
    pose = arm.pose
    for n in ('root','hips','chest','head','jaw','upper_arm.L','upper_arm.R'):
        pb = pose.bones.get(n)
        if pb: pb.rotation_mode = 'XYZ'

    import math
    def krot(name, f, eul):
        pb = pose.bones.get(name)
        if not pb: return
        from mathutils import Euler
        pb.rotation_euler = Euler(eul, 'XYZ')
        pb.keyframe_insert(data_path='rotation_euler', frame=f)

    def kloc(name, f, vec):
        pb = pose.bones.get(name)
        if not pb: return
        from mathutils import Vector
        pb.location = Vector(vec)
        pb.keyframe_insert(data_path='location', frame=f)

    for f in range(start, end+1):
        t01 = (f - start) / (end - start)
        twopi = 6.283185307179586
        sway = math.sin(twopi * (t01 * 2.0))
        breath = math.sin(twopi * (t01 * 1.0))
        krot('hips', f, (0.0, 0.0, math.radians(2.0) * sway))
        krot('chest',f, (math.radians(2.0)*breath, 0.0, 0.0))
        krot('head', f, (math.radians(-2.0)*breath, math.radians(1.5)*sway, math.radians(1.0)*sway))
        krot('upper_arm.L', f, (math.radians(-7.0)*sway, math.radians(5.0)*sway, math.radians(4.0)*sway))
        krot('upper_arm.R', f, (math.radians(7.0)*sway, math.radians(-5.0)*sway, math.radians(-4.0)*sway))
        jaw = max(0.0, 0.1 * math.sin(twopi * (t01 * 3.0)))
        krot('jaw', f, (jaw, 0.0, 0.0))
        if f in (start, end): kloc('root', f, (0,0,0))

    act = arm.animation_data.action
    if act:
        for fc in act.fcurves:
            v0 = fc.evaluate(start)
            for kp in list(fc.keyframe_points):
                if int(round(kp.co.x)) == end:
                    fc.keyframe_points.remove(kp)
            fc.keyframe_points.insert(end, v0, options={'REPLACE'})
            if not any(m.type=='CYCLES' for m in fc.modifiers):
                fc.modifiers.new(type='CYCLES')
        act.name = 'Idle_Looping'; act.frame_range = (start, end)

def export(out_dir, glb='character.glb', gltf='character.gltf', blend='character.blend'):
    if not out_dir:
        raise RuntimeError('No output dir')
    os.makedirs(out_dir, exist_ok=True)
    bpy.ops.wm.save_as_mainfile(filepath=os.path.join(out_dir, blend))

    def export_gltf(filepath, fmt):
        common = dict(filepath=filepath, export_format=fmt, export_apply=True,
                      export_animations=True, export_extras=True,
                      export_cameras=False, export_lights=False, export_yup=True)
        try:
            bpy.ops.export_scene.gltf(**{**common, 'export_colors': True}); return
        except TypeError:
            pass
        try:
            bpy.ops.export_scene.gltf(**{**common, 'export_vertex_colors': True}); return
        except TypeError:
            bpy.ops.export_scene.gltf(**common)

    export_gltf(os.path.join(out_dir, glb), 'GLB')
    export_gltf(os.path.join(out_dir, gltf), 'GLTF_SEPARATE')

def main():
    clear_scene()
    import_scan(SCAN)
    mesh = unify_mesh(bpy.context.scene)
    arm = build_armature(mesh)
    add_idle(arm, start=1, end=1+int(24*5), fps=24)
    export(OUT_DIR, glb=GLB, gltf=GLTF, blend=BLEND)
    print('Finished.')

if __name__ == '__main__':
    main()


