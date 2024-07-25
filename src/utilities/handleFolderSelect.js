export function handleFolderSelect(event, fileMap, loadGLTF, loadFBX) {
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