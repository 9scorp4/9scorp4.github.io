/**
 * Prose detection and HTML escaping utilities
 */

/**
 * Detect whether input looks like conversational prose vs. a command.
 * Used to redirect casual messages to the `dejar` command.
 */
export function looksLikeProse(input: string): boolean {
  const trimmed = input.trim();
  if (!trimmed) return false;

  const lower = trimmed.toLowerCase();
  const tokens = trimmed.split(/\s+/);

  // Contains ? anywhere
  if (trimmed.includes('?')) return true;

  // Contains . or ! in non-final position
  const midPunctuation = /[.!](?!$)/;
  if (midPunctuation.test(trimmed)) return true;

  // Contains comma (casual speech: "cool page, bro")
  if (trimmed.includes(',')) return true;

  // More than 4 whitespace-separated tokens
  if (tokens.length > 4) return true;

  // First token is a greeting (excludes hola/hello/bonjour which are commands)
  const greetings = ['hi', 'hey', 'salut', 'yo', 'ey'];
  const firstToken = tokens[0].toLowerCase().replace(/[!,]$/, '');
  if (greetings.includes(firstToken)) return true;

  // Contains evaluative/complimentary words
  const evaluative = [
    'cool', 'nice', 'great', 'awesome', 'good', 'bad', 'love', 'like',
    'beautiful', 'amazing', 'genial', 'bueno', 'bonito', 'increíble',
    'thanks', 'gracias', 'merci', 'cheers',
  ];
  if (evaluative.some(word => lower.includes(word))) return true;

  // Contains informal address
  const addresses = ['bro', 'dude', 'man', 'mate', 'amigo', 'tío', 'compa'];
  if (addresses.some(addr => lower.includes(addr))) return true;

  // Multiple tokens without = suggests prose, not command args
  if (tokens.length >= 3 && !trimmed.includes('=')) return true;

  return false;
}

/**
 * Escape HTML for safe display in output
 */
export function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
