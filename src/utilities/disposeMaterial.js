export function disposeMaterial(material) {
  Object.keys(material).forEach(prop => {
    if (!material[prop]) return;
    if (material[prop] !== null && typeof material[prop].dispose ===
        'function') {
      material[prop].dispose();
    }
  });
  material.dispose();
}