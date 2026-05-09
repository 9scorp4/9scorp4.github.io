/**
 * Bonjour poem management commands
 */

import { title, print, success, muted, blank, error, divider } from '../../lib/cli-style.ts';

const WORKER_URL = process.env.PUBLIC_VISITORS_WORKER_URL;
const ADMIN_TOKEN = process.env.VISITORS_ADMIN_TOKEN;

function checkEnvVars(): void {
  if (!WORKER_URL || !ADMIN_TOKEN) {
    error('Missing environment variables.');
    console.log('  Set PUBLIC_VISITORS_WORKER_URL and VISITORS_ADMIN_TOKEN in .env');
    process.exit(1);
  }
}

async function fetchApi(
  path: string,
  method: 'GET' | 'POST' | 'DELETE' = 'GET'
): Promise<unknown> {
  checkEnvVars();

  const response = await fetch(`${WORKER_URL}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${ADMIN_TOKEN}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`API error ${response.status}: ${text}`);
  }

  return response.json();
}

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

interface InterpolationContext {
  object: string;
  subject: string;
  event: string;
  metric: string;
  cadence: string;
  minimalPair1: [string, string];
  minimalPair2: [string, string];
}

interface BonjourPoem {
  date: string;
  text: string;
  promptVersion?: string;
  context?: InterpolationContext;
  generatedAt?: string;
}

interface FavoritePoem {
  id: string;
  date: string;
  text: string;
  addedAt: string;
}

interface PromptInfo {
  version: string;
  description: string;
  template: string;
  dictionaries: {
    objects: number;
    subjects: number;
    events: number;
    metrics: number;
    cadences: number;
    minimal_pairs: number;
  };
  model: {
    name: string;
    temperature: number;
    maxTokens: number;
  };
}

interface PromptTestResult {
  version: string;
  prompt: string;
  context: InterpolationContext;
}

interface PromptHistory {
  currentVersion: string;
  history: {
    version: string;
    count: number;
    dates: string[];
  }[];
}

// ─────────────────────────────────────────────────────────────
// Commands
// ─────────────────────────────────────────────────────────────

export async function bonjourGenerate(): Promise<void> {
  title('generate poem');

  try {
    const data = (await fetchApi('/admin/bonjour/generate', 'POST')) as {
      ok: boolean;
      poem: string;
      promptVersion: string;
      context: InterpolationContext;
    };

    if (data.ok) {
      success('Generated today\'s poem:');
      blank();
      for (const line of data.poem.split('\n')) {
        print(line);
      }
      blank();
      muted(`Prompt version: ${data.promptVersion}`);
      muted(`Context: ${data.context.object} / ${data.context.subject} / ${data.context.event}`);
      blank();
    }
  } catch (err) {
    error((err as Error).message);
    process.exit(1);
  }
}

export async function bonjourList(days: number): Promise<void> {
  title(`poems from last ${days} days`);

  try {
    const data = (await fetchApi(`/admin/bonjour/list?days=${days}`)) as { poems: BonjourPoem[] };

    if (data.poems.length === 0) {
      muted(`No poems found in the last ${days} days.`);
      blank();
      return;
    }

    print(`${data.poems.length} poem(s):`);
    blank();

    for (const poem of data.poems) {
      print(poem.date);
      divider(40);
      for (const line of poem.text.split('\n')) {
        muted(line);
      }
      blank();
    }
  } catch (err) {
    error((err as Error).message);
    process.exit(1);
  }
}

export async function bonjourShow(date: string): Promise<void> {
  title(`poem for ${date}`);

  try {
    const data = (await fetchApi(`/admin/bonjour/show/${date}`)) as BonjourPoem;

    blank();
    for (const line of data.text.split('\n')) {
      print(line);
    }
    blank();

    if (data.promptVersion) {
      muted(`Prompt version: ${data.promptVersion}`);
      if (data.context) {
        muted(`Context: ${data.context.object} / ${data.context.subject} / ${data.context.event}`);
      }
      blank();
    }
  } catch (err) {
    error((err as Error).message);
    process.exit(1);
  }
}

export async function bonjourFavorite(date: string): Promise<void> {
  try {
    const data = (await fetchApi(`/admin/bonjour/favorite/${date}`, 'POST')) as { ok: boolean; id: string };

    if (data.ok) {
      success(`Added to favorites: ${data.id}`);
      blank();
    }
  } catch (err) {
    error((err as Error).message);
    process.exit(1);
  }
}

export async function bonjourPrune(date: string): Promise<void> {
  checkEnvVars();

  try {
    const response = await fetch(`${WORKER_URL}/admin/bonjour/prune/${date}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${ADMIN_TOKEN}`,
      },
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`API error ${response.status}: ${text}`);
    }

    success(`Pruned poem for ${date}`);
    blank();
  } catch (err) {
    error((err as Error).message);
    process.exit(1);
  }
}

export async function bonjourFavoritesList(): Promise<void> {
  title('favorite poems');

  try {
    const data = (await fetchApi('/admin/bonjour/favorites')) as { favorites: FavoritePoem[] };

    if (data.favorites.length === 0) {
      muted('No favorites yet.');
      blank();
      return;
    }

    print(`${data.favorites.length} favorite(s):`);
    blank();

    for (const fav of data.favorites) {
      print(`${fav.id} (from ${fav.date})`);
      divider(40);
      for (const line of fav.text.split('\n')) {
        muted(line);
      }
      blank();
    }
  } catch (err) {
    error((err as Error).message);
    process.exit(1);
  }
}

export async function bonjourFavoritesRemove(id: string): Promise<void> {
  checkEnvVars();

  try {
    const response = await fetch(`${WORKER_URL}/admin/bonjour/favorites/${id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${ADMIN_TOKEN}`,
      },
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`API error ${response.status}: ${text}`);
    }

    success(`Removed favorite: ${id}`);
    blank();
  } catch (err) {
    error((err as Error).message);
    process.exit(1);
  }
}

export async function bonjourPromptInfo(): Promise<void> {
  title('prompt configuration');

  try {
    const data = (await fetchApi('/admin/bonjour/prompt')) as PromptInfo;

    divider();
    print(`Version: ${data.version}`);
    print(`Description: ${data.description}`);
    blank();
    print('Template (first 200 chars):');
    muted(`  ${data.template.slice(0, 200)}...`);
    blank();
    print('Dictionaries:');
    muted(`  objects: ${data.dictionaries.objects} items`);
    muted(`  subjects: ${data.dictionaries.subjects} items`);
    muted(`  events: ${data.dictionaries.events} items`);
    muted(`  metrics: ${data.dictionaries.metrics} items`);
    muted(`  cadences: ${data.dictionaries.cadences} items`);
    muted(`  minimal_pairs: ${data.dictionaries.minimal_pairs} items`);
    blank();
    print('Model:');
    muted(`  name: ${data.model.name}`);
    muted(`  temperature: ${data.model.temperature}`);
    muted(`  maxTokens: ${data.model.maxTokens}`);
    blank();
  } catch (err) {
    error((err as Error).message);
    process.exit(1);
  }
}

export async function bonjourPromptTest(): Promise<void> {
  title('interpolated prompt test');

  try {
    const data = (await fetchApi('/admin/bonjour/prompt/test', 'POST')) as PromptTestResult;

    divider();
    print(`Version: ${data.version}`);
    blank();
    print('Context:');
    muted(`  object: ${data.context.object}`);
    muted(`  subject: ${data.context.subject}`);
    muted(`  event: ${data.context.event}`);
    muted(`  metric: ${data.context.metric}`);
    muted(`  cadence: ${data.context.cadence}`);
    muted(`  minimal pairs: ${data.context.minimalPair1.join('/')} and ${data.context.minimalPair2.join('/')}`);
    blank();
    print('Interpolated prompt:');
    divider();
    console.log(data.prompt);
    divider();
    blank();
  } catch (err) {
    error((err as Error).message);
    process.exit(1);
  }
}

export async function bonjourPromptHistory(days: number): Promise<void> {
  title('prompt version history');

  try {
    const data = (await fetchApi(`/admin/bonjour/prompt/history?days=${days}`)) as PromptHistory;

    divider();
    print(`Current version: ${data.currentVersion}`);
    print(`Looking back: ${days} days`);
    blank();

    if (data.history.length === 0) {
      muted('No poems found.');
      blank();
      return;
    }

    for (const entry of data.history) {
      print(`${entry.version}: ${entry.count} poem(s)`);
      for (const date of entry.dates) {
        muted(`  - ${date}`);
      }
      blank();
    }
  } catch (err) {
    error((err as Error).message);
    process.exit(1);
  }
}
