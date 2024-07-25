export function addModelToScene(model, normalizeModelSize, scene, models) {
  normalizeModelSize(model, 2);
  scene.add(model);
  console.log('Model has been added');
  models.push(model);
}