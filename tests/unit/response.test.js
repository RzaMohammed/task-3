const { success, created, paginated } = require('../../backend/utils/response');

describe('Response Formatter Utility', () => {
  const createMockRes = () => {
    const res = {
      statusCode: null,
      jsonData: null,
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(data) {
        this.jsonData = data;
        return this;
      }
    };
    return res;
  };

  describe('success', () => {
    test('formats successful response with default 200 status', () => {
      const res = createMockRes();
      const payload = { user: 'Alice' };

      success(res, payload);

      expect(res.statusCode).toBe(200);
      expect(res.jsonData.success).toBe(true);
      expect(res.jsonData.data).toEqual(payload);
      expect(typeof res.jsonData.timestamp).toBe('string');
    });

    test('accepts custom status code', () => {
      const res = createMockRes();
      success(res, { ok: true }, 202);

      expect(res.statusCode).toBe(202);
      expect(res.jsonData.success).toBe(true);
    });
  });

  describe('created', () => {
    test('formats response with 201 Created status', () => {
      const res = createMockRes();
      const payload = { id: 'evt-123' };

      created(res, payload);

      expect(res.statusCode).toBe(201);
      expect(res.jsonData.success).toBe(true);
      expect(res.jsonData.data).toEqual(payload);
      expect(res.jsonData.timestamp).toBeDefined();
    });
  });

  describe('paginated', () => {
    test('formats paginated response with accurate pagination metadata', () => {
      const res = createMockRes();
      const items = ['a', 'b', 'c'];
      const pagination = { page: 1, limit: 10, total: 25 };

      paginated(res, items, pagination);

      expect(res.statusCode).toBe(200);
      expect(res.jsonData.success).toBe(true);
      expect(res.jsonData.data).toEqual(items);
      expect(res.jsonData.pagination).toEqual({
        page: 1,
        limit: 10,
        total: 25,
        totalPages: 3,
        hasNext: true,
        hasPrev: false
      });
      expect(res.jsonData.timestamp).toBeDefined();
    });

    test('calculates hasNext and hasPrev correctly for last page', () => {
      const res = createMockRes();
      paginated(res, ['z'], { page: 3, limit: 10, total: 25 });

      expect(res.jsonData.pagination.totalPages).toBe(3);
      expect(res.jsonData.pagination.hasNext).toBe(false);
      expect(res.jsonData.pagination.hasPrev).toBe(true);
    });
  });
});
