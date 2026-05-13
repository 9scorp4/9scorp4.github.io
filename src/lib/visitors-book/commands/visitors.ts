/**
 * Visitor message commands: dejar, voces
 */

import type { CommandHandler } from '../types';
import { escapeHtml } from '../prose-detection';

export const visitorsCommands: Record<string, CommandHandler> = {
  async dejar(args, ctx) {
    // Parse nombre="X" mensaje="Y"
    const nombreMatch = args.match(/nombre\s*=\s*"([^"]+)"/i);
    const mensajeMatch = args.match(/mensaje\s*=\s*"([^"]+)"/i);

    if (!nombreMatch || !mensajeMatch) {
      ctx.showOutput('<p class="output-line output-muted">dejar: missing nombre or mensaje</p><p class="output-line output-muted">así: <span class="output-mono">dejar nombre="..." mensaje="..."</span></p>');
      return;
    }

    const nombre = nombreMatch[1].trim();
    const mensaje = mensajeMatch[1].trim();

    if (nombre.length > 40) {
      ctx.showOutput('<p class="output-line output-muted">nombre: 40 chars max.</p>');
      return;
    }

    if (mensaje.length > 280) {
      ctx.showOutput('<p class="output-line output-muted">mensaje: 280 chars max. brevity is a gift.</p>');
      return;
    }

    if (!ctx.workerUrl) {
      ctx.showOutput('<p class="output-line output-muted">the garden is not yet ready to receive notes.</p>');
      return;
    }

    ctx.showOutput('<p class="output-line output-muted">sending...</p>');

    try {
      const response = await fetch(`${ctx.workerUrl}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre, mensaje }),
      });

      const data = await response.json() as { ok?: boolean; error?: string; message?: string };

      if (response.ok && data.ok) {
        ctx.showOutput('<p class="output-line output-fern">nota recibida. awaiting approval.</p>');
      } else if (response.status === 429) {
        ctx.showOutput('<p class="output-line output-muted">too many notes. wait an hour.</p>');
      } else {
        ctx.showOutput(`<p class="output-line output-muted">${data.error || 'something went wrong.'}</p>`);
      }
    } catch {
      ctx.showOutput('<p class="output-line output-muted">the garden is unreachable. try again later.</p>');
    }
  },

  voces(_args, ctx) {
    if (ctx.contentData.visitors.length === 0) {
      ctx.showOutput('<p class="output-line output-muted">no voices yet. be the first: dejar nombre="you" mensaje="..."</p>');
      return;
    }

    let html = `<p class="output-line output-muted">${ctx.contentData.visitors.length} voice${ctx.contentData.visitors.length === 1 ? '' : 's'}:</p>`;

    ctx.contentData.visitors.slice(0, 10).forEach(v => {
      html += `<p class="output-line"><span class="output-fern">${escapeHtml(v.nombre)}</span> — <span class="output-quote">"${escapeHtml(v.mensaje)}"</span></p>`;
    });

    if (ctx.contentData.visitors.length > 10) {
      html += `<p class="output-line output-muted">...and ${ctx.contentData.visitors.length - 10} more</p>`;
    }

    ctx.showOutput(html);
  },

  voices(_args, ctx) {
    visitorsCommands.voces('', ctx);
  },
};
