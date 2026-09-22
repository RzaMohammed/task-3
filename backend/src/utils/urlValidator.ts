import { URL } from 'url';

/**
 * SSRF (Server-Side Request Forgery) Defense and URL Validation Utility.
 */

// Private & reserved IP range regexes (IPv4)
const PRIVATE_IPV4_PATTERNS = [
  /^127\./,                         // Loopback 127.0.0.0/8
  /^10\./,                          // RFC 1918 Class A 10.0.0.0/8
  /^172\.(1[6-9]|2[0-9]|3[0-1])\./, // RFC 1918 Class B 172.16.0.0/12
  /^192\.168\./,                    // RFC 1918 Class C 192.168.0.0/16
  /^169\.254\./,                    // Link-local / Cloud metadata 169.254.0.0/16
  /^0\./,                           // Zero-net 0.0.0.0/8
  /^224\./,                         // Multicast 224.0.0.0/4
  /^240\./,                         // Reserved
];

const DISALLOWED_HOSTNAMES = new Set([
  'localhost',
  'localhost.localdomain',
  'ip6-localhost',
  'ip6-loopback',
  'metadata.google.internal',
  'instance-data',
]);

export interface UrlValidationOptions {
  allowedProtocols?: string[];
  allowedPorts?: number[];
  allowPrivateIps?: boolean;
}

const DEFAULT_OPTIONS: UrlValidationOptions = {
  allowedProtocols: ['http:', 'https:'],
  allowedPorts: [80, 443, 8080, 8443],
  allowPrivateIps: false,
};

/**
 * Validates whether a given URL is syntactically valid and safe from SSRF exploits.
 * @param urlString URL to evaluate
 * @param options Validation options
 */
export function isSafeUrl(urlString: string, options: UrlValidationOptions = {}): boolean {
  try {
    if (!urlString || typeof urlString !== 'string') {
      return false;
    }

    const opts = { ...DEFAULT_OPTIONS, ...options };
    const parsed = new URL(urlString.trim());

    // 1. Protocol check
    if (opts.allowedProtocols && !opts.allowedProtocols.includes(parsed.protocol.toLowerCase())) {
      return false;
    }

    const hostname = parsed.hostname.toLowerCase().trim();

    // 2. Disallowed hostname keywords
    if (DISALLOWED_HOSTNAMES.has(hostname)) {
      return false;
    }

    // 3. IPv6 loopback check
    if (hostname === '[::1]' || hostname === '::1') {
      return false;
    }

    // 4. Private IPv4 address check
    if (!opts.allowPrivateIps) {
      for (const pattern of PRIVATE_IPV4_PATTERNS) {
        if (pattern.test(hostname)) {
          return false;
        }
      }
    }

    // 5. Port check
    const port = parsed.port ? parseInt(parsed.port, 10) : (parsed.protocol === 'https:' ? 443 : 80);
    if (opts.allowedPorts && !opts.allowedPorts.includes(port)) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

/**
 * Asserts that a URL is safe, throwing an Error with details if unsafe.
 * @param urlString URL to evaluate
 * @param options Validation options
 */
export function assertSafeUrl(urlString: string, options: UrlValidationOptions = {}): URL {
  if (!isSafeUrl(urlString, options)) {
    throw new Error(`SSRF Guard: Provided URL '${urlString}' is invalid or blocked for security.`);
  }
  return new URL(urlString.trim());
}
