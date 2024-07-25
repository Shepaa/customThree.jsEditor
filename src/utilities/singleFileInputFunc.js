export function singleFileInputFunc(event, loadFBX, loadGLTF) {
  const file = event.target.files[0];
  if (file) {
    const fileExtension = file.name.split('.').pop().toLowerCase();
    if (['glb', 'gltf', 'fbx'].includes(fileExtension)) {
      const url = URL.createObjectURL(file);
      if (fileExtension === 'fbx') {
        loadFBX(file, new Map([[file.name, url]]));
      } else {
        loadGLTF(file, new Map([[file.name, url]]));
      }
    } else {
      console.error('Unsupported file format');
    }
  }

}