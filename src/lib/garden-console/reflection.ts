/**
 * garden-console/reflection.ts
 * reflect() and ecology() — visitor introspection and graph stats
 */

import { styles } from './surfaces';

function getTimeOfDay(hour: number): string {
  if (hour >= 6 && hour < 12) return 'in the morning';
  if (hour >= 12 && hour < 18) return 'in the afternoon';
  if (hour >= 18 && hour < 23) return 'in the evening';
  return 'in the night';
}

/**
 * reflect() — visitor introspection from localStorage
 */
export function reflect(): void {
  // Privacy disclaimer (always shown)
  console.log('%c🌿 garden.reflect()', styles.header);
  console.log('%c\ncome as you are.', styles.muted);
  console.log('%cthis garden keeps nothing that doesn\'t stay in your browser.', styles.muted);
  console.log('%cno cookies. localStorage only. a random ID counts visits — nothing more.', styles.muted);
  console.log('%cwhat you tend here stays here — or clears when you forget.', styles.muted);

  const raw = localStorage.getItem('jardin-visitor');
  if (!raw) {
    console.log('%c\nfresh arrival. the garden is still learning your shape.', styles.body);
    return;
  }

  try {
    const data = JSON.parse(raw);
    const now = new Date();

    // Calculate days tending
    const firstVisit = data.stats?.firstVisit ? new Date(data.stats.firstVisit) : now;
    const days = Math.floor((now.getTime() - firstVisit.getTime()) / (1000 * 60 * 60 * 24));
    const visits = data.visits || 1;

    // Visit frequency interpretation
    const avgDays = days / Math.max(visits - 1, 1);
    let frequencyNote: string;
    if (visits <= 1) frequencyNote = 'first day in the garden.';
    else if (avgDays < 2) frequencyNote = 'a regular presence — the ferns recognize you.';
    else if (avgDays < 5) frequencyNote = 'you return when something calls you.';
    else frequencyNote = 'sparse visits. the garden waits patiently.';

    // Time of day
    const hour = now.getHours();
    let timeNote: string;
    if (hour >= 6 && hour < 12) timeNote = '(the cool hours. good for tending.)';
    else if (hour >= 12 && hour < 18) timeNote = '(the alert hours. good for exploring.)';
    else if (hour >= 18 && hour < 23) timeNote = '(the contemplative hours. bateson would approve.)';
    else timeNote = '(the witching hours. strange things grow here.)';

    // Articles and secrets
    const articles = data.stats?.articlesRead || [];
    const secrets = data.stats?.secretsFound || [];
    const totalSecrets = 12;

    // Seed stage
    const seedStages = ['none planted', 'dormant', 'stirring', 'cracked', 'sprouting', 'reaching', 'leafing', 'blooming'];
    const seedStage = seedStages[Math.min(data.seedCount || 0, 7)];

    // Output narrative
    console.log('%c\nyou\'ve been tending for ' + days + ' day' + (days !== 1 ? 's' : '') +
                ', across ' + visits + ' visit' + (visits !== 1 ? 's' : '') + '.', styles.body);
    console.log('%c' + frequencyNote, styles.body);
    console.log('%c\nyou arrived ' + getTimeOfDay(hour) + '.', styles.body);
    console.log('%c' + timeNote, styles.muted);

    console.log('%c\narticles read: %c' + (articles.length || 'none yet'), styles.label, styles.body);
    console.log('%csecrets found: %c' + secrets.length + ' of ' + totalSecrets +
                (secrets.length < totalSecrets ? ' (the rest are patient)' : ''), styles.label, styles.body);
    console.log('%cseed stage: %c' + seedStage, styles.label, styles.body);

    // Pattern interpretation
    let pattern: string;
    if (visits <= 1) pattern = 'too early to tell. return. the garden is patient.';
    else if (articles.length >= 3 && secrets.length >= 5) pattern = 'a visitor who reads, explores, and tends. almost part of the garden by now.';
    else if (articles.length >= 2) pattern = 'a reader. the cuaderno appreciates your attention.';
    else if (secrets.length >= 3) pattern = 'an explorer. you look in the corners.';
    else pattern = 'still finding your path. that\'s fine. gardens aren\'t linear.';

    console.log('%c\nthe pattern: %c' + pattern, styles.label, styles.body);

  } catch {
    console.log('%c\ncorrupted data. the garden forgets.', styles.body);
  }
}

/**
 * ecology() — fetch and display mycelium graph stats
 */
export async function ecology(): Promise<void> {
  console.log('%c🌿 garden.ecology()', styles.header);
  console.log('%c\nfetching mycelium data...', styles.muted);

  try {
    const response = await fetch('/mycelium-data.json');
    if (!response.ok) throw new Error('unreachable');
    const graph = await response.json();

    // Last tended
    const generated = new Date(graph.generated);
    const genDate = generated.toLocaleDateString('en-CA'); // YYYY-MM-DD
    const genTime = generated.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    console.log('%c\nlast tended: %c' + genDate + ' at ' + genTime + ' UTC', styles.label, styles.body);
    console.log('%c(the gardener was here recently)', styles.muted);

    // Content counts
    const nodeCounts: Record<string, number> = { track: 0, article: 0, cultivation: 0, dispatch: 0, exit: 0 };
    for (const node of graph.nodes) {
      nodeCounts[node.type] = (nodeCounts[node.type] || 0) + 1;
    }

    console.log('%c\ncontent', styles.label);
    console.log('%c  articles:     ' + nodeCounts.article, styles.body);
    console.log('%c  tracks:       ' + nodeCounts.track, styles.body);
    console.log('%c  cultivations: ' + nodeCounts.cultivation, styles.body);
    console.log('%c  dispatches:   ' + nodeCounts.dispatch, styles.body);
    console.log('%c  exits:        ' + nodeCounts.exit, styles.body);

    // Mycelium density
    const density = (graph.edges.length / Math.max(graph.nodes.length, 1)).toFixed(2);
    let densityNote: string;
    if (parseFloat(density) < 1.5) densityNote = '(sparse. the mycelium is still spreading.)';
    else if (parseFloat(density) < 2.5) densityNote = '(well-connected. the roots know each other.)';
    else densityNote = '(densely woven. everything knows everything.)';

    console.log('%c\nmycelium density', styles.label);
    console.log('%c  nodes: ' + graph.nodes.length, styles.body);
    console.log('%c  edges: ' + graph.edges.length, styles.body);
    console.log('%c  ratio: ' + density + ' edges per node', styles.body);
    console.log('%c  ' + densityNote, styles.muted);

  } catch {
    console.log('%c\nthe mycelium is unreachable.', styles.body);
    console.log('%ctry again when the network clears.', styles.muted);
  }
}
