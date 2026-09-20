import { EvidenceController } from '../backend/src/controllers/evidence.controller';
import { VerificationController } from '../backend/src/controllers/verification.controller';
import { EvidenceService } from '../backend/src/services/hashing/evidence.service';
import { EvidenceBundleService } from '../backend/src/services/hashing/evidence-bundle.service';
import { buildEvidenceMerkleTree } from '../backend/src/services/verification/merkle.service';

describe('Evidence Audit Bundle & Merkle Proof Controller API Test Suite', () => {
  const sampleMatch = {
    url: 'https://example.com/photos/profile.jpg',
    platform: 'web',
    title: 'Verification Test Profile',
    description: 'Cryptographic test sample image',
    imageUrl: 'https://example.com/image.jpg',
    publishedAt: null,
    similarity: 0.965,
    metadata: { testId: 'api-bundle-001' }
  };

  let samplePackage: any;

  beforeAll(() => {
    samplePackage = EvidenceService.createEvidenceRecord({
      match: sampleMatch,
      threshold: 0.85
    });
  });

  const createMockReqRes = (body: any = {}) => {
    const req: any = { body, params: {}, query: {}, headers: {} };
    let statusCode = 200;
    let jsonPayload: any = null;

    const res: any = {
      status: jest.fn((code: number) => {
        statusCode = code;
        return res;
      }),
      json: jest.fn((data: any) => {
        jsonPayload = data;
        return res;
      })
    };

    const next = jest.fn();

    return {
      req,
      res,
      next,
      getStatusCode: () => statusCode,
      getJson: () => jsonPayload
    };
  };

  describe('EvidenceController.exportBundle', () => {
    test('exports a complete, valid EvidenceAuditBundle with manifest and Merkle proof', async () => {
      const { req, res, next, getStatusCode, getJson } = createMockReqRes({
        evidencePackage: samplePackage,
        anchors: {
          solanaTx: '5K2F7UqTxSignatureTestString111111111111111111111111111111111',
          ipfsCid: 'bafkreicid1234567890abcdefghijklmnopqrstuvwxyz'
        }
      });

      await EvidenceController.exportBundle(req, res, next);

      expect(getStatusCode()).toBe(200);
      const json = getJson();
      expect(json.success).toBe(true);
      expect(json.bundle).toBeDefined();

      const { bundle } = json;
      expect(bundle.manifest.bundleVersion).toBe('1.0');
      expect(bundle.manifest.evidenceId).toBe(samplePackage.evidenceId);
      expect(bundle.manifest.evidenceFingerprint).toBe(samplePackage.fingerprint.hash);
      expect(bundle.manifest.merkleRoot).toHaveLength(64);
      expect(bundle.bundleChecksum).toHaveLength(64);
      expect(bundle.merkleProof).toBeDefined();
      expect(bundle.merkleProof.proof.length).toBeGreaterThan(0);
      expect(bundle.manifest.anchors).toHaveLength(2);
    });

    test('returns 400 INVALID_EVIDENCE_PACKAGE when request body is missing required evidence package', async () => {
      const { req, res, next, getStatusCode, getJson } = createMockReqRes({});

      await EvidenceController.exportBundle(req, res, next);

      expect(getStatusCode()).toBe(400);
      const json = getJson();
      expect(json.success).toBe(false);
      expect(json.error.code).toBe('INVALID_EVIDENCE_PACKAGE');
    });

    test('returns 500 when bundle creation throws an internal error', async () => {
      const { req, res, next, getStatusCode, getJson } = createMockReqRes({
        evidencePackage: samplePackage
      });

      jest.spyOn(EvidenceBundleService, 'createBundle').mockImplementationOnce(() => {
        throw new Error('Simulated bundle failure');
      });

      await EvidenceController.exportBundle(req, res, next);

      expect(getStatusCode()).toBe(500);
      const json = getJson();
      expect(json.success).toBe(false);
      expect(json.error.code).toBe('BUNDLE_EXPORT_FAILED');
    });
  });

  describe('EvidenceController.verifyBundle', () => {
    test('successfully verifies an untampered exported bundle', async () => {
      const bundle = EvidenceBundleService.createBundle(samplePackage);
      const { req, res, next, getStatusCode, getJson } = createMockReqRes({ bundle });

      await EvidenceController.verifyBundle(req, res, next);

      expect(getStatusCode()).toBe(200);
      const json = getJson();
      expect(json.success).toBe(true);
      expect(json.valid).toBe(true);
      expect(json.errors).toHaveLength(0);
    });

    test('detects tampered evidence content in audit bundle', async () => {
      const bundle = EvidenceBundleService.createBundle(samplePackage);
      const tamperedBundle = JSON.parse(JSON.stringify(bundle));
      tamperedBundle.evidence.source.url = 'https://tampered-attacker-site.com/fake.jpg';

      const { req, res, next, getStatusCode, getJson } = createMockReqRes({ bundle: tamperedBundle });

      await EvidenceController.verifyBundle(req, res, next);

      expect(getStatusCode()).toBe(200);
      const json = getJson();
      expect(json.success).toBe(true);
      expect(json.valid).toBe(false);
      expect(json.errors.length).toBeGreaterThan(0);
      expect(json.errors.some((e: string) => e.includes('checksum mismatch'))).toBe(true);
    });

    test('returns 400 INVALID_BUNDLE when bundle payload is missing manifest', async () => {
      const { req, res, next, getStatusCode, getJson } = createMockReqRes({ bundle: { invalid: true } });

      await EvidenceController.verifyBundle(req, res, next);

      expect(getStatusCode()).toBe(400);
      const json = getJson();
      expect(json.success).toBe(false);
      expect(json.error.code).toBe('INVALID_BUNDLE');
    });
  });

  describe('VerificationController.verifyMerkleProof', () => {
    test('validates an authentic Merkle inclusion proof correctly', async () => {
      const tree = buildEvidenceMerkleTree(samplePackage.evidence);
      const proof = tree.getProof(0);

      const { req, res, next, getStatusCode, getJson } = createMockReqRes({ proof });

      await VerificationController.verifyMerkleProof(req, res, next);

      expect(getStatusCode()).toBe(200);
      const json = getJson();
      expect(json.success).toBe(true);
      expect(json.verified).toBe(true);
      expect(json.root).toBe(tree.getRoot());
      expect(json.leafIndex).toBe(0);
    });

    test('rejects a forged or tampered Merkle proof', async () => {
      const tree = buildEvidenceMerkleTree(samplePackage.evidence);
      const proof = tree.getProof(0);

      const tamperedProof = {
        ...proof,
        leaf: '0000000000000000000000000000000000000000000000000000000000000000'
      };

      const { req, res, next, getStatusCode, getJson } = createMockReqRes({ proof: tamperedProof });

      await VerificationController.verifyMerkleProof(req, res, next);

      expect(getStatusCode()).toBe(200);
      const json = getJson();
      expect(json.success).toBe(true);
      expect(json.verified).toBe(false);
    });

    test('returns 400 INVALID_MERKLE_PROOF when proof payload is missing essential fields', async () => {
      const { req, res, next, getStatusCode, getJson } = createMockReqRes({ proof: { root: 'not-enough' } });

      await VerificationController.verifyMerkleProof(req, res, next);

      expect(getStatusCode()).toBe(400);
      const json = getJson();
      expect(json.success).toBe(false);
      expect(json.error.code).toBe('INVALID_MERKLE_PROOF');
    });
  });
});
