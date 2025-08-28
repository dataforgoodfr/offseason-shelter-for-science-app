import { BrowserWindow } from "electron";
import { loggerService } from "./logger";

export type InitStepId = 'folder' | 'upload' | 'download';
export type InitStepStatus = 'loading' | 'success' | 'error';

import { GIGA_BYTES, MEGA_BYTES, TERA_BYTES } from '../../lib/electron-app/utils/units';

export interface InitStep {
  id: InitStepId;
  label: string;
  status: InitStepStatus;
}

export interface InitializationProgress {
  stepId: InitStepId;
  status: InitStepStatus;
  error?: string;
}

export interface InitializationResult {
  success: boolean;
  freeBytes?: number;
  error?: string;
}

export class InitializationService {
  private window: BrowserWindow | null = null;
  private currentPath: string | null = null;
  private isInitializing: boolean = false;

  constructor() {

  }

  setWindow(window: BrowserWindow) {
    this.window = window;
  }

  async startInitialization(selectedPath: string): Promise<InitializationResult> {
    if (this.isInitializing) {
      loggerService.warn('Initialization already in progress', { path: selectedPath });
      return { success: false, error: 'Initialization already in progress' };
    }

    if (!selectedPath) {
      loggerService.error('No path provided for initialization');
      return { success: false, error: 'No path provided' };
    }

    this.isInitializing = true;
    this.currentPath = selectedPath;

    try {
      // Send initialization started event
      this.sendStateUpdate('initializing', true);

      // Execute folder check step
      const freeBytes = await this.checkFolder(selectedPath);

      if (freeBytes) {
        // Send completion event
        this.sendInitializationComplete(freeBytes);
        this.sendStateUpdate('initializing', false);
        this.sendStateUpdate('running', true);

        loggerService.info('Initialization completed successfully', { freeSpaceGb: Math.round(freeBytes / GIGA_BYTES) });

        return { success: true, freeBytes };
      } else {
        throw new Error('Failed to get free space');
      }
    } catch (error: any) {
      loggerService.error('Initialization failed', { 
        data: { path: selectedPath, error: error.message } 
      });

      this.sendError(error);
      this.sendStateUpdate('initializing', true);
      this.sendStateUpdate('running', false);

      return { success: false, error: error.message };
    } finally {
      this.isInitializing = false;
    }
  }

  private async checkFolder(folderPath: string): Promise<number | null> {
    console.log('Checking folder access and free space', { path: folderPath });

    // Send step status update
    this.sendStepStatusUpdate('folder', 'loading');

    try {
      const fs = require('fs');
      
      // Check if folder exists and is accessible
      if (!fs.existsSync(folderPath)) {
        throw new Error('Folder does not exist');
      }

      const stats = fs.statSync(folderPath);
      if (!stats.isDirectory()) {
        throw new Error('Path is not a directory');
      }

      // Get free space using existing system info logic
      const freeBytes = await this.getFreeSpace(folderPath);

      // Simulate processing delay for UX
      await new Promise(resolve => setTimeout(resolve, 500));

      if (freeBytes > 0) {
        this.sendStepStatusUpdate('folder', 'success');
        
        // Additional delay for better UX
        await new Promise(resolve => setTimeout(resolve, 500));
        
        return freeBytes;
      } else {
        throw new Error('Unable to determine free space');
      }
    } catch (error: any) {
      loggerService.error('Folder check failed', { 
        data: { path: folderPath, error: error.message } 
      });
      
      this.sendStepStatusUpdate('folder', 'error');
      throw error;
    }
  }

  private async getFreeSpace(folderPath: string): Promise<number> {
    const { spawn } = require('child_process');
    const DEFAULT_STORAGE_ALLOCATION = 50 * GIGA_BYTES;

    return new Promise((resolve) => {
      let command: string;
      let args: string[];

      if (process.platform === 'win32') {
        command = 'dir';
        args = [folderPath, '/-c'];
      } else {
        command = 'df';
        args = ['-h', folderPath];
      }

      const child = spawn(command, args, { shell: true });
      let output = '';

      child.stdout.on('data', (data: any) => {
        output += data.toString();
      });

      child.on('close', (code: any) => {
        console.log('Free space command output', { output });

        if (process.platform === 'win32') {
          const freeMatch = output.match(/(\d+)\s+bytes\s+free/i);
          if (freeMatch) {
            const freeBytes = parseInt(freeMatch[1], 10);
            console.log('Windows free space detected', { freeBytes, freeGB: Math.round(freeBytes / GIGA_BYTES) });
            resolve(freeBytes);
            return;
          }
        } else {
          const lines = output.split('\n');
          for (const line of lines) {
            if (line.includes('/') && !line.startsWith('Filesystem')) {
              const parts = line.split(/\s+/);
              if (parts.length >= 4) {
                const availStr = parts[3] || parts[2];
                let multiplier = 1024;

                if (availStr.includes('G')) {
                  multiplier = GIGA_BYTES;
                } else if (availStr.includes('M')) {
                  multiplier = MEGA_BYTES;
                } else if (availStr.includes('T')) {
                  multiplier = TERA_BYTES;
                }

                const sizeNum = parseFloat(availStr.replace(/[^\d.]/g, ''));
                const freeBytes = Math.round(sizeNum * multiplier);

                if (freeBytes > 0) {
                  console.log('Unix free space detected', { freeBytes, freeGB: Math.round(freeBytes / GIGA_BYTES) });
                  resolve(freeBytes);
                  return;
                }
              }
            }
          }
        }

        loggerService.warn('Free space parsing failed, using default value');
        resolve(DEFAULT_STORAGE_ALLOCATION);
      });

      child.on('error', (err: any) => {
        loggerService.error('Free space command error', { error: err.message });
        resolve(DEFAULT_STORAGE_ALLOCATION);
      });

      setTimeout(() => {
        child.kill();
        resolve(DEFAULT_STORAGE_ALLOCATION);
      }, 5000);
    });
  }

  private sendStepStatusUpdate(stepId: InitStepId, status: InitStepStatus) {
    if (this.window) {
      this.window.webContents.send('init:step-status', { stepId, status });
    }
  }

  private sendStateUpdate(state: 'initializing' | 'running', value: boolean) {
    if (this.window) {
      this.window.webContents.send('init:state-change', { state, value });
    }
  }

  private sendInitializationComplete(freeBytes: number) {
    if (this.window) {
      this.window.webContents.send('init:complete', { freeBytes });
    }
  }

  private sendError(error: Error) {
    if (this.window) {
      this.window.webContents.send('init:error', { error: error.message });
      console.log('Sent initialization error', { error: error.message });
    }
  }

  retry() {
    if (this.currentPath) {
      loggerService.info('Retrying initialization', { path: this.currentPath });
      return this.startInitialization(this.currentPath);
    } else {
      loggerService.warn('Cannot retry initialization: no current path');
      return Promise.resolve({ success: false, error: 'No path to retry' });
    }
  }

  isRunning(): boolean {
    return this.isInitializing;
  }
}

export const initializationService = new InitializationService();
