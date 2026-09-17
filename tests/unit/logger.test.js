const logger = require('../../backend/utils/logger');

describe('Logger Utility', () => {
  let originalError, originalWarn, originalInfo, originalDebug;
  let logs = { error: [], warn: [], info: [], debug: [] };

  beforeEach(() => {
    logs = { error: [], warn: [], info: [], debug: [] };
    originalError = console.error;
    originalWarn = console.warn;
    originalInfo = console.info;
    originalDebug = console.debug;

    console.error = jest.fn((...args) => logs.error.push(args.join(' ')));
    console.warn = jest.fn((...args) => logs.warn.push(args.join(' ')));
    console.info = jest.fn((...args) => logs.info.push(args.join(' ')));
    console.debug = jest.fn((...args) => logs.debug.push(args.join(' ')));
  });

  afterEach(() => {
    console.error = originalError;
    console.warn = originalWarn;
    console.info = originalInfo;
    console.debug = originalDebug;
  });

  test('logger.error prints formatted message with timestamp and ERROR tag', () => {
    logger.error('Critical database connection failure');
    expect(console.error).toHaveBeenCalled();
    const message = logs.error[0];
    expect(message).toContain('[ERROR] Critical database connection failure');
    expect(message).toMatch(/\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });

  test('logger.warn prints formatted message with timestamp and WARN tag', () => {
    logger.warn('Rate limit approaching threshold', { rate: 95 });
    expect(console.warn).toHaveBeenCalled();
    const message = logs.warn[0];
    expect(message).toContain('[WARN] Rate limit approaching threshold');
  });

  test('logger.info prints formatted message with timestamp and INFO tag', () => {
    logger.info('Server initialized successfully');
    expect(console.info).toHaveBeenCalled();
    const message = logs.info[0];
    expect(message).toContain('[INFO] Server initialized successfully');
  });
});
