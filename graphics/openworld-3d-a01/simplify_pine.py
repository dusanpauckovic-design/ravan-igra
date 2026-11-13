"""Convert the three Poly Haven saplings into low-cost browser meshes in Blender."""
import sys
from pathlib import Path
import bpy

source, output = map(Path, sys.argv[sys.argv.index("--")+1:])
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(source.resolve()))
for obj in list(bpy.context.scene.objects):
    if obj.type != "MESH":
        continue
    obj.location.x = 0
    bpy.context.view_layer.objects.active = obj
    modifier = obj.modifiers.new("Web canopy detail", "DECIMATE")
    modifier.ratio = .023
    bpy.ops.object.modifier_apply(modifier=modifier.name)
bpy.ops.export_scene.gltf(filepath=str(output.resolve()), export_format="GLB")
