import {
  isValidCid,
  isV0Cid,
  isV1Cid,
  parseCid,
  formatIpfsGatewayUrl,
} from '../../backend/src/utils/cidUtils';

describe('CID Utility Unit Tests', () => {
  // Realistic test CIDs
  const validCidV0 = 'QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco';
  const validCidV1Raw = 'bafkreicysg23kiwv34eg2dplqcfbd6pvxfbznasy2ebra7qvd6ic2ebb3u';
  const validCidV1DagPb = 'bafybeicg2hm44xa24pfhyq2e434fglv672w5c3z67kfl27spqvgx7ygeze';

  describe('isV0Cid', () => {
    it('returns true for valid 46-character base58btc CIDv0 starting with Qm', () => {
      expect(isV0Cid(validCidV0)).toBe(true);
    });

    it('returns false for invalid or wrong-length CIDv0', () => {
      expect(isV0Cid('QmShort')).toBe(false);
      expect(isV0Cid('QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco0000')).toBe(false);
      expect(isV0Cid('ZmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco')).toBe(false);
      expect(isV0Cid('')).toBe(false);
    });
  });

  describe('isV1Cid', () => {
    it('returns true for valid base32 CIDv1', () => {
      expect(isV1Cid(validCidV1Raw)).toBe(true);
      expect(isV1Cid(validCidV1DagPb)).toBe(true);
    });

    it('returns false for non-v1 strings', () => {
      expect(isV1Cid(validCidV0)).toBe(false);
      expect(isV1Cid('not-a-cid')).toBe(false);
      expect(isV1Cid('bafk-has-hyphens-not-base32')).toBe(false);
    });
  });

  describe('isValidCid', () => {
    it('returns true for both CIDv0 and CIDv1', () => {
      expect(isValidCid(validCidV0)).toBe(true);
      expect(isValidCid(validCidV1Raw)).toBe(true);
      expect(isValidCid(validCidV1DagPb)).toBe(true);
    });

    it('returns false for invalid inputs', () => {
      expect(isValidCid('')).toBe(false);
      expect(isValidCid('random_string_12345')).toBe(false);
      expect(isValidCid(null as unknown as string)).toBe(false);
    });
  });

  describe('parseCid', () => {
    it('accurately parses CIDv0 details', () => {
      const parsed = parseCid(validCidV0);
      expect(parsed).not.toBeNull();
      expect(parsed?.version).toBe(0);
      expect(parsed?.multibase).toBe('base58btc');
      expect(parsed?.codec).toBe('dag-pb');
      expect(parsed?.multihashAlgorithm).toBe('sha2-256');
      expect(parsed?.normalized).toBe(validCidV0);
    });

    it('accurately parses CIDv1 raw details', () => {
      const parsed = parseCid(validCidV1Raw);
      expect(parsed).not.toBeNull();
      expect(parsed?.version).toBe(1);
      expect(parsed?.multibase).toBe('base32');
      expect(parsed?.codec).toBe('raw');
      expect(parsed?.multihashAlgorithm).toBe('sha2-256');
    });

    it('accurately parses CIDv1 dag-pb details', () => {
      const parsed = parseCid(validCidV1DagPb);
      expect(parsed).not.toBeNull();
      expect(parsed?.version).toBe(1);
      expect(parsed?.codec).toBe('dag-pb');
    });

    it('returns null for unparseable strings', () => {
      expect(parseCid('hello world')).toBeNull();
      expect(parseCid('')).toBeNull();
    });
  });

  describe('formatIpfsGatewayUrl', () => {
    it('formats default ipfs.io URL for valid CID', () => {
      const url = formatIpfsGatewayUrl(validCidV1Raw);
      expect(url).toBe(`https://ipfs.io/ipfs/${validCidV1Raw}`);
    });

    it('formats custom gateway URL and trims trailing slashes', () => {
      const url = formatIpfsGatewayUrl(validCidV0, 'https://cloudflare-ipfs.com/ipfs/');
      expect(url).toBe(`https://cloudflare-ipfs.com/ipfs/${validCidV0}`);
    });

    it('throws an error when an invalid CID is provided', () => {
      expect(() => formatIpfsGatewayUrl('bad-cid')).toThrow('Invalid CID format');
    });
  });
});
