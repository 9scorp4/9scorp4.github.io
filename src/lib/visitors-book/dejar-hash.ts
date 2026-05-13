/**
 * URL hash handler for VisitorsBook.
 * Handles #dejar navigation to pre-fill the leave message form.
 */

export interface DejarHashContext {
  input: HTMLInputElement;
  updateCursorPosition: () => void;
  updateGhostVisibility: () => void;
  stopTypingAnimation: () => void;
}

/** Initialize #dejar hash handler */
export function initDejarHash(ctx: DejarHashContext): void {
  const { input, updateCursorPosition, updateGhostVisibility, stopTypingAnimation } = ctx;

  function checkDejarHash(): void {
    const hash = window.location.hash;
    if (hash === '#dejar') {
      const template = 'dejar nombre="" mensaje=""';
      input.value = template;
      input.setSelectionRange(14, 14);
      updateCursorPosition();
      updateGhostVisibility();
      stopTypingAnimation();

      history.replaceState(null, '', window.location.pathname + '#visitors-book');

      requestAnimationFrame(() => {
        setTimeout(() => {
          const book = document.getElementById('visitors-book');
          book?.scrollIntoView({ behavior: 'smooth', block: 'center' });
          input?.focus();
        }, 50);
      });
    }
  }

  if (document.readyState === 'complete') {
    checkDejarHash();
  } else {
    window.addEventListener('load', checkDejarHash);
  }
}
