/**
 * Modal open/close state management and DOM manipulation
 */

import type { SpecimenData, ModalRefs } from './types';
import { ROMAN_NUMERALS } from './constants';
import { trackSpecimenOpen } from './tracking';
import { loadSketch, destroySketch } from './sketch-loader';

// Modal state
let isOpen = false;
let refs: ModalRefs | null = null;

/**
 * Get and cache DOM element references
 */
export function getModalRefs(): ModalRefs | null {
  if (refs) return refs;

  const modal = document.getElementById('specimen-modal') as HTMLDivElement | null;
  if (!modal) return null;

  const closeBtn = modal.querySelector('.modal-close') as HTMLButtonElement;
  const canvasContainer = document.getElementById('modal-canvas') as HTMLDivElement;
  const loadingEl = canvasContainer?.querySelector('.modal-loading') as HTMLDivElement;
  const nameEl = document.getElementById('modal-name') as HTMLHeadingElement;
  const seriesEl = document.getElementById('modal-series') as HTMLParagraphElement;
  const descriptionEl = document.getElementById('modal-description') as HTMLParagraphElement;

  refs = {
    modal,
    closeBtn,
    canvasContainer,
    loadingEl,
    nameEl,
    seriesEl,
    descriptionEl,
  };

  return refs;
}

/**
 * Open the specimen modal with the given data
 */
export function openModal(specimen: SpecimenData): void {
  if (isOpen) return;

  const modalRefs = getModalRefs();
  if (!modalRefs) return;

  isOpen = true;

  // Track specimen open for analytics
  trackSpecimenOpen({ name: specimen.name, series: specimen.series });

  // Set text content
  modalRefs.nameEl.textContent = specimen.name;
  modalRefs.descriptionEl.textContent = specimen.description;

  // Series badge with roman numeral
  if (specimen.series && specimen.seriesIndex) {
    const numeral = ROMAN_NUMERALS[specimen.seriesIndex - 1] ?? String(specimen.seriesIndex);
    modalRefs.seriesEl.textContent = `${specimen.series}.exe ${numeral} / x`;
  } else {
    modalRefs.seriesEl.textContent = '';
  }

  // Set aspect ratio data attribute
  if (specimen.aspectRatio) {
    modalRefs.canvasContainer.dataset.aspect = specimen.aspectRatio;
  } else {
    delete modalRefs.canvasContainer.dataset.aspect;
  }

  // Show modal
  modalRefs.modal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';

  // Show loading state
  modalRefs.loadingEl.classList.remove('hidden');

  // Load sketch dynamically
  loadSketch(
    specimen.sketch,
    modalRefs.canvasContainer,
    () => {
      // Hide loading after brief delay to allow canvas to render
      setTimeout(() => {
        modalRefs.loadingEl.classList.add('hidden');
      }, 100);
    },
    (error) => {
      const loadingText = modalRefs.loadingEl.querySelector('.loading-text');
      if (loadingText) {
        loadingText.textContent = 'failed to load sketch';
      }
    }
  );
}

/**
 * Close the specimen modal
 */
export function closeModal(): void {
  if (!isOpen) return;

  const modalRefs = getModalRefs();
  if (!modalRefs) return;

  isOpen = false;

  // Hide modal
  modalRefs.modal.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';

  // Destroy sketch
  destroySketch();

  // Clear canvas container
  const canvas = modalRefs.canvasContainer.querySelector('canvas');
  if (canvas) canvas.remove();

  // Reset loading state
  modalRefs.loadingEl.classList.remove('hidden');
  const loadingText = modalRefs.loadingEl.querySelector('.loading-text');
  if (loadingText) loadingText.textContent = 'loading...';
}

/**
 * Check if modal is currently open
 */
export function isModalOpen(): boolean {
  return isOpen;
}
