# Blender 4.5+ Auto-Build + Looping Idle + GLB & glTF Exporter
# Run in Blender (Text Editor) or headless with CLI.
# CLI overrides (recommended):
#   blender -b -P your_script.py -- --output_dir "<abs path>" --glb_name "name.glb" --gltf_name "name.gltf" --blend_name "name.blend"

import bpy
import math
import sys, os
from mathutils import Vector, Euler

# ------------------------ CONFIG (defaults) ------------------------
OUTPUT_DIR = r"C:\Users\shuma\OneDrive\Desktop\AnimationStudioForStream\public\Default_Characters\CRZ_9_Fortnite"
BLEND_NAME = "cyberpunk_idle.blend"
GLB_NAME = "cyberpunk_idle.glb"
GLTF_NAME = "cyberpunk_idle.gltf"

FPS = 24
DURATION_SECONDS = 5.0
FRAME_START = 1
FRAME_END = FRAME_START + int(FPS * DURATION_SECONDS)  # inclusive end

# --------------------- CLI OVERRIDES ------------------------------
def get_cli_arg(name, default=None):
    try:
        if '--' in sys.argv:
            i = sys.argv.index('--') + 1
            args = sys.argv[i:]
            for j in range(len(args) - 1):
                if args[j] == f'--{name}':
                    return args[j+1]
    except Exception:
        pass
    return default

OUTPUT_DIR = get_cli_arg('output_dir', OUTPUT_DIR)
BLEND_NAME = get_cli_arg('blend_name', BLEND_NAME)
GLB_NAME   = get_cli_arg('glb_name', GLB_NAME)
GLTF_NAME  = get_cli_arg('gltf_name', GLTF_NAME)

# --------------------- UTILITY ---------------------------
def clear_scene():
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)
    for datablock in (bpy.data.meshes, bpy.data.materials, bpy.data.armatures, bpy.data.images):
        for block in list(datablock):
            if block.users == 0:
                datablock.remove(block)

def set_origin_to_mesh_bottom(obj: bpy.types.Object):
    bpy.context.view_layer.update()
    world_bbox = [obj.matrix_world @ Vector(corner) for corner in obj.bound_box]
    min_x = min(v.x for v in world_bbox)
    max_x = max(v.x for v in world_bbox)
    min_y = min(v.y for v in world_bbox)
    max_y = max(v.y for v in world_bbox)
    min_z = min(v.z for v in world_bbox)
    cursor = bpy.context.scene.cursor
    cursor.location = Vector(((min_x + max_x) * 0.5, (min_y + max_y) * 0.5, min_z))
    bpy.ops.object.select_all(action='DESELECT')
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.origin_set(type='ORIGIN_CURSOR')

def apply_object_transforms(obj: bpy.types.Object, apply_loc=False, apply_rot=True, apply_scale=True):
    bpy.ops.object.select_all(action='DESELECT')
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.transform_apply(location=apply_loc, rotation=apply_rot, scale=apply_scale)

# -------------------- CREATE MESH ------------------------
def make_materials():
    mats = {}

    # Body material (Principled)
    mat = bpy.data.materials.new("Body_PBR")
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    bsdf.inputs["Base Color"].default_value = (0.08, 0.08, 0.10, 1.0)
    bsdf.inputs["Metallic"].default_value = 0.15
    bsdf.inputs["Roughness"].default_value = 0.45
    mats['body'] = mat

    # Trim
    mat2 = bpy.data.materials.new("Trim")
    mat2.use_nodes = True
    bsdf2 = mat2.node_tree.nodes.get("Principled BSDF")
    bsdf2.inputs["Base Color"].default_value = (0.05, 0.05, 0.06, 1.0)
    bsdf2.inputs["Metallic"].default_value = 0.8
    bsdf2.inputs["Roughness"].default_value = 0.1
    mats['trim'] = mat2

    # Eye (Principled v4.5: Emission Color + Emission Strength)
    mat_eye = bpy.data.materials.new("Eye_Emissive")
    mat_eye.use_nodes = True
    bsdf_eye = mat_eye.node_tree.nodes.get("Principled BSDF")
    bsdf_eye.inputs["Base Color"].default_value = (1.0, 0.2, 0.9, 1.0)
    # Blender 4.5 uses "Emission Color"; guard in case of minor naming variance
    emission_color = bsdf_eye.inputs.get("Emission Color")
    if emission_color is not None:
        emission_color.default_value = (1.0, 0.2, 0.9, 1.0)
    emission_strength = bsdf_eye.inputs.get("Emission Strength")
    if emission_strength is not None:
        emission_strength.default_value = 2.0
    mats['eye'] = mat_eye

    return mats

def build_body(mats):
    objs = []

    bpy.ops.mesh.primitive_cube_add(size=1)
    torso = bpy.context.active_object
    torso.name = "Torso"
    torso.scale = (0.6, 0.35, 0.9)
    torso.location = (0, 0, 1.0)
    torso.data.materials.append(mats['body'])
    objs.append(torso)

    bpy.ops.mesh.primitive_cube_add(size=1)
    hips = bpy.context.active_object
    hips.name = "Hips"
    hips.scale = (0.45, 0.25, 0.35)
    hips.location = (0, 0, 0.55)
    hips.data.materials.append(mats['body'])
    objs.append(hips)

    bpy.ops.mesh.primitive_uv_sphere_add(segments=32, ring_count=16, radius=0.3)
    head = bpy.context.active_object
    head.name = "Head"
    head.location = (0, 0, 1.7)
    head.data.materials.append(mats['body'])
    objs.append(head)

    bpy.ops.mesh.primitive_uv_sphere_add(segments=16, ring_count=8, radius=0.07)
    eye = bpy.context.active_object
    eye.name = "Eye"
    eye.location = (0.17, 0.15, 1.65)
    eye.data.materials.append(mats['eye'])
    objs.append(eye)

    bpy.ops.mesh.primitive_cylinder_add(vertices=16, radius=0.09, depth=0.6)
    l_arm = bpy.context.active_object
    l_arm.name = "Arm_L"
    l_arm.rotation_euler = (0, 0, math.radians(90))
    l_arm.location = (0.65, 0, 1.15)
    l_arm.data.materials.append(mats['body'])
    objs.append(l_arm)

    bpy.ops.mesh.primitive_cylinder_add(vertices=16, radius=0.09, depth=0.6)
    r_arm = bpy.context.active_object
    r_arm.name = "Arm_R"
    r_arm.rotation_euler = (0, 0, math.radians(90))
    r_arm.location = (-0.65, 0, 1.15)
    r_arm.data.materials.append(mats['body'])
    objs.append(r_arm)

    bpy.ops.mesh.primitive_cylinder_add(vertices=16, radius=0.12, depth=0.8)
    l_leg = bpy.context.active_object
    l_leg.name = "Leg_L"
    l_leg.location = (0.22, 0, 0.05)
    l_leg.data.materials.append(mats['body'])
    objs.append(l_leg)

    bpy.ops.mesh.primitive_cylinder_add(vertices=16, radius=0.12, depth=0.8)
    r_leg = bpy.context.active_object
    r_leg.name = "Leg_R"
    r_leg.location = (-0.22, 0, 0.05)
    r_leg.data.materials.append(mats['body'])
    objs.append(r_leg)

    bpy.ops.mesh.primitive_cube_add(size=1)
    hood = bpy.context.active_object
    hood.name = "Hood"
    hood.scale = (0.75, 0.75, 0.35)
    hood.location = (0, -0.16, 1.75)
    hood.data.materials.append(mats['trim'])
    objs.append(hood)

    # Join all body parts into one mesh (except Eye)
    bpy.ops.object.select_all(action='DESELECT')
    for ob in objs:
        if ob.name != "Eye":
            ob.select_set(True)
    bpy.context.view_layer.objects.active = torso
    bpy.ops.object.join()
    combined = bpy.context.active_object
    combined.name = "CharacterMesh"

    # Set origin to bottom and apply transforms before skinning
    set_origin_to_mesh_bottom(combined)
    apply_object_transforms(combined, apply_loc=False, apply_rot=True, apply_scale=True)

    return combined, bpy.data.objects['Eye']

# ------------------- CREATE ARMATURE ---------------------
def build_armature(mesh_obj, eye_obj):
    bpy.ops.object.armature_add(enter_editmode=True, location=(0, 0, 0))
    arm = bpy.context.active_object
    arm.name = "Armature"
    arm.show_in_front = True
    amt = arm.data

    bpy.ops.armature.select_all(action='SELECT')
    bpy.ops.armature.delete()
    eb = amt.edit_bones

    b_root = eb.new('root'); b_root.head = Vector((0, 0, 0));   b_root.tail = Vector((0, 0, 0.25))
    b_hips = eb.new('hips'); b_hips.head = Vector((0, 0, 0.25)); b_hips.tail = Vector((0, 0, 0.7)); b_hips.parent = b_root
    b_spine = eb.new('spine'); b_spine.head = Vector((0, 0, 0.7)); b_spine.tail = Vector((0, 0, 1.15)); b_spine.parent = b_hips
    b_chest = eb.new('chest'); b_chest.head = Vector((0, 0, 1.15)); b_chest.tail = Vector((0, 0, 1.4)); b_chest.parent = b_spine
    b_head = eb.new('head'); b_head.head = Vector((0, 0, 1.4)); b_head.tail = Vector((0, 0, 1.75)); b_head.parent = b_chest
    b_jaw = eb.new('jaw'); b_jaw.head = Vector((0, 0, 1.45)); b_jaw.tail = Vector((0, 0, 1.3)); b_jaw.parent = b_head
    b_l_arm = eb.new('upper_arm.L'); b_l_arm.head = Vector((0.4, 0, 1.35)); b_l_arm.tail = Vector((0.85, 0, 1.15)); b_l_arm.parent = b_chest
    b_r_arm = eb.new('upper_arm.R'); b_r_arm.head = Vector((-0.4, 0, 1.35)); b_r_arm.tail = Vector((-0.85, 0, 1.15)); b_r_arm.parent = b_chest
    b_l_leg = eb.new('thigh.L'); b_l_leg.head = Vector((0.18, 0, 0.65)); b_l_leg.tail = Vector((0.18, 0, 0.05)); b_l_leg.parent = b_hips
    b_r_leg = eb.new('thigh.R'); b_r_leg.head = Vector((-0.18, 0, 0.65)); b_r_leg.tail = Vector((-0.18, 0, 0.05)); b_r_leg.parent = b_hips

    bpy.ops.object.mode_set(mode='OBJECT')
    apply_object_transforms(mesh_obj, apply_loc=False, apply_rot=True, apply_scale=True)

    # Parent mesh to armature with automatic weights
    bpy.ops.object.select_all(action='DESELECT')
    mesh_obj.select_set(True)
    arm.select_set(True)
    bpy.context.view_layer.objects.active = arm
    bpy.ops.object.parent_set(type='ARMATURE_AUTO')

    # Parent eye to head bone while preserving world transform
    W = eye_obj.matrix_world.copy()
    eye_obj.parent = arm
    eye_obj.parent_type = 'BONE'
    eye_obj.parent_bone = 'head'
    parent_world = arm.matrix_world @ arm.pose.bones['head'].matrix
    eye_obj.matrix_parent_inverse = parent_world.inverted() @ W
    eye_obj.matrix_world = W

    return arm

# -------------------- ANIMATION --------------------------
def add_looping_idle(arm_obj):
    scene = bpy.context.scene
    scene.frame_start = FRAME_START
    scene.frame_end = FRAME_END
    scene.render.fps = FPS

    pose = arm_obj.pose
    root = pose.bones.get('root')
    hips = pose.bones.get('hips')
    chest = pose.bones.get('chest')
    head = pose.bones.get('head')
    jaw = pose.bones.get('jaw')
    l_arm = pose.bones.get('upper_arm.L')
    r_arm = pose.bones.get('upper_arm.R')

    for pb in (root, hips, chest, head, jaw, l_arm, r_arm):
        if pb: pb.rotation_mode = 'XYZ'

    def key_rot(bone, frame, euler_tuple):
        bone.rotation_euler = Euler(euler_tuple, 'XYZ')
        bone.keyframe_insert(data_path="rotation_euler", frame=frame)

    def key_loc(bone, frame, vec3):
        bone.location = Vector(vec3)
        bone.keyframe_insert(data_path="location", frame=frame)

    for f in range(FRAME_START, FRAME_END + 1):
        t01 = (f - FRAME_START) / (FRAME_END - FRAME_START)
        two_pi = 2.0 * math.pi
        sway = math.sin(two_pi * (t01 * 2.0))   # 2 cycles
        breath = math.sin(two_pi * (t01 * 1.0)) # 1 cycle

        if hips:  key_rot(hips,  f, (0.0, 0.0, math.radians(2.0) * sway))
        if chest: key_rot(chest, f, (math.radians(2.5) * breath, 0.0, 0.0))
        if head:  key_rot(head,  f, (math.radians(-2.0) * breath, math.radians(1.5) * sway, math.radians(1.0) * sway))
        if l_arm: key_rot(l_arm, f, (math.radians(-8.0) * sway, math.radians(6.0) * sway, math.radians(5.0) * sway))
        if r_arm: key_rot(r_arm, f, (math.radians(8.0) * sway,  math.radians(-6.0) * sway, math.radians(-5.0) * sway))
        if jaw:   key_rot(jaw,   f, (max(0.0, 0.10 * math.sin(two_pi * (t01 * 3.0))), 0.0, 0.0))
        if root and f in (FRAME_START, FRAME_END):
            key_loc(root, f, (0.0, 0.0, 0.0))

    action = arm_obj.animation_data.action
    if action:
        for fc in action.fcurves:
            v0 = fc.evaluate(FRAME_START)
            for kp in list(fc.keyframe_points):
                if int(round(kp.co.x)) == FRAME_END:
                    fc.keyframe_points.remove(kp)
            fc.keyframe_points.insert(FRAME_END, v0, options={'REPLACE'})
            if not any(m.type == 'CYCLES' for m in fc.modifiers):
                fc.modifiers.new(type='CYCLES')
        action.name = "Idle_Looping"
        action.frame_range = (FRAME_START, FRAME_END)

# ---------------------- EXPORT ---------------------------
def save_and_export(output_dir):
    if not output_dir:
        raise RuntimeError("OUTPUT_DIR is empty")
    if not os.path.isabs(output_dir):
        output_dir = os.path.abspath(output_dir)
    os.makedirs(output_dir, exist_ok=True)

    blend_path = os.path.join(output_dir, BLEND_NAME)
    bpy.ops.wm.save_as_mainfile(filepath=blend_path)

    def export_gltf_with_fallback(filepath: str, export_format: str):
        common = dict(
            filepath=filepath,
            export_format=export_format,
            export_apply=True,
            export_animations=True,
            export_extras=True,
            export_cameras=False,
            export_lights=False,
            export_yup=True,
        )
        # Try Blender variants: export_colors (newer) or export_vertex_colors (older)
        try:
            bpy.ops.export_scene.gltf(**{**common, "export_colors": True})
            return
        except TypeError:
            pass
        try:
            bpy.ops.export_scene.gltf(**{**common, "export_vertex_colors": True})
            return
        except TypeError:
            # Last resort: no explicit color flag
            bpy.ops.export_scene.gltf(**common)

    glb_path = os.path.join(output_dir, GLB_NAME)
    export_gltf_with_fallback(glb_path, 'GLB')

    gltf_path = os.path.join(output_dir, GLTF_NAME)
    # Blender 4.5 supports 'GLB' and 'GLTF_SEPARATE' (no 'GLTF_EMBEDDED')
    export_gltf_with_fallback(gltf_path, 'GLTF_SEPARATE')

    return blend_path, glb_path, gltf_path

# ----------------------- MAIN ----------------------------
def main():
    clear_scene()
    mats = make_materials()
    mesh, eye = build_body(mats)
    arm = build_armature(mesh, eye)
    add_looping_idle(arm)
    blend_path, glb_path, gltf_path = save_and_export(OUTPUT_DIR)
    print("Saved .blend to:", blend_path)
    print("Exported .glb to:", glb_path)
    print("Exported .gltf to:", gltf_path)
    print("Finished!")

if __name__ == "__main__":
    main() 