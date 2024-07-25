import {disposeMaterial} from './disposeMaterial.js';
import * as THREE from 'three';
import {hideElements} from './hideElements.js';

export function clearLoadedModels(
    models, scene, activeMesh, transformControls, fileMap) {
  models.forEach(model => {
    scene.remove(model);
    model.traverse((child) => {
      if (child.geometry) child.geometry.dispose();
      if (child.material) {
        if (Array.isArray(child.material)) {
          child.material.forEach(disposeMaterial);
        } else {
          disposeMaterial(child.material);
        }
      }
    });
  });
  models = [];
  activeMesh = null;
  transformControls.detach();
  THREE.Cache.clear();
  fileMap.forEach(url => URL.revokeObjectURL(url));
  fileMap.clear();
  hideElements('.hidedElement');
}