/**
 * URL hash handling for deep-linking to specimens
 */

import type { SpecimenData } from './types';
import { openModal } from './modal-controller';

/**
 * Check the URL hash and auto-open specimen modal if it matches
 * Supports links like /#specimen-slug from QR codes
 */
export function checkHashAndOpen(): void {
  const hash = window.location.hash.slice(1); // remove #
  if (!hash) return;

  // Find specimen element with this id
  const specimenEl = document.querySelector(
    `.specimen#${CSS.escape(hash)}[data-specimen]`
  ) as HTMLElement | null;

  if (!specimenEl) return;

  const specimenData = specimenEl.dataset.specimen;
  if (!specimenData) return;

  try {
    const data = JSON.parse(specimenData) as SpecimenData;
    // Small delay to ensure page has scrolled to element first
    setTimeout(() => openModal(data), 100);
  } catch (e) {
    console.error('Failed to parse specimen data from hash:', e);
  }
}

/**
 * Initialize hash change listener
 */
export function initHashListener(): void {
  // Check on initial load
  checkHashAndOpen();

  // Check when hash changes (e.g., clicking internal links)
  window.addEventListener('hashchange', checkHashAndOpen);
}
