const requestId = require('../../backend/middleware/requestId');

describe('Request ID Middleware', () => {
  test('assigns a generated UUID if X-Request-ID header is not provided', () => {
    const req = { headers: {} };
    const headers = {};
    const res = {
      setHeader: jest.fn((key, value) => {
        headers[key] = value;
      })
    };
    const next = jest.fn();

    requestId(req, res, next);

    expect(req.requestId).toBeDefined();
    expect(typeof req.requestId).toBe('string');
    expect(req.requestId.length).toBeGreaterThan(10);
    expect(res.setHeader).toHaveBeenCalledWith('X-Request-ID', req.requestId);
    expect(next).toHaveBeenCalledTimes(1);
  });

  test('preserves existing X-Request-ID if provided in incoming headers', () => {
    const customId = 'client-req-999-abc';
    const req = { headers: { 'x-request-id': customId } };
    const res = {
      setHeader: jest.fn()
    };
    const next = jest.fn();

    requestId(req, res, next);

    expect(req.requestId).toBe(customId);
    expect(res.setHeader).toHaveBeenCalledWith('X-Request-ID', customId);
    expect(next).toHaveBeenCalledTimes(1);
  });
});
