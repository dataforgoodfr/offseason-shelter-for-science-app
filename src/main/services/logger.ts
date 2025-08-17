import { BrowserWindow, ipcMain } from 'electron'

export interface LogEntry {
  id: string
  timestamp: Date
  level: 'info' | 'warn' | 'error' | 'debug'
  source: 'main' | 'renderer' | 'system'
  message: string
  data?: any
}

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
        source: 'renderer'
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
      source: 'main',
      message,
      data
    })
  }

  warn(message: string, data?: any) {
    this.addLog({
      level: 'warn',
      source: 'main',
      message,
      data
    })
  }

  error(message: string, data?: any) {
    this.addLog({
      level: 'error',
      source: 'main',
      message,
      data
    })
  }

  debug(message: string, data?: any) {
    this.addLog({
      level: 'debug',
      source: 'main',
      message,
      data
    })
  }
}

export const loggerService = new LoggerService()
