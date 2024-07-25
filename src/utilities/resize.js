export function resize(sizes, camera, renderer, composer, outlinePass) {
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
}