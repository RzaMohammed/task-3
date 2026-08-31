import { ParsedEvidenceMemo } from './blockchain.types';
import { AppError } from '../../utils/errors';

export class BlockchainParser {
  /**
   * Parses and validates on-chain memo string: FBV|1.0|<evidenceId>|SHA-256|<hash>
   */
  public static parseEvidenceMemo(rawMemo: string): ParsedEvidenceMemo {
    if (!rawMemo || typeof rawMemo !== 'string') {
      throw new AppError(400, 'INVALID_BLOCKCHAIN_RECORD', 'Transaction does not contain a readable memo payload.');
    }

    const trimmed = rawMemo.trim();
    const parts = trimmed.split('|');

    if (parts.length !== 5) {
      throw new AppError(
        400,
        'INVALID_BLOCKCHAIN_RECORD',
        `Invalid on-chain memo structure. Expected 5 fields ('FBV|version|evidenceId|algorithm|hash'), got: ${trimmed}`
      );
    }

    const [type, version, evidenceId, algorithm, hash] = parts;

    if (type !== 'FBV') {
      throw new AppError(400, 'INVALID_BLOCKCHAIN_RECORD', `Unrecognized memo type: '${type}'. Expected 'FBV'.`);
    }

    if (!version || version.length === 0) {
      throw new AppError(400, 'INVALID_BLOCKCHAIN_RECORD', 'Missing version in on-chain memo.');
    }

    if (!evidenceId || !evidenceId.startsWith('ev_')) {
      throw new AppError(400, 'INVALID_BLOCKCHAIN_RECORD', `Invalid evidenceId in on-chain memo: '${evidenceId}'. Expected 'ev_...'`);
    }

    if (algorithm !== 'SHA-256') {
      throw new AppError(400, 'INVALID_BLOCKCHAIN_RECORD', `Unsupported hashing algorithm: '${algorithm}'. Expected 'SHA-256'.`);
    }

    if (!hash || hash.length !== 64 || !/^[0-9a-f]{64}$/i.test(hash)) {
      throw new AppError(400, 'INVALID_BLOCKCHAIN_RECORD', `Invalid SHA-256 hash in on-chain memo: '${hash}'. Expected 64 hex characters.`);
    }

    return {
      type: 'FBV',
      version,
      evidenceId,
      algorithm: 'SHA-256',
      hash: hash.toLowerCase(),
      rawMemo: trimmed
    };
  }
}
