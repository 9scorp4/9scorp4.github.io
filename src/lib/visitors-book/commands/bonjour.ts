/**
 * bonjour command - weather and daily poem from Montréal
 */

import type { CommandHandler } from '../types';
import { escapeHtml } from '../prose-detection';

function proseRedirect(ctx: { showOutput: (html: string) => void }): void {
  ctx.showOutput('<p class="output-line output-muted">parece una nota — prueba <span class="output-mono">dejar</span></p>');
}

export const bonjourCommand: CommandHandler = async function bonjour(args, ctx) {
  if (args.trim() !== '') {
    proseRedirect(ctx);
    return;
  }
  if (!ctx.workerUrl) {
    ctx.showOutput('<p class="output-line output-muted">le jardin regarde dehors. le ciel est là.</p>');
    return;
  }

  ctx.showOutput('<p class="output-line output-muted">...</p>');

  try {
    const response = await fetch(`${ctx.workerUrl}/bonjour`);
    const data = await response.json() as {
      ok?: boolean;
      weather?: {
        temperature: number;
        condition: string;
        phrase: string;
      } | null;
      encounter?: string;
      poem?: string;
      poemId?: string;
      engagement?: {
        bien: number;
        bof: number;
        nul: number;
        total: number;
      } | null;
    };

    if (!response.ok || !data.ok) {
      ctx.showOutput('<p class="output-line output-muted">le jardin regarde dehors. le ciel est là.</p>');
      return;
    }

    let html = '';

    // Weather line
    if (data.weather) {
      html += `<p class="output-line output-mono">montréal · ${data.weather.temperature}°c — ${data.weather.phrase}</p>`;
    } else {
      html += '<p class="output-line output-muted">(les chiffres se sont perdus en chemin.)</p>';
    }

    // Encounter location
    if (data.encounter) {
      html += `<p class="output-line output-muted">trouvé · ${data.encounter}</p>`;
    }

    // Poem
    if (data.poem) {
      const poemLines = data.poem.split('\n').filter((l: string) => l.trim());
      html += '<div class="output-quote" style="margin-top: 8px;">';
      poemLines.forEach((line: string) => {
        html += `<p class="output-line">${escapeHtml(line)}</p>`;
      });
      html += '</div>';

      // Engagement counts
      if (data.engagement && data.engagement.total > 0) {
        const { bien, bof, nul, total } = data.engagement;
        html += `<p class="output-line output-muted engagement-line">${total} avis · ${bien} bien · ${bof} bof · ${nul} nul</p>`;
      }

      // Rating row
      if (data.poemId) {
        html += `
          <div class="rating-row" data-poem-id="${data.poemId}" data-worker-url="${ctx.workerUrl}">
            <button class="rating-btn" data-rating="bien">+ bien</button>
            <span class="rating-sep">·</span>
            <button class="rating-btn" data-rating="bof">· bof</button>
            <span class="rating-sep">·</span>
            <button class="rating-btn" data-rating="nul">− nul</button>
          </div>
        `;
      }
    }

    ctx.showOutput(html);
  } catch {
    ctx.showOutput('<p class="output-line output-muted">le jardin regarde dehors. le ciel est là.</p>');
  }
};
