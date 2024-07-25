import * as THREE from 'three';

export const gridHelper = new THREE.GridHelper(10, 20);
gridHelper.rotation.y = 0.7796;
gridHelper.userData.ignoreRaycast = true; // Добавьте эту строку