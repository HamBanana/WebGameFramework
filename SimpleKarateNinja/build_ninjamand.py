"""
Blender Python script: builds a low-poly 3D model of the Ninja Man sprite.
Run from Blender's scripting tab or via: blender --background --python build_ninjamand.py

Output: ninjamand.blend saved next to this script.
"""

import bpy
import os

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def clear_scene():
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete()
    for col in list(bpy.data.collections):
        bpy.data.collections.remove(col)


def make_material(name, color_rgba):
    mat = bpy.data.materials.get(name)
    if mat:
        return mat
    mat = bpy.data.materials.new(name=name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    bsdf.inputs["Base Color"].default_value = color_rgba
    bsdf.inputs["Roughness"].default_value = 0.9
    # "Specular" was renamed to "Specular IOR Level" in Blender 4+
    for specular_key in ("Specular IOR Level", "Specular"):
        if specular_key in bsdf.inputs:
            bsdf.inputs[specular_key].default_value = 0.05
            break
    return mat


def add_box(name, location, scale, material, collection=None):
    bpy.ops.mesh.primitive_cube_add(size=1, location=location)
    obj = bpy.context.active_object
    obj.name = name
    obj.scale = scale
    if material:
        if obj.data.materials:
            obj.data.materials[0] = material
        else:
            obj.data.materials.append(material)
    if collection:
        for c in obj.users_collection:
            c.objects.unlink(obj)
        collection.objects.link(obj)
    return obj


# ---------------------------------------------------------------------------
# Ninja Man colours  (from sprite analysis)
#   - Dark navy / near-black bodysuit
#   - Red accent stripe / trim
#   - Very dark face wrap (same navy)
#   - Slightly lighter navy for boots
# ---------------------------------------------------------------------------

NAVY   = (0.05, 0.08, 0.15, 1.0)   # main bodysuit
RED    = (0.80, 0.10, 0.10, 1.0)   # red stripes / trim
DARK   = (0.03, 0.04, 0.08, 1.0)   # face wrap / gloves (slightly darker)
BOOT   = (0.06, 0.06, 0.10, 1.0)   # boots (slightly cooler)

# ---------------------------------------------------------------------------
# Build scene
# ---------------------------------------------------------------------------

clear_scene()

col = bpy.data.collections.new("NinjaMan")
bpy.context.scene.collection.children.link(col)

m_navy  = make_material("ninja_navy",  NAVY)
m_red   = make_material("ninja_red",   RED)
m_dark  = make_material("ninja_dark",  DARK)
m_boot  = make_material("ninja_boot",  BOOT)

# Character is slightly slimmer and more athletic than the karate guy.

parts = [
    # (name,           location,              scale,              material)

    # --- Head / mask ---
    ("head",           (0,  0,  1.52),        (0.26, 0.23, 0.26), m_dark),
    # Eye slit highlight (thin red stripe across the middle of head)
    ("eye_slit",       (0,  0.12, 1.52),      (0.20, 0.01, 0.04), m_red),

    # --- Neck ---
    ("neck",           (0,  0,  1.35),        (0.09, 0.09, 0.09), m_dark),

    # --- Torso ---
    ("torso",          (0,  0,  1.08),        (0.36, 0.20, 0.36), m_navy),
    # Red chest stripe
    ("chest_stripe",   (0,  0.11, 1.08),      (0.36, 0.01, 0.28), m_red),

    # --- Belt / sash ---
    ("belt",           (0,  0,  0.88),        (0.38, 0.21, 0.06), m_red),

    # --- Upper arms ---
    ("upper_arm_L",    ( 0.28, 0,  1.10),     (0.09, 0.09, 0.30), m_navy),
    ("upper_arm_R",    (-0.28, 0,  1.10),     (0.09, 0.09, 0.30), m_navy),

    # --- Forearms ---
    ("forearm_L",      ( 0.28, 0,  0.80),     (0.08, 0.08, 0.24), m_navy),
    ("forearm_R",      (-0.28, 0,  0.80),     (0.08, 0.08, 0.24), m_navy),

    # --- Gloves ---
    ("glove_L",        ( 0.28, 0,  0.62),     (0.09, 0.09, 0.10), m_dark),
    ("glove_R",        (-0.28, 0,  0.62),     (0.09, 0.09, 0.10), m_dark),

    # --- Thighs ---
    ("thigh_L",        ( 0.10, 0,  0.60),     (0.13, 0.15, 0.26), m_navy),
    ("thigh_R",        (-0.10, 0,  0.60),     (0.13, 0.15, 0.26), m_navy),

    # --- Shins ---
    ("shin_L",         ( 0.10, 0,  0.30),     (0.11, 0.12, 0.26), m_navy),
    ("shin_R",         (-0.10, 0,  0.30),     (0.11, 0.12, 0.26), m_navy),

    # --- Boots ---
    ("boot_L",         ( 0.11, 0.02, 0.08),   (0.12, 0.19, 0.10), m_boot),
    ("boot_R",         (-0.11, 0.02, 0.08),   (0.12, 0.19, 0.10), m_boot),

    # --- Shoulder pads / red trim ---
    ("shoulder_L",     ( 0.24, 0,  1.26),     (0.10, 0.11, 0.06), m_red),
    ("shoulder_R",     (-0.24, 0,  1.26),     (0.10, 0.11, 0.06), m_red),
]

objects = []
for name, loc, scale, mat in parts:
    obj = add_box(name, loc, scale, mat, collection=col)
    objects.append(obj)

# Root empty
bpy.ops.object.empty_add(type='PLAIN_AXES', location=(0, 0, 0))
root = bpy.context.active_object
root.name = "NinjaMan_Root"
for c in root.users_collection:
    c.objects.unlink(root)
col.objects.link(root)

for obj in objects:
    obj.parent = root

# ---------------------------------------------------------------------------
# Camera & light
# ---------------------------------------------------------------------------

bpy.ops.object.camera_add(location=(0, -3.5, 1.0))
cam = bpy.context.active_object
cam.rotation_euler = (1.35, 0, 0)
bpy.context.scene.camera = cam

bpy.ops.object.light_add(type='SUN', location=(2, -2, 4))
sun = bpy.context.active_object
sun.data.energy = 3.0

# ---------------------------------------------------------------------------
# Save
# ---------------------------------------------------------------------------

out_path = r"C:\Users\Ham\Documents\Claude\Projects\Games\GameFramework\SimpleKarateNinja\ninjamand.blend"
bpy.ops.wm.save_as_mainfile(filepath=out_path)
print(f"Saved: {out_path}")
