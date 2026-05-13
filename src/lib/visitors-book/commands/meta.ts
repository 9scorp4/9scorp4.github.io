/**
 * Meta commands: olvidar, clear
 */

import type { CommandHandler } from '../types';

export const metaCommands: Record<string, CommandHandler> = {
  olvidar(_args, ctx) {
    ctx.setAwaitingConfirmation('olvidar');
    ctx.showOutput('<p class="output-line">¿forget this garden? (y/n) <span class="cursor" aria-hidden="true">_</span></p>');
  },

  forget(_args, ctx) {
    metaCommands.olvidar('', ctx);
  },

  clear(_args, ctx) {
    ctx.dismissOutput();
  },
};
