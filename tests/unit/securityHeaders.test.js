const securityHeaders = require('../../backend/middleware/securityHeaders');

describe('Security Headers Middleware Unit Tests', () => {
  let req;
  let res;
  let next;
  let headers;

  beforeEach(() => {
    headers = {};
    req = {
      secure: false,
      headers: {},
    };
    res = {
      setHeader: jest.fn((name, val) => {
        headers[name.toLowerCase()] = val;
      }),
      removeHeader: jest.fn((name) => {
        delete headers[name.toLowerCase()];
      }),
    };
    next = jest.fn();
  });

  it('sets standard security response headers by default', () => {
    const middleware = securityHeaders();
    middleware(req, res, next);

    expect(res.removeHeader).toHaveBeenCalledWith('X-Powered-By');
    expect(res.setHeader).toHaveBeenCalledWith('X-Content-Type-Options', 'nosniff');
    expect(res.setHeader).toHaveBeenCalledWith('X-Frame-Options', 'DENY');
    expect(res.setHeader).toHaveBeenCalledWith('X-XSS-Protection', '1; mode=block');
    expect(res.setHeader).toHaveBeenCalledWith(
      'Referrer-Policy',
      'strict-origin-when-cross-origin'
    );
    expect(res.setHeader).toHaveBeenCalledWith(
      'Permissions-Policy',
      'camera=(), microphone=(), geolocation=()'
    );
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('allows customizing frameOptions and referrerPolicy', () => {
    const middleware = securityHeaders({
      frameOptions: 'SAMEORIGIN',
      referrerPolicy: 'no-referrer',
    });
    middleware(req, res, next);

    expect(res.setHeader).toHaveBeenCalledWith('X-Frame-Options', 'SAMEORIGIN');
    expect(res.setHeader).toHaveBeenCalledWith('Referrer-Policy', 'no-referrer');
  });

  it('attaches HSTS header for HTTPS connections', () => {
    req.secure = true;
    const middleware = securityHeaders({ enableHsts: true, hstsMaxAge: 60000 });
    middleware(req, res, next);

    expect(res.setHeader).toHaveBeenCalledWith(
      'Strict-Transport-Security',
      'max-age=60000; includeSubDomains; preload'
    );
  });

  it('attaches HSTS header when x-forwarded-proto is https', () => {
    req.headers['x-forwarded-proto'] = 'https';
    const middleware = securityHeaders({ enableHsts: true });
    middleware(req, res, next);

    expect(res.setHeader).toHaveBeenCalledWith(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload'
    );
  });

  it('does not attach HSTS on plain HTTP connections', () => {
    req.secure = false;
    const middleware = securityHeaders({ enableHsts: true });
    middleware(req, res, next);

    expect(res.setHeader).not.toHaveBeenCalledWith(
      'Strict-Transport-Security',
      expect.any(String)
    );
  });
});
