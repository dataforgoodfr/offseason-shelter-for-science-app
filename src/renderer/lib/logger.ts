export const logger = {
  info: (message: string, data?: any) => {
    window.App.addLog({
      level: 'info',
      source: 'renderer',
      message,
      data
    });
  },

  warn: (message: string, data?: any) => {
    window.App.addLog({
      level: 'warn',
      source: 'renderer',
      message,
      data
    });
  },

  error: (message: string, data?: any) => {
    window.App.addLog({
      level: 'error',
      source: 'renderer',
      message,
      data
    });
  },

  debug: (message: string, data?: any) => {
    window.App.addLog({
      level: 'debug',
      source: 'renderer',
      message,
      data
    });
  }
};
