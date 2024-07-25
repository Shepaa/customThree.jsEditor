import * as THREE from 'three';
import {sizes} from './sizes.js';

export const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1,
    100);
camera.position.x = 4;
camera.position.y = 8;
camera.position.z = 4;