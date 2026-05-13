/**
 * Specimen Modal - modular system for full-size specimen viewer
 *
 * Usage in SpecimenModal.astro:
 *   import { initSpecimenModal } from '../../lib/specimen-modal';
 *   initSpecimenModal();
 */

export type { SpecimenData, SketchModule, SketchOptions, SketchInstance, ModalRefs } from './types';
export { ROMAN_NUMERALS } from './constants';
export { trackSpecimenOpen } from './tracking';
export { loadSketch, destroySketch, getReducedMotionPreference } from './sketch-loader';
export { openModal, closeModal, isModalOpen, getModalRefs } from './modal-controller';
export { checkHashAndOpen, initHashListener } from './hash-handler';

import { openModal, closeModal, isModalOpen, getModalRefs } from './modal-controller';
import { initHashListener } from './hash-handler';

declare global {
  interface Window {
    openSpecimenModal?: typeof openModal;
  }
}

/**
 * Initialize the specimen modal system
 * Sets up event listeners and exposes openSpecimenModal globally
 */
export function initSpecimenModal(): void {
  const refs = getModalRefs();
  if (!refs) {
    console.warn('Specimen modal elements not found');
    return;
  }

  // Close button click
  refs.closeBtn?.addEventListener('click', closeModal);

  // Click outside to close (backdrop click)
  refs.modal?.addEventListener('click', (e) => {
    if (e.target === refs.modal) {
      closeModal();
    }
  });

  // Escape key to close
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isModalOpen()) {
      closeModal();
    }
  });

  // Expose openModal globally for specimen tiles to use
  window.openSpecimenModal = openModal;

  // Initialize hash-based deep linking
  initHashListener();
}
