/**
 * Security response headers middleware providing defense-in-depth headers:
 * - Anti-MIME sniffing (X-Content-Type-Options)
 * - Clickjacking defense (X-Frame-Options)
 * - XSS filter protection (X-XSS-Protection)
 * - Referrer policy control (Referrer-Policy)
 * - Strict Transport Security (HSTS)
 * - Permissions Policy
 */

function securityHeaders(options = {}) {
  const {
    frameOptions = 'DENY',
    contentTypeOptions = 'nosniff',
    referrerPolicy = 'strict-origin-when-cross-origin',
    enableHsts = true,
    hstsMaxAge = 31536000,
  } = options;

  return (req, res, next) => {
    // Remove technology disclosure header
    res.removeHeader('X-Powered-By');

    // MIME sniffing defense
    if (contentTypeOptions) {
      res.setHeader('X-Content-Type-Options', contentTypeOptions);
    }

    // Clickjacking defense
    if (frameOptions) {
      res.setHeader('X-Frame-Options', frameOptions);
    }

    // XSS defense
    res.setHeader('X-XSS-Protection', '1; mode=block');

    // Referrer control
    if (referrerPolicy) {
      res.setHeader('Referrer-Policy', referrerPolicy);
    }

    // Permissions Policy
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

    // HSTS (Strict-Transport-Security) for HTTPS connections
    if (enableHsts && (req.secure || req.headers['x-forwarded-proto'] === 'https')) {
      res.setHeader(
        'Strict-Transport-Security',
        `max-age=${hstsMaxAge}; includeSubDomains; preload`
      );
    }

    next();
  };
}

module.exports = securityHeaders;
