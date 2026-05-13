/**
 * garden-console/auth.ts
 * Developer authentication and marking logic
 */

// Hash for dev password verification (not the password itself)
export const DEV_HASH = '7bdcba3cdc9ae3b270bc11d6f5a74b815c1decdea373e167de77bbfdd6c481d7';
export const AMNESTY_HASH = '1203c4451e85e6b1f3e4ae3de8bbc35d205852518713e04ec41685d0af1f99c8';
export const MAX_FAILED_ATTEMPTS = 3;

// localStorage keys
export const BAN_KEY = 'jardin-dev-banned';
export const ATTEMPTS_KEY = 'jardin-dev-attempts';
export const DEV_ID_KEY = 'jardin-dev-id';
export const DEV_KEY = 'jardin-dev';

/**
 * SHA-256 hash using Web Crypto API
 */
export async function sha256(message: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

export interface TendResult {
  success: boolean;
  banned?: boolean;
  attemptsRemaining?: number;
  deviceId?: string;
}

/**
 * Attempt to authenticate as a developer
 */
export async function tend(password: string, deviceName?: string): Promise<TendResult> {
  try {
    // Check if banned
    if (localStorage.getItem(BAN_KEY) === '1') {
      return { success: false, banned: true };
    }

    // Hash the input and compare
    const inputHash = await sha256(password || '');
    if (inputHash !== DEV_HASH) {
      // Track failed attempt
      const attempts = Number(localStorage.getItem(ATTEMPTS_KEY) || 0) + 1;
      localStorage.setItem(ATTEMPTS_KEY, String(attempts));

      if (attempts >= MAX_FAILED_ATTEMPTS) {
        localStorage.setItem(BAN_KEY, '1');
        return { success: false, banned: true, attemptsRemaining: 0 };
      }

      return { success: false, attemptsRemaining: MAX_FAILED_ATTEMPTS - attempts };
    }

    // Success - clear failed attempts and set dev mode
    localStorage.removeItem(ATTEMPTS_KEY);
    localStorage.setItem(DEV_KEY, '1');

    // Set device name
    const devId = deviceName || 'unnamed';
    localStorage.setItem(DEV_ID_KEY, devId);

    return { success: true, deviceId: devId };
  } catch {
    return { success: false };
  }
}

/**
 * Remove developer marking
 */
export function untend(): void {
  try {
    localStorage.removeItem(DEV_KEY);
    localStorage.removeItem(DEV_ID_KEY);
  } catch {
    // localStorage unavailable
  }
}

/**
 * Attempt amnesty for banned browsers
 */
export async function amnesty(recoveryPhrase: string): Promise<boolean> {
  try {
    const inputHash = await sha256(recoveryPhrase || '');
    if (inputHash === AMNESTY_HASH) {
      localStorage.removeItem(BAN_KEY);
      localStorage.removeItem(ATTEMPTS_KEY);
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

/**
 * Handle ?tend=... URL parameter for mobile-friendly dev marking
 * Usage: ?tend=password&device=name to mark, ?tend=off to unmark
 */
export async function handleTendParam(): Promise<void> {
  const params = new URLSearchParams(location.search);
  const tendParam = params.get('tend');
  const deviceParam = params.get('device');

  const cleanUrl = () => {
    const clean = location.pathname + location.hash;
    history.replaceState(null, '', clean);
  };

  if (!tendParam) return;

  // Handle ?tend=off to unmark
  if (tendParam === 'off') {
    untend();
    cleanUrl();
    return;
  }

  // Check if banned
  try {
    if (localStorage.getItem(BAN_KEY) === '1') {
      cleanUrl();
      return;
    }
  } catch {
    // localStorage unavailable
  }

  // Hash and compare
  const inputHash = await sha256(tendParam);
  if (inputHash === DEV_HASH) {
    try {
      localStorage.removeItem(ATTEMPTS_KEY);
      localStorage.setItem(DEV_KEY, '1');
      localStorage.setItem(DEV_ID_KEY, deviceParam || 'mobile-unnamed');
    } catch {
      // localStorage unavailable
    }
    cleanUrl();
  } else {
    // Track failed attempt
    try {
      const attempts = Number(localStorage.getItem(ATTEMPTS_KEY) || 0) + 1;
      localStorage.setItem(ATTEMPTS_KEY, String(attempts));
      if (attempts >= MAX_FAILED_ATTEMPTS) {
        localStorage.setItem(BAN_KEY, '1');
      }
    } catch {
      // localStorage unavailable
    }
    cleanUrl();
  }
}
