/**
 * Navigation commands: random, about, seasons, find, help
 */

import type { CommandHandler } from '../types';
import { getSeason } from '../season';

export const navigationCommands: Record<string, CommandHandler> = {
  random(_args, ctx) {
    const items: { url: string; label: string; date: string }[] = [];

    ctx.contentData.specimens.forEach(s => {
      items.push({
        url: '/#conservatory',
        label: `specimen: ${s.name}`,
        date: s.grown,
      });
    });

    ctx.contentData.journal.forEach(e => {
      items.push({
        url: `/cuaderno/${e.slug}`,
        label: `journal: ${e.title}`,
        date: e.date,
      });
    });

    ctx.contentData.cultivations.forEach(c => {
      items.push({
        url: '/#cultivations',
        label: `cultivation: ${c.name}`,
        date: new Date().toISOString(),
      });
    });

    if (items.length === 0) {
      ctx.showOutput('<p class="output-line output-muted">the garden is empty. spring is later than usual.</p>');
      return;
    }

    // Weight toward recent items
    items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const weightedIndex = Math.floor(Math.random() * Math.random() * items.length);
    const chosen = items[weightedIndex];

    ctx.showOutput(`
      <p class="output-line">→ <a href="${chosen.url}">${chosen.label}</a></p>
    `);
  },

  about(args, ctx) {
    if (args === '--garden' || args === 'garden') {
      ctx.showOutput(`
        <p class="output-line output-fern">un jardín cibernético</p>
        <p class="output-line">a place where feedback loops are tended, not optimized.</p>
        <p class="output-line">where the map and the territory argue productively.</p>
      `);
    } else {
      ctx.showOutput(`
        <p class="output-line">nico. systems, interfaces, the gap between.</p>
        <p class="output-line output-muted">based: montréal. from: bogotá.</p>
        <p class="output-line output-muted">try: about --garden</p>
      `);
    }
  },

  qué(_args, ctx) {
    navigationCommands.about('--garden', ctx);
  },

  seasons(args, ctx) {
    type SeasonKey = 'primavera' | 'verano' | 'otoño' | 'invierno';
    const seasonOrder: SeasonKey[] = ['primavera', 'verano', 'otoño', 'invierno'];

    interface SeasonItem {
      label: string;
      url: string;
      date: string;
      type: 'cuaderno' | 'specimen';
    }

    const seasons: Record<SeasonKey, SeasonItem[]> = {
      primavera: [],
      verano: [],
      otoño: [],
      invierno: [],
    };

    ctx.contentData.journal.forEach(e => {
      const season = getSeason(e.date);
      seasons[season].push({
        label: e.title,
        url: `/cuaderno/${e.slug}`,
        date: e.date.slice(0, 10),
        type: 'cuaderno',
      });
    });

    ctx.contentData.specimens.forEach(s => {
      const season = getSeason(s.grown);
      seasons[season].push({
        label: s.name,
        url: '/#conservatory',
        date: s.grown.slice(0, 10),
        type: 'specimen',
      });
    });

    // Sort items within each season by date descending
    for (const items of Object.values(seasons)) {
      items.sort((a, b) => b.date.localeCompare(a.date));
    }

    // Determine which seasons to expand
    const argLower = args.toLowerCase().trim();
    const expandAll = argLower === 'all';
    const expandOne = seasonOrder.includes(argLower as SeasonKey) ? argLower as SeasonKey : null;

    function renderSeasonItems(items: SeasonItem[]): string {
      if (items.length === 0) {
        return '<div class="season-item output-muted">barbecho.</div>';
      }
      return items.map(item =>
        `<div class="season-item"><span class="output-mono">${item.date}</span>  <a href="${item.url}">${item.type}: ${item.label}</a></div>`
      ).join('');
    }

    let html = '';
    for (const season of seasonOrder) {
      const items = seasons[season];
      const count = items.length;
      const isExpanded = expandAll || expandOne === season;
      const chevron = isExpanded ? 'v' : '>';
      const expandedClass = isExpanded ? ' expanded' : '';

      html += `
        <div class="season-header${expandedClass}" role="button" tabindex="0" aria-expanded="${isExpanded}">
          <span class="season-chevron">${chevron}</span>
          <span>${season} (${count})</span>
        </div>
        <div class="season-items"${isExpanded ? ' style="display: block;"' : ''}>
          ${renderSeasonItems(items)}
        </div>
      `;
    }

    ctx.showOutput(html);
  },

  buscar(args, ctx) {
    navigationCommands.find(args, ctx);
  },

  find(args, ctx) {
    if (!args) {
      ctx.showOutput('<p class="output-line output-muted">buscar qué?</p>');
      return;
    }

    const term = args.toLowerCase();
    const results: { label: string; url: string; meta: string }[] = [];

    ctx.contentData.journal.forEach(e => {
      if (e.title.toLowerCase().includes(term) || e.summary.toLowerCase().includes(term)) {
        results.push({
          label: e.title,
          url: `/cuaderno/${e.slug}`,
          meta: e.summary,
        });
      }
    });

    ctx.contentData.specimens.forEach(s => {
      if (s.name.toLowerCase().includes(term) || (s.series && s.series.toLowerCase().includes(term))) {
        results.push({
          label: s.name,
          url: '/#conservatory',
          meta: s.series ? `series: ${s.series}` : 'specimen',
        });
      }
    });

    ctx.contentData.cultivations.forEach(c => {
      if (c.name.toLowerCase().includes(term)) {
        results.push({
          label: c.name,
          url: '/#cultivations',
          meta: c.status,
        });
      }
    });

    if (results.length === 0) {
      ctx.showOutput(`<p class="output-line output-muted">nothing found for "${args}"</p>`);
      return;
    }

    let html = `<p class="output-line output-muted">${results.length} result${results.length === 1 ? '' : 's'}:</p>`;
    results.forEach(r => {
      html += `
        <div class="search-result">
          <a href="${r.url}">${r.label}</a>
          <div class="result-meta">${r.meta}</div>
        </div>
      `;
    });

    ctx.showOutput(html);
  },

  help(_args, ctx) {
    ctx.showOutput(`
      <p class="output-line"><span class="output-fern">random</span> — go somewhere</p>
      <p class="output-line"><span class="output-fern">about</span> — who tends this</p>
      <p class="output-line"><span class="output-fern">seasons</span> — browse by season</p>
      <p class="output-line"><span class="output-fern">buscar [term]</span> — search</p>
      <p class="output-line"><span class="output-fern">dejar nombre="..." mensaje="..."</span> — leave a note</p>
    `);
  },

  ayuda(_args, ctx) {
    navigationCommands.help('', ctx);
  },

  aide(_args, ctx) {
    navigationCommands.help('', ctx);
  },
};
