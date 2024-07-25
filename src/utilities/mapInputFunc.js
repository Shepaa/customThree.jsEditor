import * as THREE from 'three';

export function mapInputFunc(event, activeMesh){
  const file = event.target.files[0];
  if (file && activeMesh) {
    const url = URL.createObjectURL(file);
    console.log(url);
    new THREE.TextureLoader().load(url, (texture) => {
      activeMesh.material.needsUpdate = true;
      activeMesh.material.map = texture;
      console.log(texture);
      console.log('Текстура поменялась');
    });
  } else {
    console.log('no mesh found');
  }
}