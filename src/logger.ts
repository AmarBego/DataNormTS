import fs from 'fs';
import path from 'path';
import { createHash } from 'crypto';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  context?: Record<string, unknown>;
  timestamp: string;
}

interface LoggerOptions {
  minLevel: LogLevel;
  logToFile: boolean;
  logFilePath?: string;
  logToConsole: boolean;
  asyncLogging: boolean;
  batchSize: number;
  maxFileSize: number; // in bytes
  maxFiles: number;
  silent: boolean;
}

class Logger {
  private options: LoggerOptions;
  private logQueue: LogEntry[] = [];
  private isProcessing = false;
  private currentFileSize = 0;
  private logPromises: Promise<void>[] = [];
  private capturedLogs: string[] = [];

  constructor(options: Partial<LoggerOptions> = {}) {
    this.options = {
      minLevel: 'info',
      logToFile: false,
      logToConsole: true,
      asyncLogging: true,
      batchSize: 10,
      maxFileSize: 5 * 1024 * 1024, // 5MB
      maxFiles: 5,
      silent: false,
      ...options
    };

    if (this.options.logToFile && !this.options.logFilePath) {
      this.options.logFilePath = path.join(process.cwd(), 'app.log');
    }

    if (this.options.logToFile) {
      this.initializeLogFile();
    }
  }

  private async initializeLogFile(): Promise<void> {
    if (!this.options.logFilePath) return;

    try {
      const stats = await fs.promises.stat(this.options.logFilePath);
      this.currentFileSize = stats.size;
    } catch (error) {
      // File doesn't exist, start with size 0
      this.currentFileSize = 0;
    }
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
    return levels.indexOf(level) >= levels.indexOf(this.options.minLevel);
  }

  private formatLogEntry(entry: LogEntry): string {
    const contextString = entry.context ? `\nContext: ${JSON.stringify(entry.context, null, 2)}` : '';
    return `[${entry.timestamp}] ${entry.level.toUpperCase()}: ${entry.message}${contextString}\n`;
  }

  private async writeToFile(formattedEntry: string): Promise<void> {
    if (!this.options.logToFile || !this.options.logFilePath) return;

    try {
      await this.rotateLogIfNeeded();
      await fs.promises.appendFile(this.options.logFilePath, formattedEntry);
      this.currentFileSize += Buffer.byteLength(formattedEntry);
    } catch (error) {
      console.error('Failed to write to log file:', error);
      // Fallback to console logging if file writing fails
      console.error('Fallback log entry:', formattedEntry);
    }
  }

  private async rotateLogIfNeeded(): Promise<void> {
    if (!this.options.logFilePath || this.currentFileSize < this.options.maxFileSize) return;

    for (let i = this.options.maxFiles - 1; i > 0; i--) {
      const oldPath = `${this.options.logFilePath}.${i}`;
      const newPath = `${this.options.logFilePath}.${i + 1}`;
      try {
        await fs.promises.rename(oldPath, newPath);
      } catch (error) {
        // Ignore errors if file doesn't exist
      }
    }

    try {
      await fs.promises.rename(this.options.logFilePath, `${this.options.logFilePath}.1`);
      this.currentFileSize = 0;
    } catch (error) {
      console.error('Failed to rotate log file:', error);
    }
  }

  private logToConsole(entry: LogEntry): void {
    if (!this.options.logToConsole) return;

    const consoleMethod = entry.level === 'debug' ? console.debug :
                          entry.level === 'info' ? console.info :
                          entry.level === 'warn' ? console.warn :
                          console.error;

    consoleMethod(this.formatLogEntry(entry));
  }

  private createLogEntry(level: LogLevel, message: string, context?: Record<string, unknown>): LogEntry {
    return {
      level,
      message,
      context,
      timestamp: new Date().toISOString(),
    };
  }

  private async processLogQueue(): Promise<void> {
    if (this.isProcessing || this.logQueue.length === 0) return;

    this.isProcessing = true;
    const batch = this.logQueue.splice(0, this.options.batchSize);

    const batchPromises = batch.map(async (entry) => {
      const formattedEntry = this.formatLogEntry(entry);
      this.logToConsole(entry);
      await this.writeToFile(formattedEntry);
    });

    await Promise.all(batchPromises);

    this.isProcessing = false;
    if (this.logQueue.length > 0) {
      setImmediate(() => this.processLogQueue());
    }
  }

  private enqueueLog(entry: LogEntry): void {
    this.logQueue.push(entry);
    if (this.options.silent) {
      this.capturedLogs.push(this.formatLogEntry(entry));
    } else {
      const logPromise = this.options.asyncLogging
        ? new Promise<void>((resolve) => setImmediate(() => this.processLogQueue().then(resolve)))
        : this.processLogQueue();
      this.logPromises.push(logPromise);
    }
  }

  log(level: LogLevel, message: string, context?: Record<string, unknown>): void {
    if (!this.shouldLog(level)) return;

    const entry = this.createLogEntry(level, message, context);
    this.enqueueLog(entry);
  }

  debug(message: string, context?: Record<string, unknown>): void {
    this.log('debug', message, context);
  }

  info(message: string, context?: Record<string, unknown>): void {
    this.log('info', message, context);
  }

  warn(message: string, context?: Record<string, unknown>): void {
    this.log('warn', message, context);
  }

  error(message: string, context?: Record<string, unknown>): void {
    this.log('error', message, context);
  }

  async flush(): Promise<void> {
    await Promise.all(this.logPromises);
    this.logPromises = [];
  }

  setSilent(silent: boolean): void {
    this.options.silent = silent;
    if (!silent) {
      this.flushCapturedLogs();
    }
  }

  private flushCapturedLogs(): void {
    this.capturedLogs.forEach(log => console.log(log));
    this.capturedLogs = [];
  }

  getCapturedLogs(): string[] {
    return this.capturedLogs;
  }

  clearCapturedLogs(): void {
    this.capturedLogs = [];
  }

  setLogLevel(level: LogLevel): void {
    this.options.minLevel = level;
  }

  getLogLevel(): LogLevel {
    return this.options.minLevel;
  }
}

// Create a singleton instance
export const logger = new Logger({
  minLevel: process.env.NODE_ENV === 'production' ? 'warn' : 'debug',
  logToFile: process.env.NODE_ENV === 'production',
  logToConsole: process.env.NODE_ENV !== 'production',
  asyncLogging: true,
  batchSize: 10,
  maxFileSize: 5 * 1024 * 1024, // 5MB
  maxFiles: 5
});

export const flushLogs = () => logger.flush();