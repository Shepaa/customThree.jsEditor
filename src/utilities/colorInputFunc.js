export function colorInputFunc(activeMesh, value) {
  if (activeMesh) {
    const newColor = value;
    console.log('Выбранный цвет:', newColor);
    activeMesh.material.color.setHex(parseInt(newColor.substr(1), 16));
  } else {
    console.log('You didn\'t chose any meshes');
  }
}