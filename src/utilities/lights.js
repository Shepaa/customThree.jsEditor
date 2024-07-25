import * as THREE from 'three';

export const directionalLight = new THREE.DirectionalLight('#ffffff', 1.5); // Уменьшена интенсивность
directionalLight.position.set(5, 5, 5);
directionalLight.castShadow = true; // Включаем отбрасывание теней
export  const ambientLight = new THREE.AmbientLight('#ffffff', 0.7); // Уменьшена интенсивность
export  const pointLight = new THREE.PointLight('#ffffff', 1.5);
pointLight.position.set(-5, 5, -5);