"""Bake the MakeHuman-based map-scale traveler. Run with Blender in background."""
import math
import sys
from pathlib import Path
import bpy
from mathutils import Vector

source, output = map(Path, sys.argv[sys.argv.index("--")+1:])
bpy.ops.wm.read_factory_settings(use_empty=True)

def material(name, color, rough=.86, metal=0):
    item=bpy.data.materials.new(name)
    item.diffuse_color=(*color,1)
    item.use_nodes=True
    shader=item.node_tree.nodes.get("Principled BSDF")
    shader.inputs["Base Color"].default_value=(*color,1)
    shader.inputs["Roughness"].default_value=rough
    shader.inputs["Metallic"].default_value=metal
    return item

skin=material("Weathered skin",(.40,.23,.14))
leather=material("Oiled brown leather",(.083,.046,.026))
wool=material("Earth dyed wool",(.14,.10,.068))
boots=material("Boots and belts",(.043,.027,.017))
fur=material("Shoulder hide",(.19,.13,.081))
hair=material("Dark hair and beard",(.040,.024,.016))
copper=material("Tarnished bronze",(.31,.18,.08),.54,.48)
iron=material("Iron",(.20,.20,.19),.42,.55)

def mesh(name, vertices, faces, mats):
    data=bpy.data.meshes.new(name)
    data.from_pydata([(x,-z,y) for x,y,z in vertices],[],faces)
    data.update()
    obj=bpy.data.objects.new(name,data)
    bpy.context.collection.objects.link(obj)
    for m in mats: data.materials.append(m)
    for p in data.polygons:p.use_smooth=True
    return obj

vertices=[]; faces=[]; group=None
for line in source.read_text().splitlines():
    fields=line.split()
    if not fields:continue
    if fields[0]=="v":vertices.append(tuple(map(float,fields[1:4])))
    elif fields[0]=="g":group=fields[1]
    elif fields[0]=="f" and group=="body":
        faces.append(tuple(int(f.split("/")[0])-1 for f in fields[1:]))
used=sorted(set().union(*map(set,faces)))
remap={old:new for new,old in enumerate(used)}
posed=[]
for index in used:
    x,y,z=vertices[index]
    if abs(x)>2 and y>.6:
        shoulder=max(0,min(1,(abs(x)-1.7)/2.8))
        x=math.copysign(abs(x)-shoulder*2.1,x)
        y-=shoulder*3.1
        z-=shoulder*.72
    posed.append((x*.115,(y+8.17)*.115,z*.115))
body=mesh("MakeHuman body",posed,[tuple(remap[i] for i in f) for f in faces],[skin,leather,wool,boots,hair])
for poly in body.data.polygons:
    x,depth,y=poly.center
    if y<.32:poly.material_index=3
    elif y<.91:poly.material_index=2
    elif y<1.53 and (abs(x)<.19 or y>1.05):poly.material_index=1
    elif y>1.79 or (y>1.68 and depth>-.092):poly.material_index=4
    elif 1.65<y<1.72 and depth<-.109:poly.material_index=4

def garment(name,rings,material,angle_start,angle_end):
    count=34
    v=[];f=[]
    for j,(y,radius,depth) in enumerate(rings):
        for i in range(count):
            a=angle_start+(angle_end-angle_start)*i/(count-1)
            dr=.011*math.sin(a*11+j*.38)+.009*math.cos(a*17-j*.6)
            v.append(((radius+dr)*math.sin(a),y+(dr*3 if j==len(rings)-1 else dr),depth+(radius*.62+dr)*math.cos(a)))
            k=j*count+i
            if j and i:f.append((k-count-1,k-count,k,k-1))
    obj=mesh(name,v,f,[material])
    solid=obj.modifiers.new("Leather thickness","SOLIDIFY")
    solid.thickness=.012
    bpy.context.view_layer.objects.active=obj
    bpy.ops.object.modifier_apply(modifier=solid.name)
    return obj

garment("Long hide mantle",[(1.48,.27,.025),(1.36,.31,.01),(1.16,.29,-.025),(.87,.31,-.038),(.57,.38,-.039),(.37,.42,-.048)],leather,.69,math.tau-.69)
garment("Fur shoulder collar",[(1.58,.12,.022),(1.54,.21,.019),(1.49,.30,.01),(1.40,.32,-.006)],fur,.44,math.tau-.44)
garment("Worn tunic",[(1.30,.205,.025),(1.14,.17,.025),(.98,.19,.021),(.78,.229,.019),(.72,.245,.01)],wool,0,math.tau)
garment("Waist belt",[(1.036,.183,.024),(.982,.19,.024)],boots,0,math.tau)

def oval(name,location,scale,mat):
    x,y,z=location
    bpy.ops.mesh.primitive_uv_sphere_add(segments=16,ring_count=10,location=(x,-z,y))
    obj=bpy.context.object
    obj.name=name
    obj.scale=(scale[0],scale[2],scale[1])
    obj.data.materials.append(mat)
    for face in obj.data.polygons:face.use_smooth=True
    return obj

def rod(name,a,b,radius,mat):
    start=Vector((a[0],-a[2],a[1]))
    end=Vector((b[0],-b[2],b[1]))
    delta=end-start
    bpy.ops.mesh.primitive_cylinder_add(vertices=12,radius=radius,depth=delta.length,location=(start+end)/2)
    obj=bpy.context.object
    obj.name=name
    obj.rotation_euler=delta.to_track_quat('Z','Y').to_euler()
    obj.data.materials.append(mat)

oval("Bronze clasp",(.13,1.46,.158),(.044,.044,.019),copper)
oval("Pouch",(-.18,.925,.085),(.095,.117,.061),boots)
oval("Belt buckle",(.02,1.02,.157),(.046,.032,.018),copper)
oval("Hair shape",(0,1.817,.047),(.105,.114,.099),hair)
oval("Beard",(0,1.666,.136),(.065,.047,.028),hair)
rod("Cross-chest leather strap",(-.19,1.46,.135),(.13,1.03,.156),.023,boots)
rod("Sword scabbard",(-.22,1.63,-.145),(.21,.72,-.16),.038,boots)
rod("Sword hilt",(-.22,1.62,-.145),(-.285,1.82,-.145),.020,iron)

body.shape_key_add(name="Basis")
for name,phase in [("Stride",1),("Counterstride",-1)]:
    key=body.shape_key_add(name=name)
    for index,(x,y,z) in enumerate(posed):
        side=math.copysign(1,x)*phase
        leg=max(0,min(1,(.86-y)/.84))
        if leg:
            key.data[index].co.y-=side*leg*.19
            key.data[index].co.z+=max(0,side)*leg*.07
        elif abs(x)>.22 and .71<y<1.43:
            key.data[index].co.y+=side*max(0,1.43-y)*.13

bpy.ops.export_scene.gltf(filepath=str(output.resolve()),export_format="GLB",export_animations=False)
