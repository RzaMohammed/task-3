import {
  isValidBase58,
  encodeBase58,
  decodeBase58,
  hexToBase58,
  base58ToHex,
  isValidBase64,
  encodeBase64,
  decodeBase64,
} from '../../backend/src/utils/encodingUtils';


describe('Base58 & Base64 Encoding Utilities Unit Tests', () => {
  describe('Base58 Encoding & Decoding', () => {
    const rawBytes = Buffer.from('hello solana devnet', 'utf8');

    it('encodes buffer to base58 correctly', () => {
      const encoded = encodeBase58(rawBytes);
      expect(typeof encoded).toBe('string');
      expect(isValidBase58(encoded)).toBe(true);
    });

    it('round trips buffer through base58 encode and decode faithfully', () => {
      const encoded = encodeBase58(rawBytes);
      const decoded = decodeBase58(encoded);
      expect(Buffer.from(decoded).toString('utf8')).toBe('hello solana devnet');
    });

    it('validates standard Base58 alphabet correctly', () => {
      expect(isValidBase58('11111111111111111111111111111111')).toBe(true); // Solana System Program
      expect(isValidBase58('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr')).toBe(true); // Memo Program
      expect(isValidBase58('0OIl')).toBe(false); // 0, O, I, l are forbidden in Base58
      expect(isValidBase58('hello!world')).toBe(false);
      expect(isValidBase58('')).toBe(false);
    });

    it('handles empty inputs safely', () => {
      expect(encodeBase58(Buffer.alloc(0))).toBe('');
      expect(decodeBase58('')).toEqual(new Uint8Array(0));
    });

    it('converts hex string to Base58 and back accurately', () => {
      const hex = 'deadbeef0123456789abcdef';
      const b58 = hexToBase58(hex);
      expect(isValidBase58(b58)).toBe(true);
      const recoveredHex = base58ToHex(b58);
      expect(recoveredHex).toBe(hex);
    });

    it('handles 0x prefix in hex string', () => {
      const hexWithPrefix = '0xdeadbeef';
      const b58 = hexToBase58(hexWithPrefix);
      const recoveredHex = base58ToHex(b58);
      expect(recoveredHex).toBe('deadbeef');
    });
  });

  describe('Base64 Encoding & Decoding', () => {
    const text = 'face-blockchain-canonical-evidence';

    it('encodes and decodes string correctly', () => {
      const b64 = encodeBase64(text);
      expect(isValidBase64(b64)).toBe(true);
      const decoded = decodeBase64(b64);
      expect(decoded.toString('utf8')).toBe(text);
    });

    it('validates Base64 pattern correctly', () => {
      expect(isValidBase64('SGVsbG8gV29ybGQ=')).toBe(true);
      expect(isValidBase64('SGVsbG8=')).toBe(true);
      expect(isValidBase64('NotBase64!!')).toBe(false);
      expect(isValidBase64('ABC')).toBe(false); // Not multiple of 4
      expect(isValidBase64('')).toBe(false);
    });

    it('handles empty inputs safely', () => {
      expect(decodeBase64('')).toEqual(Buffer.alloc(0));
    });
  });
});
