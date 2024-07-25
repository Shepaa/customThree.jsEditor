import {rgbeLoader} from './loaders.js';
import * as THREE from 'three';

export function setupEnvironmentMapLoader(event, applyEnvironmentMap) {
  console.log('EnvMap file selection started');

  if (event.target.files.length === 0) {
    console.log('No file selected');
    return;
  }

  const files = Array.from(event.target.files);
  const singleFile = files.find(
      file => file.name.match(/\.(hdr|jpeg|jpg|png)$/i),
  );

  if (!singleFile) {
    console.log('No valid file selected');
    return;
  }

  console.log('Selected file:', singleFile.name);

  const url = URL.createObjectURL(singleFile);

  if (singleFile.name.match(/\.hdr$/i)) {
    rgbeLoader.load(url,
        (environmentMap) => {
          environmentMap.mapping = THREE.EquirectangularReflectionMapping;
          applyEnvironmentMap(environmentMap);
          console.log('Loaded HDR file');
        },
        undefined,
        (error) => {
          console.error('Error loading HDR:', error);
        },
    );
  } else {
    const textureLoader = new THREE.TextureLoader();
    textureLoader.load(url,
        (environmentMap) => {
          environmentMap.mapping = THREE.EquirectangularReflectionMapping;
          applyEnvironmentMap(environmentMap);
          console.log('Loaded texture');
        },
        undefined,
        (error) => {
          console.error('Error loading texture:', error);
        },
    );
  }

}