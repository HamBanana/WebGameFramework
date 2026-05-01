"""
Blender Python script: builds a low-poly 3D model of the Karate Guy sprite.
Run from Blender's scripting tab or via: blender --background --python build_karateguy.py

Output: karateguy.blend saved next to this script.
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
    bsdf.inputs["Roughness"].default_value = 1.0
    # "Specular" was renamed to "Specular IOR Level" in Blender 4+
    for specular_key in ("Specular IOR Level", "Specular"):
        if specular_key in bsdf.inputs:
            bsdf.inputs[specular_key].default_value = 0.0
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
        # Move to collection
        for col in obj.users_collection:
            col.objects.unlink(obj)
        collection.objects.link(obj)
    return obj


# ---------------------------------------------------------------------------
# Karateguy colours  (from sprite analysis)
#   - White gi (torso, upper arms, thighs)
#   - Skin  (head, hands, lower face)
#   - Dark brown / black hair
#   - Black belt + shoes
#   - Off-white pants
# ---------------------------------------------------------------------------

SKIN   = (0.90, 0.70, 0.55, 1.0)
WHITE  = (0.95, 0.95, 0.92, 1.0)   # gi
HAIR   = (0.18, 0.10, 0.06, 1.0)   # dark brown
BLACK  = (0.05, 0.05, 0.05, 1.0)   # belt / shoes
PANT   = (0.85, 0.85, 0.80, 1.0)   # slightly off-white pants

# ---------------------------------------------------------------------------
# Build scene
# ---------------------------------------------------------------------------

clear_scene()

col = bpy.data.collections.new("KarateGuy")
bpy.context.scene.collection.children.link(col)

m_skin  = make_material("skin",  SKIN)
m_white = make_material("gi",    WHITE)
m_hair  = make_material("hair",  HAIR)
m_black = make_material("black", BLACK)
m_pant  = make_material("pants", PANT)

# All sizes and positions in metres; character stands ~1.75 m tall.
# Y-axis is forward, Z-axis is up.

parts = [
    # (name,         location,            scale,              material)

    # --- Head ---
    ("head",         (0, 0,  1.52),       (0.28, 0.25, 0.28), m_skin),
    # Hair (cap on top of head)
    ("hair",         (0, 0,  1.68),       (0.29, 0.26, 0.12), m_hair),

    # --- Neck ---
    ("neck",         (0, 0,  1.33),       (0.10, 0.10, 0.10), m_skin),

    # --- Torso (gi top) ---
    ("torso",        (0, 0,  1.07),       (0.40, 0.22, 0.38), m_white),

    # --- Belt ---
    ("belt",         (0, 0,  0.87),       (0.42, 0.23, 0.06), m_black),

    # --- Upper arms ---
    ("upper_arm_L",  ( 0.30, 0,  1.10),  (0.10, 0.10, 0.32), m_white),
    ("upper_arm_R",  (-0.30, 0,  1.10),  (0.10, 0.10, 0.32), m_white),

    # --- Forearms ---
    ("forearm_L",    ( 0.30, 0,  0.80),  (0.09, 0.09, 0.26), m_skin),
    ("forearm_R",    (-0.30, 0,  0.80),  (0.09, 0.09, 0.26), m_skin),

    # --- Hands ---
    ("hand_L",       ( 0.30, 0,  0.62),  (0.08, 0.09, 0.10), m_skin),
    ("hand_R",       (-0.30, 0,  0.62),  (0.08, 0.09, 0.10), m_skin),

    # --- Pants (thighs) ---
    ("thigh_L",      ( 0.11, 0,  0.60),  (0.14, 0.16, 0.28), m_pant),
    ("thigh_R",      (-0.11, 0,  0.60),  (0.14, 0.16, 0.28), m_pant),

    # --- Lower legs ---
    ("shin_L",       ( 0.11, 0,  0.30),  (0.11, 0.13, 0.28), m_pant),
    ("shin_R",       (-0.11, 0,  0.30),  (0.11, 0.13, 0.28), m_pant),

    # --- Shoes ---
    ("shoe_L",       ( 0.12, 0.02, 0.07), (0.13, 0.20, 0.10), m_black),
    ("shoe_R",       (-0.12, 0.02, 0.07), (0.13, 0.20, 0.10), m_black),
]

objects = []
for name, loc, scale, mat in parts:
    obj = add_box(name, loc, scale, mat, collection=col)
    objects.append(obj)

# Parent everything to an empty root so the whole figure is one unit
bpy.ops.object.empty_add(type='PLAIN_AXES', location=(0, 0, 0))
root = bpy.context.active_object
root.name = "KarateGuy_Root"
for col2 in root.users_collection:
    col2.objects.unlink(root)
col.objects.link(root)

for obj in objects:
    obj.parent = root

# ---------------------------------------------------------------------------
# Camera & light for a nice default render view
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

out_path = r"C:\Users\Ham\Documents\Claude\Projects\Games\GameFramework\SimpleKarateNinja\karateguy.blend"
bpy.ops.wm.save_as_mainfile(filepath=out_path)
print(f"Saved: {out_path}")
