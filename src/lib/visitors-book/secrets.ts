/**
 * Secret commands registry and descriptions
 */

// Commands that count as "secrets" for discovery tracking
// Maps command -> canonical secret name (aliases map to same secret)
export const secretCommands: Record<string, string> = {
  bateson: 'bateson',
  seed: 'seed',
  semilla: 'seed', // alias
  water: 'water',
  regar: 'water', // alias
  ls: 'ls',
  cd: 'cd',
  pwd: 'pwd',
  bonjour: 'bonjour',
  hola: 'hola',
  hello: 'hello',
  micelio: 'micelio', // network portal
  mycelium: 'micelio', // English alias
  jardin: 'jardin', // meta-secret
  garden: 'jardin', // English alias
  roots: 'roots', // devtools hint
};

// Human-readable descriptions for the jardin ledger
export const secretDescriptions: Record<string, string> = {
  bateson: '"the pattern which connects"',
  seed: 'a thing that grows if tended',
  water: 'roots remember',
  ls: 'the paths are real',
  cd: 'navigation by name',
  pwd: 'you are here',
  hola: 'la maceta recognizes returning guests',
  hello: 'mind the ferns',
  bonjour: 'weather from montréal, and a poem',
  micelio: 'the meta-map — a map of the map',
  jardin: 'the secret that reveals secrets',
  roots: 'below the surface, diagnostic tools wait',
};

// Total unique secrets (for progress display)
export const TOTAL_SECRETS = new Set(Object.values(secretCommands)).size;
