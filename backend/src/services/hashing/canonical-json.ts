/**
 * Recursively orders object keys alphabetically and serializes to a deterministic JSON string.
 * - Preserves array element order.
 * - Recursively sorts object keys.
 * - Normalizes null, boolean, number, and string primitives.
 * - Strips undefined values, functions, and symbols from objects.
 * - Produces compact, whitespace-free canonical representation.
 */
export function canonicalize(obj: any): string {
  if (obj === null || typeof obj !== 'object') {
    return JSON.stringify(obj);
  }

  if (Array.isArray(obj)) {
    const serializedElements = obj.map((item) => {
      const canonicalItem = item === undefined ? null : item;
      return canonicalize(canonicalItem);
    });
    return `[${serializedElements.join(',')}]`;
  }

  const sortedKeys = Object.keys(obj)
    .filter((key) => obj[key] !== undefined && typeof obj[key] !== 'function' && typeof obj[key] !== 'symbol')
    .sort();

  const entries: string[] = [];
  for (const key of sortedKeys) {
    const val = obj[key];
    const serializedVal = canonicalize(val);
    entries.push(`${JSON.stringify(key)}:${serializedVal}`);
  }

  return `{${entries.join(',')}}`;
}
