export function hideElements(elementClass) {
  document.querySelectorAll(elementClass).forEach((element) => {
    element.style.display = 'none';
  });
}