import {loadNormalMapInput} from './buttons/index.js';

export function loadNormalMapBtnFunc(event) {
  event.preventDefault();
  loadNormalMapInput.value = ''; // Сбросить предыдущий выбор файла
  loadNormalMapInput.click();
}