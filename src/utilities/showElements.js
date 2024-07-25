export function showElements(elementClass) {
  document.querySelectorAll(elementClass).forEach((element) => {
    element.style.display = 'block';
  });
}