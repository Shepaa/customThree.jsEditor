import * as THREE from 'three';

export function normalizeModelSize(model, targetSize = 1) {
  const box = new THREE.Box3().setFromObject(model);
  const size = box.getSize(new THREE.Vector3());
  const maxDimension = Math.max(size.x, size.y, size.z);
  const scale = targetSize / maxDimension;
  model.scale.multiplyScalar(scale);
}