import * as T from 'three';
import {bounds, heightProfile} from './world.js';

export function valleyExtension(material) {
  const terrain = new T.Group();
  const stepX=144/112, stepZ=126/100;
  for(let tz=-140;tz<140;tz+=28){
    for(let tx=-156;tx<156;tx+=26){
      const vertices=[], uv=[], triangles=[];
      for(let j=0;j<=28;j++)for(let i=0;i<=26;i++){
        const x=(tx+i)*stepX,z=(tz+j)*stepZ;
        vertices.push(x,heightProfile(x,z),z);
        uv.push(x*.32,z*.32);
      }
      for(let j=0;j<28;j++)for(let i=0;i<26;i++){
        const x=(tx+i+.5)*stepX,z=(tz+j+.5)*stepZ;
        if(Math.abs(x)<72&&Math.abs(z)<63)continue;
        const k=j*27+i;
        triangles.push(k,k+27,k+1,k+1,k+27,k+28);
      }
      if(!triangles.length)continue;
      const geometry=new T.BufferGeometry();
      geometry.setAttribute('position',new T.Float32BufferAttribute(vertices,3));
      geometry.setAttribute('uv',new T.Float32BufferAttribute(uv,2));
      geometry.setIndex(triangles);
      geometry.computeVertexNormals();
      const mesh=new T.Mesh(geometry,material);
      mesh.receiveShadow=true;
      terrain.add(mesh);
    }
  }
  terrain.name=`Valley ${bounds.x*2} by ${bounds.z*2}`;
  return terrain;
}
