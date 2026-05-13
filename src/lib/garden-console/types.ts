/**
 * garden-console/types.ts
 * Type definitions for the garden console diagnostic tools
 */

export interface Surface {
  name: string;
  selector: string;
  type: 'interactive' | 'stateful' | 'potential' | 'structural';
  description: string;
}

export type PageContext = 'garden' | 'article' | 'micelio' | 'unknown';

export interface ConsoleStyles {
  header: string;
  body: string;
  muted: string;
  label: string;
  title: string;
  link: string;
  warning: string;
}

declare global {
  interface Window {
    garden: {
      surfaces: () => void;
      reflect: () => void;
      ecology: () => Promise<void>;
      xray: (enabled?: boolean) => void;
      explore: () => void;
      tend: (password: string, deviceName?: string) => Promise<void>;
      untend: () => void;
      amnesty: (recoveryPhrase: string) => Promise<void>;
    };
  }
}
