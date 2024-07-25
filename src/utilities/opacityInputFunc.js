export function opacityInputFunc(activeMesh, value) {
  const newOpacity = parseFloat(value);
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
}