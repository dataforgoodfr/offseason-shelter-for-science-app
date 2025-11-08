import { BrowserWindow, ipcMain } from 'electron'
import { LogSource, LOG_SOURCE_MAIN, LOG_SOURCE_RENDERER } from 'lib/electron-app/types/logger'

export type LogLevel = 'info' | 'warn' | 'error' | 'debug'

export interface LogEntry {
  id: string
  timestamp: Date
  level: LogLevel
  source: LogSource
  message: string
  data?: any
}

const ACCEPTED_LOG_LEVELS: LogLevel[] = process.env.NODE_ENV === 'development' ? ['info', 'warn', 'error', 'debug'] : ['info', 'warn', 'error'];

class LoggerService {
  private logs: LogEntry[] = []
  private loggerWindow: BrowserWindow | null = null
  private maxLogs = 1000

  constructor() {
    this.setupIPC()
  }

  setLoggerWindow(window: BrowserWindow) {
    this.loggerWindow = window
  }

  private setupIPC() {
    // IPC to receive logs from the renderer
    ipcMain.handle('logger:add-log', (event, logData: Omit<LogEntry, 'id' | 'timestamp'>) => {
      this.addLog({
        ...logData,
        source: LOG_SOURCE_RENDERER
      })
    })
    
    // IPC to get the log history
    ipcMain.handle('logger:get-logs', () => {
      return this.logs
    })

    // IPC to clear the logs
    ipcMain.handle('logger:clear-logs', () => {
      this.clearLogs()
    })
  }

  addLog(logData: Omit<LogEntry, 'id' | 'timestamp'>) {
    if (!ACCEPTED_LOG_LEVELS.includes(logData.level)) {
      return
    }

    const log: LogEntry = {
      ...logData,
      id: this.generateId(),
      timestamp: new Date()
    }

    this.logs.push(log)

    // Limit the number of logs in memory
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs)
    }

    // Send to the logger window if available
    if (this.loggerWindow) {
      this.sendToLoggerWindow(log)
    }
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).slice(2)
  }

  private sendToLoggerWindow(log: LogEntry) {
    if (this.loggerWindow && !this.loggerWindow.isDestroyed()) {
      this.loggerWindow.webContents.send('logger:new-log', log)
    }
  }

  private clearLogs() {
    this.logs = []
    if (this.loggerWindow && !this.loggerWindow.isDestroyed()) {
      this.loggerWindow.webContents.send('logger:logs-cleared')
    }
  }

  // Utility methods for different log levels
  info(message: string, data?: any) {
    this.addLog({
      level: 'info',
      source: LOG_SOURCE_MAIN,
      message,
      data
    })
  }

  warn(message: string, data?: any) {
    this.addLog({
      level: 'warn',
      source: LOG_SOURCE_MAIN,
      message,
      data
    })
  }

  error(message: string, data?: any) {
    this.addLog({
      level: 'error',
      source: LOG_SOURCE_MAIN,
      message,
      data
    })
  }

  debug(message: string, data?: any) {
    this.addLog({
      level: 'debug',
      source: LOG_SOURCE_MAIN,
      message,
      data
    })
  }
}

export const loggerService = new LoggerService()
