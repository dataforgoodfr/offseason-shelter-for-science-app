import { LOG_SOURCE_RENDERER } from "lib/electron-app/types/logger";

export const logger = {
  info: (message: string, data?: any) => {
    window.App.addLog({
      level: 'info',
      source: LOG_SOURCE_RENDERER,
      message,
      data
    });
  },

  warn: (message: string, data?: any) => {
    window.App.addLog({
      level: 'warn',
      source: LOG_SOURCE_RENDERER,
      message,
      data
    });
  },

  error: (message: string, data?: any) => {
    window.App.addLog({
      level: 'error',
      source: LOG_SOURCE_RENDERER,
      message,
      data
    });
  },

  debug: (message: string, data?: any) => {
    window.App.addLog({
      level: 'debug',
      source: LOG_SOURCE_RENDERER,
      message,
      data
    });
  }
};
