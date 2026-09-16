const LOG_LEVELS = { error: 0, warn: 1, info: 2, debug: 3 } as const;
type LogLevel = keyof typeof LOG_LEVELS;

const currentLevel: LogLevel = (process.env.LOG_LEVEL as LogLevel) || 'info';

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVELS[level] <= LOG_LEVELS[currentLevel];
}

function formatPrefix(level: string, context?: string): string {
  const ts = new Date().toISOString();
  const ctx = context ? ` [${context}]` : '';
  return `[${ts}] [${level.toUpperCase()}]${ctx}`;
}

export const logger = {
  info: (msg: string, ...args: any[]) => {
    if (shouldLog('info')) console.log(`${formatPrefix('info')} ${msg}`, ...args);
  },
  warn: (msg: string, ...args: any[]) => {
    if (shouldLog('warn')) console.warn(`${formatPrefix('warn')} ${msg}`, ...args);
  },
  error: (msg: string, ...args: any[]) => {
    if (shouldLog('error')) console.error(`${formatPrefix('error')} ${msg}`, ...args);
  },
  debug: (msg: string, ...args: any[]) => {
    if (shouldLog('debug')) console.debug(`${formatPrefix('debug')} ${msg}`, ...args);
  },
  /** Creates a child logger with a fixed context label */
  child: (context: string) => ({
    info: (msg: string, ...args: any[]) => {
      if (shouldLog('info')) console.log(`${formatPrefix('info', context)} ${msg}`, ...args);
    },
    warn: (msg: string, ...args: any[]) => {
      if (shouldLog('warn')) console.warn(`${formatPrefix('warn', context)} ${msg}`, ...args);
    },
    error: (msg: string, ...args: any[]) => {
      if (shouldLog('error')) console.error(`${formatPrefix('error', context)} ${msg}`, ...args);
    },
    debug: (msg: string, ...args: any[]) => {
      if (shouldLog('debug')) console.debug(`${formatPrefix('debug', context)} ${msg}`, ...args);
    },
  }),
};
