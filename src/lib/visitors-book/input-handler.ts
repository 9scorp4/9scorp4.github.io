/**
 * Input handling for the VisitorsBook console.
 * Manages cursor position, input events, and focus behavior.
 */

export interface InputRefs {
  input: HTMLInputElement;
  cursor: HTMLSpanElement;
  textMeasurer: HTMLSpanElement;
  ghostText: HTMLSpanElement;
  visitorsBook: HTMLElement;
  output: HTMLDivElement;
}

export interface InputCallbacks {
  executeCommand: (rawInput: string) => void;
  dismissOutput: () => void;
  updateGhostVisibility: () => void;
  startTypingAnimation: () => void;
  stopTypingAnimation: () => void;
  prefersReducedMotion: boolean;
}

/** Create cursor position manager */
export function createCursorManager(refs: Pick<InputRefs, 'input' | 'cursor' | 'textMeasurer'>) {
  const { input, cursor, textMeasurer } = refs;

  function updateCursorPosition(): void {
    if (!input || !cursor || !textMeasurer) return;
    const textBeforeCursor = input.value.substring(0, input.selectionStart ?? input.value.length);
    textMeasurer.textContent = textBeforeCursor || '';
    const width = textMeasurer.offsetWidth;
    cursor.style.left = `${width}px`;
  }

  return { updateCursorPosition };
}

/** Bind all input-related event handlers */
export function bindInputHandlers(
  refs: InputRefs,
  callbacks: InputCallbacks
): () => void {
  const { input, visitorsBook, output } = refs;
  const {
    executeCommand,
    dismissOutput,
    updateGhostVisibility,
    startTypingAnimation,
    stopTypingAnimation,
    prefersReducedMotion,
  } = callbacks;

  const cursorManager = createCursorManager(refs);
  const { updateCursorPosition } = cursorManager;

  // Cursor position listeners
  const handleInput = () => {
    updateCursorPosition();
    updateGhostVisibility();
    if (input.value) {
      stopTypingAnimation();
    } else if (!prefersReducedMotion) {
      startTypingAnimation();
    }
  };

  const handleKeyup = updateCursorPosition;
  const handleClick = updateCursorPosition;
  const handleFocus = updateCursorPosition;

  const handleKeydown = (e: KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      executeCommand(input.value);
    } else if (e.key === 'Escape') {
      dismissOutput();
    }
  };

  // Click to focus
  const handleBookClick = (e: MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.tagName === 'BUTTON' || target.tagName === 'A' || target.closest('.season-header')) {
      return;
    }
    input?.focus();
  };

  // Keyboard accessibility for season headers
  const handleOutputKeydown = (e: KeyboardEvent) => {
    const target = e.target as HTMLElement;
    if (target.classList.contains('season-header') && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      target.click();
    }
  };

  // Attach listeners
  input?.addEventListener('input', handleInput);
  input?.addEventListener('keyup', handleKeyup);
  input?.addEventListener('click', handleClick);
  input?.addEventListener('focus', handleFocus);
  input?.addEventListener('keydown', handleKeydown);
  visitorsBook?.addEventListener('click', handleBookClick);
  output?.addEventListener('keydown', handleOutputKeydown);

  // Initial cursor position
  updateCursorPosition();

  // Return cleanup function
  return () => {
    input?.removeEventListener('input', handleInput);
    input?.removeEventListener('keyup', handleKeyup);
    input?.removeEventListener('click', handleClick);
    input?.removeEventListener('focus', handleFocus);
    input?.removeEventListener('keydown', handleKeydown);
    visitorsBook?.removeEventListener('click', handleBookClick);
    output?.removeEventListener('keydown', handleOutputKeydown);
  };
}
