// Solana network cluster configurations and explorer URL helpers

const CLUSTERS = {
  DEVNET: 'devnet',
  TESTNET: 'testnet',
  MAINNET: 'mainnet-beta',
  LOCALNET: 'localnet',
};

const CLUSTER_ENDPOINTS = {
  [CLUSTERS.DEVNET]: 'https://api.devnet.solana.com',
  [CLUSTERS.TESTNET]: 'https://api.testnet.solana.com',
  [CLUSTERS.MAINNET]: 'https://api.mainnet-beta.solana.com',
  [CLUSTERS.LOCALNET]: 'http://127.0.0.1:8899',
};

const COMMITMENT_LEVELS = {
  PROCESSED: 'processed',
  CONFIRMED: 'confirmed',
  FINALIZED: 'finalized',
};

const EXPLORER_BASE_URL = 'https://explorer.solana.com';

/**
 * Builds a Solana explorer URL for transactions, accounts, or blocks.
 * @param {'tx' | 'address' | 'block'} type
 * @param {string} identifier
 * @param {string} [cluster='devnet']
 * @returns {string}
 */
function buildExplorerUrl(type, identifier, cluster = CLUSTERS.DEVNET) {
  if (!identifier) {
    throw new Error('Identifier is required to generate explorer URL');
  }

  const cleanIdentifier = encodeURIComponent(identifier.trim());
  let path = '';

  switch (type) {
    case 'tx':
      path = `/tx/${cleanIdentifier}`;
      break;
    case 'address':
    case 'account':
      path = `/address/${cleanIdentifier}`;
      break;
    case 'block':
      path = `/block/${cleanIdentifier}`;
      break;
    default:
      throw new Error(`Unsupported explorer URL type: ${type}`);
  }

  if (cluster === CLUSTERS.MAINNET) {
    return `${EXPLORER_BASE_URL}${path}`;
  }

  if (cluster === CLUSTERS.LOCALNET) {
    return `${EXPLORER_BASE_URL}${path}?cluster=custom&customUrl=http%3A%2F%2F127.0.0.1%3A8899`;
  }

  return `${EXPLORER_BASE_URL}${path}?cluster=${encodeURIComponent(cluster)}`;
}

module.exports = {
  CLUSTERS,
  CLUSTER_ENDPOINTS,
  COMMITMENT_LEVELS,
  EXPLORER_BASE_URL,
  buildExplorerUrl,
};
