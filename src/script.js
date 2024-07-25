import * as THREE from 'three';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import {
  EffectComposer,
} from 'three/examples/jsm/postprocessing/EffectComposer.js';
import {OutlinePass} from 'three/examples/jsm/postprocessing/OutlinePass.js';
import {RenderPass} from 'three/examples/jsm/postprocessing/RenderPass.js';
import {
  TransformControls,
} from 'three/examples/jsm/controls/TransformControls.js';
import {FBXLoader} from 'three/examples/jsm/loaders/FBXLoader.js';
import {showElements} from './utilities/showElements.js';
import {hideElements} from './utilities/hideElements.js';
import {disposeMaterial} from './utilities/disposeMaterial.js';
import {
  clearButton,
  colorInput,
  controlPanel, folderInput,
  loadButton,
  loadEnvBtn,
  loadEnvInput, loadMapButton,
  loadNormalMapBtn,
  loadNormalMapInput,
  loadSingleFileButton, mapInput, metalnessInput, opacityInput, roughnessInput,
  singleFileInput,
} from './utilities/buttons/index.js';
import {
  ambientLight,
  directionalLight,
  pointLight,
} from './utilities/lights.js';
import {addModelToScene} from './utilities/addModelToScene.js';
import {singleFileInputFunc} from './utilities/singleFileInputFunc.js';
import {loadNormalMapBtnFunc} from './utilities/loadNormalMapBtnFunc.js';
import {loadNormalMapInputFunc} from './utilities/loadNormalMapInputFunc.js';
import {
  setupEnvironmentMapLoader,
} from './utilities/setupEnvironmentMapLoader.js';
import {resize} from './utilities/resize.js';
import {sizes} from './utilities/sizes.js';
import {handleFolderSelect} from './utilities/handleFolderSelect.js';
import {mapInputFunc} from './utilities/mapInputFunc.js';
import {opacityInputFunc} from './utilities/opacityInputFunc.js';
import {colorInputFunc} from './utilities/colorInputFunc.js';
import {camera} from './utilities/camera.js';
import {gridHelper} from './utilities/gridHelper.js';
import {clearLoadedModels} from './utilities/clearLoadedModels.js';
import {normalizeModelSize} from './utilities/normalizeModelSize.js';

let activeMesh = null;
let models = [];
const canvas = document.querySelector('canvas.webgl');
const scene = new THREE.Scene();
let fileMap = new Map();

loadSingleFileButton.addEventListener('click', () => {
  singleFileInput.click();
});

singleFileInput.addEventListener('change',
    (event) => singleFileInputFunc(event, loadFBX, loadGLTF));
controlPanel.addEventListener('mousedown', (event) => {
  event.stopPropagation();
});
controlPanel.addEventListener('click', (event) => {
  event.stopPropagation();
});
loadNormalMapBtn.addEventListener('click',
    (event) => loadNormalMapBtnFunc(event));
loadNormalMapInput.addEventListener('change',
    (event) => { loadNormalMapInputFunc(event, activeMesh);});

loadEnvBtn.addEventListener('click', () => {
  loadEnvInput.value = '';
  loadEnvInput.click();
});

loadEnvInput.addEventListener('change',
    (event) => setupEnvironmentMapLoader(event, applyEnvironmentMap));

function applyEnvironmentMap(envMap) {
  scene.background = envMap;
  scene.environment = envMap;

  if (activeMesh) {
    activeMesh.material.envMap = envMap;
    activeMesh.material.needsUpdate = true;
  }
}

loadButton.addEventListener('click', () => {
  folderInput.click();
});
folderInput.addEventListener('change',
    (event) => handleFolderSelect(event, fileMap, loadGLTF, loadFBX));

function loadGLTF(gltfFile, fileMap) {
  const manager = new THREE.LoadingManager();
  manager.setURLModifier((url) => {
    const fileName = url.split('/').pop();
    return fileMap.get(fileName) || url;
  });

  const loader = new GLTFLoader(manager);
  const gltfUrl = URL.createObjectURL(gltfFile);

  loader.load(gltfUrl, (gltf) => {
    console.log('Загружена GLTF модель:', gltf.scene);

    // Обработка текстур
    gltf.scene.traverse((child) => {
      if (child.isMesh) {
        if (child.material) {
          const materials = Array.isArray(child.material)
              ? child.material
              : [child.material];
          materials.forEach(material => {
            [
              'map',
              'normalMap',
              'roughnessMap',
              'metalnessMap',
              'emissiveMap'].forEach(mapType => {
              if (material[mapType]) {
                const textureName = material[mapType].name ||
                    material[mapType].source.data.name;
                const textureUrl = fileMap.get(textureName);
                if (textureUrl) {
                  const loader = new THREE.TextureLoader(manager);
                  material[mapType] = loader.load(textureUrl);
                  material.needsUpdate = true;
                }
              }
            });
          });
        }
      }
    });

    addModelToScene(gltf.scene, normalizeModelSize, scene, models);
  }, undefined, (error) => {
    console.error('Ошибка при загрузке GLTF файла:', error);
  });
}

function loadFBX(fbxFile, fileMap) {
  const manager = new THREE.LoadingManager();
  manager.setURLModifier((url) => {
    const fileName = url.split('/').pop();
    return fileMap.get(fileName) || url;
  });

  const fbxLoader = new FBXLoader(manager);
  const fbxUrl = URL.createObjectURL(fbxFile);

  fbxLoader.load(fbxUrl, (object) => {
    console.log('Загружена FBX модель:', object);

    // Загрузка текстур
    object.traverse((child) => {
      if (child.isMesh) {
        if (child.material) {
          const materials = Array.isArray(child.material)
              ? child.material
              : [child.material];
          materials.forEach(material => {
            ['map', 'normalMap', 'specularMap', 'emissiveMap'].forEach(
                mapType => {
                  if (material[mapType]) {
                    const textureName = material[mapType].name;
                    const textureUrl = fileMap.get(textureName);
                    if (textureUrl) {
                      const loader = new THREE.TextureLoader(manager);
                      material[mapType] = loader.load(textureUrl);
                    }
                  }
                });
          });
        }
      }
    });

    addModelToScene(object, normalizeModelSize, scene, models);
  }, (xhr) => {
    console.log((xhr.loaded / xhr.total * 100) + '% загружено');
  }, (error) => {
    console.error('Ошибка при загрузке FBX файла:', error);
  });
}

loadMapButton.addEventListener('click', () => {
  mapInput.click();
});

mapInput.addEventListener('change', (event) => mapInputFunc(event, activeMesh));


opacityInput.addEventListener('click', function(event) {
  event.stopPropagation();
});

opacityInput.addEventListener('input', function() {
  opacityInputFunc(activeMesh, this.value);
});

colorInput.addEventListener('click', function(event) {
  event.stopPropagation();
});

colorInput.addEventListener('input', function() {
  colorInputFunc(activeMesh, this.value);
});

function setupMaterialControl(input, property) {
  input.addEventListener('click', function(event) {
    event.stopPropagation();
  });

  input.addEventListener('input', function() {
    const newValue = parseFloat(this.value);
    console.log(`Выбранное значение ${property}:`, newValue);

    if (activeMesh) {
      activeMesh.traverse((child) => {
        if (child.isMesh) {
          if (Array.isArray(child.material)) {
            child.material.forEach(material => {
              if (material[property] !== undefined) {
                material[property] = newValue;
                material.needsUpdate = true;
              }
            });
          } else if (child.material[property] !== undefined) {
            child.material[property] = newValue;
            child.material.needsUpdate = true;
          }
        }
      });
    }
  });
}

setupMaterialControl(metalnessInput, 'metalness');
setupMaterialControl(roughnessInput, 'roughness');

clearButton.addEventListener('click',
    () => clearLoadedModels(models, scene, activeMesh, transformControls,
        fileMap));
scene.add(gridHelper);
scene.add(directionalLight);
scene.add(ambientLight);
scene.add(pointLight);

window.addEventListener('resize', () => {
  resize(sizes, camera, renderer, composer, outlinePass);
});
scene.add(camera);

const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;

const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
});
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setClearColor('#363636');
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

const composer = new EffectComposer(renderer);
const renderPass = new RenderPass(scene, camera);
composer.addPass(renderPass);

const outlinePass = new OutlinePass(
    new THREE.Vector2(sizes.width, sizes.height), scene, camera,
);
outlinePass.edgeStrength = 10;
outlinePass.edgeGlow = 1;
outlinePass.edgeThickness = 4;
outlinePass.pulsePeriod = 0;
outlinePass.visibleEdgeColor.set('#ffffff');
outlinePass.hiddenEdgeColor.set('#190a05');
composer.addPass(outlinePass);

const transformControls = new TransformControls(camera, canvas);
transformControls.addEventListener('dragging-changed', (event) => {
  controls.enabled = !event.value;
});

window.addEventListener('click', onMouseClick, false);

function onMouseClick(event) {
  mouse.x = (event.clientX / sizes.width) * 2 - 1;
  mouse.y = -(event.clientY / sizes.height) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(scene.children, true).
  filter(intersect => !intersect.object.userData.ignoreRaycast);

  if (intersects.length > 0) {
    const object = intersects[0].object;
    activeMesh = object;
    activeMesh = activeMesh;
    outlinePass.selectedObjects = [activeMesh];
    scene.add(transformControls);
    transformControls.attach(activeMesh);
    showElements('.hidedElement');
  } else {
    activeMesh = null;
    activeMesh = null;
    outlinePass.selectedObjects = [];
    transformControls.detach();
    hideElements('.hidedElement');
  }
}

const tick = () => {
  if (activeMesh && outlinePass.selectedObjects.length === 0) {
    outlinePass.selectedObjects = [activeMesh];
    transformControls.attach(activeMesh);
  }
  controls.update();
  composer.render();
  window.requestAnimationFrame(tick);
};

tick();
