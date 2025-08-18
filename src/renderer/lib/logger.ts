// Logging utility for the renderer
export interface LogOptions {
  console?: boolean;
  logger?: boolean;
  data?: any;
}

export const logger = {
  info: (message: string, options: LogOptions = {}) => {
    const { data } = options;
    window.App.addLog({
      level: 'info',
      source: 'renderer',
      message,
      data
    });
  },

  warn: (message: string, options: LogOptions = {}) => {
    const { data } = options;
    window.App.addLog({
      level: 'warn',
      source: 'renderer',
      message,
      data
    });
  },

  error: (message: string, options: LogOptions = {}) => {
    const { data } = options;
    window.App.addLog({
      level: 'error',
      source: 'renderer',
      message,
      data
    });
  },

  debug: (message: string, options: LogOptions = {}) => {
    const { data } = options;
    window.App.addLog({
      level: 'debug',
      source: 'renderer',
      message,
      data
    });
  }
};
