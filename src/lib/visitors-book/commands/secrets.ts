/**
 * Secret commands: bateson, seed, water, ls, cd, pwd, hola, hello, micelio, roots, jardin
 */

import type { CommandHandler } from '../types';
import { secretDescriptions, TOTAL_SECRETS } from '../secrets';
import { bonjourCommand } from './bonjour';

function proseRedirect(ctx: { showOutput: (html: string) => void }): void {
  ctx.showOutput('<p class="output-line output-muted">parece una nota — prueba <span class="output-mono">dejar</span></p>');
}

export const secretsCommands: Record<string, CommandHandler> = {
  bateson(_args, ctx) {
    const quote = ctx.batesonQuotes[Math.floor(Math.random() * ctx.batesonQuotes.length)];
    ctx.showOutput(`<p class="output-line output-quote">"${quote}"</p>`);
  },

  regar(_args, ctx) {
    secretsCommands.water('', ctx);
  },

  water(_args, ctx) {
    const state = ctx.getVisitorState();
    state.waterings++;
    ctx.saveVisitorState(state);

    const responses = [
      'the garden appreciates it.',
      'water finds its way.',
      'something stirs.',
      'roots remember.',
    ];
    const response = state.waterings === 1
      ? responses[0]
      : responses[Math.floor(Math.random() * responses.length)];

    ctx.showOutput(`
      <p class="output-line output-fern">${response}</p>
      <p class="output-line output-muted">waterings: ${state.waterings}</p>
    `);
  },

  semilla(_args, ctx) {
    secretsCommands.seed('', ctx);
  },

  seed(_args, ctx) {
    const state = ctx.getVisitorState();

    if (!state.seedPlanted) {
      state.seedPlanted = true;
      state.seedCount = 1;
      ctx.saveVisitorState(state);
      ctx.showOutput('<p class="output-line output-ochre">a seed is planted. return to tend it.</p>');
      return;
    }

    state.seedCount++;
    ctx.saveVisitorState(state);

    const stages = [
      'the seed waits.',
      'something stirs beneath.',
      'a crack in the shell.',
      'a pale tendril.',
      'reaching toward light.',
      'the first leaf unfurls.',
      'patience.',
    ];

    if (state.seedCount >= 7) {
      ctx.showOutput(`
        <p class="output-line output-fern">the seed has sprouted.</p>
        <p class="output-line output-quote">"the pattern which connects."</p>
        <p class="output-line output-sun">— you found it.</p>
        <p class="output-line output-muted">roots have spread into something deeper. the micelio.</p>
      `);
    } else {
      const stage = stages[Math.min(state.seedCount - 1, stages.length - 1)];
      ctx.showOutput(`<p class="output-line output-muted">${stage}</p>`);
    }
  },

  ls(_args, ctx) {
    ctx.showOutput(`
      <p class="output-line output-mono"><a href="/#conservatory">conservatory/</a>&nbsp;&nbsp;<a href="/#journal">cuaderno/</a>&nbsp;&nbsp;<a href="/#cultivations">cultivations/</a>&nbsp;&nbsp;<a href="/#library">library/</a></p>
    `);
  },

  pwd(_args, ctx) {
    ctx.showOutput('<p class="output-line output-mono">you are in: el jardín</p>');
  },

  hola(args, ctx) {
    if (args.trim() !== '') {
      proseRedirect(ctx);
      return;
    }

    const LONG_TIME_THRESHOLD = 7;
    const state = ctx.getVisitorState();
    const visits = state.visits;

    const firstVisit = ['hola, te veo.', 'bienvenidx al jardín.'];
    const returning = ['de nuevo. la maceta te reconoce.', 'otra vez por aquí.', 'bienvenidx de vuelta.'];
    const longtime = ['otra vez. ya sabes el camino.', 'casi parte del jardín ya.'];

    let pool: string[];
    if (visits <= 1) {
      pool = firstVisit;
    } else if (visits < LONG_TIME_THRESHOLD) {
      pool = returning;
    } else {
      pool = longtime;
    }

    const response = pool[Math.floor(Math.random() * pool.length)];
    ctx.showOutput(`<p class="output-line output-fern">${response}</p>`);
  },

  hello(args, ctx) {
    if (args.trim() !== '') {
      proseRedirect(ctx);
      return;
    }

    const LONG_TIME_THRESHOLD = 7;
    const state = ctx.getVisitorState();
    const visits = state.visits;

    const firstVisit = ['hello there. mind the ferns.', 'welcome. quietly.'];
    const returning = ['back again. the ferns noticed.', 'you again. good.'];
    const longtime = ['familiar steps.', 'part of the garden by now.'];

    let pool: string[];
    if (visits <= 1) {
      pool = firstVisit;
    } else if (visits < LONG_TIME_THRESHOLD) {
      pool = returning;
    } else {
      pool = longtime;
    }

    const response = pool[Math.floor(Math.random() * pool.length)];
    ctx.showOutput(`<p class="output-line output-fern">${response}</p>`);
  },

  bonjour: bonjourCommand,

  garden(_args, ctx) {
    secretsCommands.jardin('', ctx);
  },

  jardin(_args, ctx) {
    const state = ctx.getVisitorState();
    const isFirstTime = !state.stats.secretsFound.includes('jardin');

    if (isFirstTime) {
      state.stats.secretsFound.push('jardin');
      ctx.saveVisitorState(state);
    }

    const firstVisit = new Date(state.stats.firstVisit);
    const now = new Date();
    const daysTending = Math.floor((now.getTime() - firstVisit.getTime()) / (1000 * 60 * 60 * 24));
    const seedStages = ['dormant', 'stirring', 'cracked', 'sprouting', 'reaching', 'leafing', 'blooming'];
    const seedStage = state.seedPlanted
      ? seedStages[Math.min(state.seedCount, seedStages.length - 1)]
      : 'none planted';

    const foundSecrets = state.stats.secretsFound;
    let html = `<p class="output-line output-fern">the garden's ledger</p>`;
    html += `<p class="output-line">visits: ${state.visits} · days tending: ${daysTending}</p>`;
    html += `<p class="output-line">waterings: ${state.waterings} · seed: ${seedStage}</p>`;
    if (state.stats.articlesRead.length > 0) {
      html += `<p class="output-line">articles read: ${state.stats.articlesRead.length}</p>`;
    }

    html += `<p class="output-line" style="margin-top: 8px;">secrets found: ${foundSecrets.length}/${TOTAL_SECRETS}</p>`;

    if (foundSecrets.length === 0) {
      html += `<p class="output-line output-muted">none yet. keep looking.</p>`;
    } else {
      foundSecrets.forEach(secret => {
        const desc = secretDescriptions[secret] || '';
        html += `<p class="output-line"><span class="output-mono">${secret}</span> — <span class="output-muted">${desc}</span></p>`;
      });

      const remaining = TOTAL_SECRETS - foundSecrets.length;
      if (remaining > 0) {
        html += `<p class="output-line output-muted" style="margin-top: 8px;">${remaining} more hidden.</p>`;
      } else {
        html += `<p class="output-line output-sun" style="margin-top: 8px;">the garden has no more secrets from you.</p>`;
      }
    }

    if (isFirstTime) {
      ctx.showJardinModal(() => ctx.showOutput(html));
    } else {
      ctx.showOutput(html);
    }
  },

  micelio(_args, ctx) {
    const state = ctx.getVisitorState();
    const isFirstTime = !state.stats.secretsFound.includes('micelio');
    if (isFirstTime) {
      state.stats.secretsFound.push('micelio');
      ctx.saveVisitorState(state);
      ctx.showOutput('<p class="output-line output-fern">you found the meta-map — the map of the map.</p>');
      setTimeout(() => {
        window.location.href = '/micelio';
      }, 1200);
    } else {
      window.location.href = '/micelio';
    }
  },

  mycelium(_args, ctx) {
    secretsCommands.micelio('', ctx);
  },

  roots(_args, ctx) {
    const state = ctx.getVisitorState();
    const isFirstTime = !state.stats.secretsFound.includes('roots');

    if (isFirstTime) {
      state.stats.secretsFound.push('roots');
      ctx.saveVisitorState(state);

      ctx.showOutput(`
        <p class="output-line output-ochre">you found the root system.</p>
        <p class="output-line output-muted">beneath the garden, diagnostic tools sleep.</p>
        <p class="output-line output-muted">open your browser's console. try <span class="output-mono">garden.reflect()</span></p>
      `);
    } else {
      ctx.showOutput(`
        <p class="output-line output-muted">you already know where the roots are.</p>
        <p class="output-line output-muted">console → <span class="output-mono">garden.reflect()</span> or <span class="output-mono">garden.ecology()</span></p>
      `);
    }
  },

  cd(args, ctx) {
    if (args === '..' || args === '../') {
      ctx.showOutput('<p class="output-line output-muted">there is no outside.</p>');
      return;
    }

    const sections: Record<string, string> = {
      conservatory: '/#conservatory',
      invernadero: '/#conservatory',
      cuaderno: '/#journal',
      journal: '/#journal',
      cultivations: '/#cultivations',
      cultivos: '/#cultivations',
      library: '/#library',
      biblioteca: '/#library',
      now: '/#now',
      ahora: '/#now',
      visitors: '/#visitors',
      visitas: '/#visitors',
      micelio: '/micelio',
      mycelium: '/micelio',
    };

    const target = args.replace(/\/$/, '').toLowerCase();
    if (sections[target]) {
      window.location.href = sections[target];
    } else if (target === '' || target === '~' || target === 'home') {
      window.location.href = '/';
    } else {
      ctx.showOutput(`<p class="output-line output-muted">cd: ${args}: not a garden path</p>`);
    }
  },
};
