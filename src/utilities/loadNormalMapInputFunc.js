import * as THREE from 'three';

export function loadNormalMapInputFunc(event, activeMesh) {
  const file = event.target.files[0];
  if (file && activeMesh) {
    const url = URL.createObjectURL(file);
    console.log(url);
    new THREE.TextureLoader().load(url, (texture) => {
      console.log('Текстура загружена:', texture);
      activeMesh.material.normalMap = texture;
      console.log('Текстура применена:', activeMesh.material.normalMap);
      activeMesh.material.needsUpdate = true;
    });
  } else {
    console.log('no mesh found');
  }
}