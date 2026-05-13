/**
 * Ghost text typing animation factory
 */

const EXAMPLE_COMMANDS = [
  'random',
  'about',
  'seasons',
  'dejar nombre="Ana" mensaje="hola"',
  'garden',
];

export interface TypingAnimation {
  start: () => void;
  stop: () => void;
  updateVisibility: (hasInput: boolean) => void;
}

/**
 * Create a typing animation controller for the ghost text
 */
export function createTypingAnimation(
  ghostText: HTMLSpanElement | null,
  prefersReducedMotion: boolean
): TypingAnimation {
  let currentCommandIndex = 0;
  let currentCharIndex = 0;
  let typingTimeout: ReturnType<typeof setTimeout> | null = null;
  let pauseTimeout: ReturnType<typeof setTimeout> | null = null;

  function updateVisibility(hasInput: boolean): void {
    if (!ghostText) return;
    if (hasInput) {
      ghostText.classList.add('hidden');
    } else {
      ghostText.classList.remove('hidden');
    }
  }

  function typeNextChar(): void {
    if (!ghostText || prefersReducedMotion) return;

    const currentCommand = EXAMPLE_COMMANDS[currentCommandIndex];

    if (currentCharIndex < currentCommand.length) {
      ghostText.textContent = currentCommand.slice(0, currentCharIndex + 1);
      currentCharIndex++;
      // Variable delay: slightly slower for punctuation
      const char = currentCommand[currentCharIndex - 1];
      const delay = /[=""]/.test(char) ? 120 : (50 + Math.random() * 50);
      typingTimeout = setTimeout(typeNextChar, delay);
    } else {
      // Command complete, pause before clearing
      const pauseDuration = currentCommandIndex === EXAMPLE_COMMANDS.length - 1 ? 3000 : 2000;
      pauseTimeout = setTimeout(() => {
        currentCommandIndex = (currentCommandIndex + 1) % EXAMPLE_COMMANDS.length;
        currentCharIndex = 0;
        ghostText.textContent = '';
        typingTimeout = setTimeout(typeNextChar, 500);
      }, pauseDuration);
    }
  }

  function start(): void {
    if (!ghostText) return;

    if (prefersReducedMotion) {
      // Static fallback for reduced motion
      ghostText.textContent = 'try: random';
      return;
    }

    // Start typing the first command
    currentCommandIndex = 0;
    currentCharIndex = 0;
    ghostText.textContent = '';
    typeNextChar();
  }

  function stop(): void {
    if (typingTimeout) {
      clearTimeout(typingTimeout);
      typingTimeout = null;
    }
    if (pauseTimeout) {
      clearTimeout(pauseTimeout);
      pauseTimeout = null;
    }
  }

  return {
    start,
    stop,
    updateVisibility,
  };
}
