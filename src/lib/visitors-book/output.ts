/**
 * Output rendering and modal management
 */

export interface OutputDOMRefs {
  output: HTMLDivElement;
  input: HTMLInputElement;
  jardinModal: HTMLDivElement;
  jardinDismissBtn: HTMLButtonElement;
}

export interface OutputCallbacks {
  updateCursorPosition: () => void;
  updateGhostVisibility: () => void;
  startTypingAnimation: () => void;
  prefersReducedMotion: boolean;
}

/**
 * Create output management functions bound to DOM refs
 */
export function createOutputManager(refs: OutputDOMRefs, callbacks: OutputCallbacks) {
  let jardinModalCallback: (() => void) | null = null;

  function showOutput(html: string): void {
    refs.output.innerHTML = html + `
      <div class="dismiss-row">
        <button class="dismiss-btn" type="button">dismiss</button>
      </div>
    `;
    refs.output.classList.add('expanded');

    // Wire up dismiss button
    const dismissBtn = refs.output.querySelector('.dismiss-btn');
    dismissBtn?.addEventListener('click', dismissOutput);

    // Wire up season headers for click-to-expand
    refs.output.querySelectorAll('.season-header').forEach(header => {
      header.addEventListener('click', () => {
        const isExpanded = header.classList.toggle('expanded');
        const chevron = header.querySelector('.season-chevron');
        if (chevron) {
          chevron.textContent = isExpanded ? 'v' : '>';
        }
        header.setAttribute('aria-expanded', String(isExpanded));
        const items = header.nextElementSibling as HTMLElement;
        if (items) {
          items.style.display = isExpanded ? 'block' : '';
        }
      });
    });
  }

  function dismissOutput(): void {
    refs.output.classList.remove('expanded');
    refs.output.innerHTML = '';
    refs.input.value = '';
    refs.input.focus();
    callbacks.updateCursorPosition();
    callbacks.updateGhostVisibility();
    if (!callbacks.prefersReducedMotion) {
      callbacks.startTypingAnimation();
    }
  }

  function showJardinModal(onDismiss: () => void): void {
    jardinModalCallback = onDismiss;
    refs.jardinModal?.setAttribute('aria-hidden', 'false');
    refs.jardinDismissBtn?.focus();
  }

  function dismissJardinModal(): void {
    refs.jardinModal?.setAttribute('aria-hidden', 'true');
    if (jardinModalCallback) {
      jardinModalCallback();
      jardinModalCallback = null;
    }
    refs.input?.focus();
  }

  // Set up modal event listeners
  refs.jardinDismissBtn?.addEventListener('click', dismissJardinModal);
  refs.jardinModal?.addEventListener('click', (e) => {
    if (e.target === refs.jardinModal) dismissJardinModal();
  });

  return {
    showOutput,
    dismissOutput,
    showJardinModal,
    dismissJardinModal,
  };
}
