export async function hashString(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export function generateUlid(): string {
  // Simplified ULID: timestamp + random
  const timestamp = Date.now().toString(36).padStart(10, '0');
  const random = Array.from(crypto.getRandomValues(new Uint8Array(10)))
    .map(b => b.toString(36))
    .join('')
    .slice(0, 16);
  return `${timestamp}${random}`.toUpperCase();
}
