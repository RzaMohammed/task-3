const requestTimeout = require('../../backend/middleware/requestTimeout');

describe('RequestTimeout Middleware', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('calls next() and responds with 408 if timeout expires and headers are not sent', () => {
    const req = {};
    const handlers = {};
    const res = {
      headersSent: false,
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      on: jest.fn((event, handler) => {
        handlers[event] = handler;
      })
    };
    const next = jest.fn();

    const middleware = requestTimeout(5000);
    middleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();

    // Advance timer past 5000ms
    jest.advanceTimersByTime(5001);

    expect(res.status).toHaveBeenCalledWith(408);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({
          code: 'REQUEST_TIMEOUT',
          message: 'Request timed out after 5 seconds.'
        })
      })
    );
  });

  test('does not send 408 if res.headersSent is true when timeout fires', () => {
    const req = {};
    const res = {
      headersSent: true,
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      on: jest.fn()
    };
    const next = jest.fn();

    const middleware = requestTimeout(2000);
    middleware(req, res, next);

    jest.advanceTimersByTime(2500);

    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
  });
});
