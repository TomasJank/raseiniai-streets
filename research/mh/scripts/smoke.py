import bpy, sys, math
from bl_ext.blender_org.mpfb.services.humanservice import HumanService
from bl_ext.blender_org.mpfb.services.assetservice import AssetService
from bl_ext.blender_org.mpfb.services.targetservice import TargetService
for o in list(bpy.data.objects): bpy.data.objects.remove(o)
macro = TargetService.get_default_macro_info_dict()
macro.update(gender=1.0, age=0.95, weight=0.9)
base = HumanService.create_human(macro_detail_dict=macro, scale=0.1)
print("DIM", tuple(round(v,2) for v in base.dimensions), "roots", AssetService.get_asset_roots("clothes"))
print("ENGINES", [e.identifier for e in bpy.types.RenderSettings.bl_rna.properties["engine"].enum_items])
scene = bpy.context.scene
cam = bpy.data.objects.new("cam", bpy.data.cameras.new("cam")); scene.collection.objects.link(cam)
cam.data.type = "ORTHO"; cam.data.ortho_scale = 2.4; cam.location = (0, -10, 1.0); cam.rotation_euler = (math.radians(90), 0, 0); scene.camera = cam
sun = bpy.data.objects.new("sun", bpy.data.lights.new("sun", "SUN")); sun.rotation_euler = (math.radians(55), 0, math.radians(25)); scene.collection.objects.link(sun)
scene.render.engine = "BLENDER_EEVEE"; scene.render.resolution_x = 500; scene.render.resolution_y = 500
scene.render.filepath = sys.argv[sys.argv.index("--") + 1]
bpy.ops.render.render(write_still=True)
