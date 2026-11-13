from pathlib import Path
import numpy as np
import trimesh
import json
from math import sin, floor, exp
root=Path(__file__).resolve().parent

def frac(a): return a-floor(a)
def noise(x,z):return frac(sin(x*127.1+z*311.7)*43758.5453123)
def sm(t):return t*t*(3-2*t)
def ln(a,b,t):return a+(b-a)*t
def vn(x,z):
    ix,iz=floor(x),floor(z);fx=sm(x-ix);fz=sm(z-iz)
    return ln(ln(noise(ix,iz),noise(ix+1,iz),fx),ln(noise(ix,iz+1),noise(ix+1,iz+1),fx),fz)
def river(z):return 4*sin(z*.07)+3.5*sin(z*.025+1.8)
def height(x,z):
    v=(vn(x*.065,z*.065)-.5)*2.15+(vn(x*.13+17,z*.13+25)-.5)*.8
    ridge=max(0,min(1,(z-16)/48))**1.35*15.5+max(0,min(1,(-x-39)/28))**1.65*10
    carve=2.6*exp(-((x-river(z))/6.7)**2)
    return v+ridge-carve-1.2

N=112;Z=100
vertices=[];colors=[];faces=[]
for j in range(Z+1):
    z=-63+j*126/Z
    for i in range(N+1):
        x=-72+i*144/N;y=height(x,z);m=vn(x*.16,z*.16); r=abs(x-river(z))
        if r<6.5: col=(.35,.38,.30,1)
        elif y>10:col=(.42,.43,.38,1)
        elif y>4:col=(.34,.43,.32,1)
        else:col=(.24+.08*m,.34+.08*m,.25+.035*m,1)
        vertices.append((x,y,z));colors.append(tuple(round(v*255) for v in col))
for j in range(Z):
    for i in range(N):
        a=j*(N+1)+i;b=a+1;c=a+N+1;d=c+1
        faces.extend(((a,c,b),(b,c,d)))
mesh=trimesh.Trimesh(vertices=np.array(vertices),faces=np.array(faces),process=False)
mesh.visual.vertex_colors=np.array(colors,dtype=np.uint8)
scene=trimesh.Scene();scene.add_geometry(mesh,geom_name='Ravan_Dolina_Original_Terrain')
# River ribbon, matching the JS-demo curve (cosmetic visual only).
rv=[];rf=[];rcolors=[];L=140
for j in range(L+1):
    z=-63+j*126/L;rx=river(z);ww=3.5+.65*sin(z*.07)
    for k in range(2):
        x=rx+(ww if k else -ww)
        rv.append((x,height(x,z)+.24,z))
        rcolors.append([51,112,123,255])
for j in range(L):
    a=2*j;rf.extend(((a,a+2,a+1),(a+1,a+2,a+3)))
rm=trimesh.Trimesh(vertices=np.array(rv),faces=np.array(rf),process=False)
rm.visual.vertex_colors=np.array(rcolors,dtype=np.uint8)
scene.add_geometry(rm,geom_name='Ravan_Reka_Original')
out=root/'Ravan_Originalni_Teren_Dolina.glb'
out.write_bytes(scene.export(file_type='glb'))
print(out,round(out.stat().st_size/1024),'KiB, tris',len(faces)+len(rf))
