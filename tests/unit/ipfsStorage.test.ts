import { IpfsService } from '../../backend/src/services/storage/ipfs.service';

describe('IpfsService Unit Test Suite', () => {
  let ipfs: IpfsService;

  const sampleEvidence = {
    evidenceId: 'ev_test_123456789',
    timestamp: '2026-09-18T10:00:00Z',
    similarity: 0.942,
    algorithm: 'SHA-256',
    hash: 'e3a5338722a056d56614fa060938b8eb8dbafc31a73229b16db3d62e520e5361'
  };

  beforeEach(() => {
    ipfs = new IpfsService();
  });

  test('computeCid produces deterministic CIDv1 identifier starting with bafkrei', () => {
    const cid1 = ipfs.computeCid('sample-evidence-content');
    const cid2 = ipfs.computeCid('sample-evidence-content');
    const cid3 = ipfs.computeCid('different-content');

    expect(cid1).toBe(cid2);
    expect(cid1).not.toBe(cid3);
    expect(cid1.startsWith('bafkrei')).toBe(true);
    expect(cid1.length).toBe(7 + 52);
  });

  test('pinEvidence stores payload and returns pin result with gateway URL', async () => {
    const res = await ipfs.pinEvidence(sampleEvidence);

    expect(res.cid).toBeDefined();
    expect(res.cid.startsWith('bafkrei')).toBe(true);
    expect(res.sizeBytes).toBeGreaterThan(0);
    expect(res.gatewayUrl).toBe(`https://ipfs.io/ipfs/${res.cid}`);
    expect(res.pinStatus).toBe('pinned');
    expect(ipfs.getPinnedCount()).toBe(1);
  });

  test('getEvidence retrieves pinned evidence matching original data', async () => {
    const pin = await ipfs.pinEvidence(sampleEvidence);
    const retrieved = await ipfs.getEvidence(pin.cid);

    expect(retrieved).toEqual(sampleEvidence);
  });

  test('getEvidence throws error when CID does not exist in pin store', async () => {
    await expect(ipfs.getEvidence('bafkreinonexistentcid')).rejects.toThrow(
      'IPFS_CONTENT_NOT_FOUND'
    );
  });

  test('verifyCid returns true for authentic payload and false for tampered payload', async () => {
    const pin = await ipfs.pinEvidence(sampleEvidence);

    expect(ipfs.verifyCid(sampleEvidence, pin.cid)).toBe(true);

    const tamperedEvidence = { ...sampleEvidence, similarity: 0.5 };
    expect(ipfs.verifyCid(tamperedEvidence, pin.cid)).toBe(false);
  });

  test('unpin removes item and clear empties store', async () => {
    const pin = await ipfs.pinEvidence(sampleEvidence);
    expect(ipfs.getPinnedCount()).toBe(1);

    expect(ipfs.unpin(pin.cid)).toBe(true);
    expect(ipfs.getPinnedCount()).toBe(0);

    await ipfs.pinEvidence(sampleEvidence);
    ipfs.clear();
    expect(ipfs.getPinnedCount()).toBe(0);
  });
});
