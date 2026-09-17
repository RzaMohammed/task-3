const validateRequest = require('../../backend/middleware/validateRequest');

describe('ValidateRequest Middleware', () => {
  test('calls next() when schema validation passes', () => {
    const mockSchema = {
      validate: jest.fn(() => ({ error: null }))
    };
    const req = { body: { name: 'test' } };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    const next = jest.fn();

    const middleware = validateRequest(mockSchema);
    middleware(req, res, next);

    expect(mockSchema.validate).toHaveBeenCalledWith(req.body);
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  test('returns 400 with error message when schema validation fails', () => {
    const errorMessage = '"email" must be a valid email';
    const mockSchema = {
      validate: jest.fn(() => ({ error: new Error(errorMessage) }))
    };
    const req = { body: { email: 'invalid' } };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    const next = jest.fn();

    const middleware = validateRequest(mockSchema);
    middleware(req, res, next);

    expect(mockSchema.validate).toHaveBeenCalledWith(req.body);
    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: errorMessage
    });
  });
});
