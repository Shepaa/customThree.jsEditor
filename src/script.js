import * as THREE from 'three';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js';
import GUI from 'lil-gui';
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
import {log} from 'three/nodes';
import {RGBELoader} from 'three/examples/jsm/loaders/RGBELoader.js';

let activeMesh = null;
const rgbeLoader = new RGBELoader();

const clearButton = document.getElementById('clearButton');
const colorInput = document.querySelector('#colorInput');
const opacityInput = document.querySelector('#opacityInput');
const metalnessInput = document.querySelector('#metalnessInput');
const roughnessInput = document.querySelector('#roughnessInput');
const loadNormalMapInput = document.querySelector('#normalMapInput');
const mapInput = document.getElementById('mapInput');
const loadEnvInput = document.getElementById('envMapFile');
const folderInput = document.getElementById('folderInput');
const loadMapButton = document.getElementById('loadMapButton');
const loadButton = document.getElementById('loadButton');
const loadEnvBtn = document.getElementById('loadEnvMapButton');
const loadNormalMapBtn = document.querySelector('#loadNormalMapButton');
const controlPanel = document.querySelector('.load-Btn-Wrapper');
controlPanel.addEventListener('mousedown', (event) => {
  event.stopPropagation();
});
controlPanel.addEventListener('click', (event) => {
  event.stopPropagation();
});
let fileMap = new Map();

loadNormalMapBtn.addEventListener('click', (event) => {
  event.preventDefault();
  loadNormalMapInput.value = ''; // Сбросить предыдущий выбор файла
  loadNormalMapInput.click();
});
loadNormalMapInput.addEventListener('change', (event) => {
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
});

loadEnvBtn.addEventListener('click', () => {
  loadEnvInput.value = ''; // Сбросить предыдущий выбор файла
  loadEnvInput.click();
});

loadEnvInput.addEventListener('change', (event) => {
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
});

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

folderInput.addEventListener('change', handleFolderSelect);

function handleFolderSelect(event) {
  const files = Array.from(event.target.files);
  const gltfFile = files.find(
      file => file.name.toLowerCase().endsWith('.gltf') ||
          file.name.toLowerCase().endsWith('.glb'));
  const fbxFile = files.find(file => file.name.toLowerCase().endsWith('.fbx'));

  if (!gltfFile && !fbxFile) {
    console.error('GLTF/GLB или FBX файл не найден в выбранной папке');
    return;
  }

  fileMap.clear();
  files.forEach(file => {
    const blobURL = URL.createObjectURL(file);
    fileMap.set(file.name, blobURL);
  });

  if (gltfFile) {
    loadGLTF(gltfFile, fileMap);
  } else if (fbxFile) {
    loadFBX(fbxFile, fileMap);
  }
}

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

    addModelToScene(gltf.scene);
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

    addModelToScene(object);
  }, (xhr) => {
    console.log((xhr.loaded / xhr.total * 100) + '% загружено');
  }, (error) => {
    console.error('Ошибка при загрузке FBX файла:', error);
  });
}

loadMapButton.addEventListener('click', () => {
  mapInput.click();
});

mapInput.addEventListener('change', (event) => {
  const file = event.target.files[0];
  if (file && activeMesh) {
    const url = URL.createObjectURL(file);
    console.log(url);
    new THREE.TextureLoader().load(url, (texture) => {
      activeMesh.material.needsUpdate = true;
      activeMesh.material.map = texture;
      console.log(texture);
      console.log("Текстура поменялась");
    });
  } else {
    console.log('no mesh found');
  }
});
let models = [];

const scene = new THREE.Scene();

opacityInput.addEventListener('click', function(event) {
  event.stopPropagation();
});

opacityInput.addEventListener('input', function() {
  const newOpacity = parseFloat(this.value);
  console.log('Выбранная прозрачность:', newOpacity);

  if (activeMesh) {
    activeMesh.traverse((child) => {
      if (child.isMesh) {
        if (Array.isArray(child.material)) {
          child.material.forEach(material => {
            material.opacity = newOpacity;
            material.transparent = newOpacity < 1;
          });
        } else {
          child.material.opacity = newOpacity;
          child.material.transparent = newOpacity < 1;
        }
      }
    });
  }
});

colorInput.addEventListener('click', function(event) {
  event.stopPropagation();
});

colorInput.addEventListener('input', function() {
  if (activeMesh) {
    const newColor = this.value;
    console.log('Выбранный цвет:', newColor);
    activeMesh.material.color.setHex(parseInt(newColor.substr(1), 16));
  } else {
    console.log('You didn\'t chose any meshes');
  }
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

function normalizeModelSize(model, targetSize = 1) {
  const box = new THREE.Box3().setFromObject(model);
  const size = box.getSize(new THREE.Vector3());
  const maxDimension = Math.max(size.x, size.y, size.z);
  const scale = targetSize / maxDimension;
  model.scale.multiplyScalar(scale);
}

function addModelToScene(model) {
  normalizeModelSize(model, 2);
  scene.add(model);
  console.log('Model has been added');
  models.push(model);
}

// Функция для удаления всех загруженных моделей
function clearLoadedModels() {
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

  // Очистка Blob URL
  fileMap.forEach(url => URL.revokeObjectURL(url));
  fileMap.clear();
  hideElements()
}

function disposeMaterial(material) {
  Object.keys(material).forEach(prop => {
    if (!material[prop]) return;
    if (material[prop] !== null && typeof material[prop].dispose ===
        'function') {
      material[prop].dispose();
    }
  });
  material.dispose();
}

// Обработчик события для кнопки очистки
clearButton.addEventListener('click', clearLoadedModels);

const gridHelper = new THREE.GridHelper(10, 20);
gridHelper.rotation.y = 0.7796;
gridHelper.userData.ignoreRaycast = true; // Добавьте эту строку
scene.add(gridHelper);

/**
 * Base
 */

// Lights
const directionalLights = new THREE.DirectionalLight('#ffffff', 20);
const ambientLights = new THREE.AmbientLight('#ffffff', 9);
scene.add(ambientLights);
scene.add(directionalLights);

// Canvas
const canvas = document.querySelector('canvas.webgl');

/**
 * Sizes
 */
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
};

window.addEventListener('resize', () => {
  // Update sizes
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;

  // Update camera
  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();

  // Update renderer
  renderer.setSize(sizes.width - 240, sizes.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  // Update composer
  composer.setSize(sizes.width, sizes.height);
  outlinePass.resolution.set(sizes.width, sizes.height);
});

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1,
    100);
camera.position.x = 4;
camera.position.y = 8;
camera.position.z = 4;
scene.add(camera);

// Controls
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
});
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setClearColor('#363636');

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

// TransformControls
const transformControls = new TransformControls(camera, canvas);
transformControls.addEventListener('dragging-changed', function(event) {
  controls.enabled = !event.value;
});
// scene.add(transformControls);

// Обработчик клика
window.addEventListener('click', onMouseClick, false);

// Добавляем функции для показа и скрытия элементов
function showElements() {
  document.querySelectorAll('.hidedElement').forEach((element) => {
    element.style.display = 'block';
  });
}

function hideElements() {
  document.querySelectorAll('.hidedElement').forEach((element) => {
    element.style.display = 'none';
  });
}
function onMouseClick(event) {
  // Вычисляем положение мыши в нормализованных координатах устройства (-1 to +1) для обоих компонентов
  mouse.x = (event.clientX / sizes.width) * 2 - 1;
  mouse.y = -(event.clientY / sizes.height) * 2 + 1;

  // Обновляем луч с помощью позиции мыши и камеры
  raycaster.setFromCamera(mouse, camera);

  // Вычисляем объекты, пересекающиеся с лучом
  const intersects = raycaster.intersectObjects(scene.children, true).
  filter(intersect => !intersect.object.userData.ignoreRaycast);

  if (intersects.length > 0) {
    // Получаем первый пересеченный объект (ближайший к камере)
    const object = intersects[0].object;

    // Устанавливаем активный меш
    activeMesh = object;
    activeMesh = activeMesh;

    // Обновляем контур
    outlinePass.selectedObjects = [activeMesh];
    scene.add(transformControls);
    transformControls.attach(activeMesh);
    showElements();
  } else {
    // Если клик был не по объекту, сбрасываем активный меш
    activeMesh = null;
    activeMesh = null;
    outlinePass.selectedObjects = [];
    transformControls.detach();
    hideElements();
  }
}

/**
 * Animate
 */
const clock = new THREE.Clock();

const tick = () => {
  const elapsedTime = clock.getElapsedTime();

  if (activeMesh && outlinePass.selectedObjects.length === 0) {
    outlinePass.selectedObjects = [activeMesh];
    transformControls.attach(activeMesh);
  }

  // Update controls
  controls.update();

  // Render
  composer.render();

  // Call tick again on the next frame
  window.requestAnimationFrame(tick);
};

tick();
