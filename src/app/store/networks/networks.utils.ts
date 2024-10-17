import { ChainID } from '@stacks/transactions';

import {
  BITCOIN_API_BASE_URL_MAINNET,
  BITCOIN_API_BASE_URL_TESTNET3,
  type NetworkConfiguration,
  bitcoinNetworkToNetworkMode,
} from '@leather.io/models';

import { PersistedNetworkConfiguration } from './networks.slice';

interface FindMatchingNetworkKeyArgs {
  coreApiUrl: string | null;
  networkChainId: string | null;
  networks: Record<string, NetworkConfiguration>;
}
export function findMatchingNetworkKey({
  coreApiUrl,
  networkChainId,
  networks,
}: FindMatchingNetworkKeyArgs) {
  if (!networks || (!coreApiUrl && !networkChainId)) return;

  const keys = Object.keys(networks);

  const exactUrlMatch = keys.find((key: string) => {
    const network = networks[key];
    return network.chain.stacks.url === coreApiUrl;
  });
  if (exactUrlMatch) return exactUrlMatch;

  const chainIdMatch = keys.find((key: string) => {
    const network = networks[key];
    return (
      network.chain.stacks.url === coreApiUrl ||
      network.chain.stacks.chainId === (Number(networkChainId) as ChainID)
    );
  });
  if (chainIdMatch) return chainIdMatch;

  return null;
}

function checkBitcoinNetworkProperties(
  network: PersistedNetworkConfiguration
): PersistedNetworkConfiguration {
  if (!network.bitcoinNetwork || !network.bitcoinUrl) {
    const bitcoinNetwork = network.chainId === ChainID.Mainnet ? 'mainnet' : 'testnet3';
    return {
      id: network.id,
      name: network.name,
      chainId: network.chainId,
      subnetChainId: network.subnetChainId,
      url: network.url,
      bitcoinNetwork,
      mode: bitcoinNetworkToNetworkMode(bitcoinNetwork),
      bitcoinUrl:
        network.chainId === ChainID.Mainnet
          ? BITCOIN_API_BASE_URL_MAINNET
          : BITCOIN_API_BASE_URL_TESTNET3,
    };
  } else {
    return network;
  }
}

export function transformNetworkStateToMultichainStucture(
  state: Record<string, PersistedNetworkConfiguration>
) {
  return Object.fromEntries(
    Object.entries(state)
      .map(([key, network]) => {
        if (!network) return ['', null];
        const { id, name, chainId, subnetChainId, url, bitcoinNetwork, bitcoinUrl } =
          checkBitcoinNetworkProperties(network);

        return [
          key,
          {
            id,
            name,
            chain: {
              stacks: {
                blockchain: 'stacks',
                url: url,
                chainId,
                subnetChainId,
              },
              bitcoin: {
                blockchain: 'bitcoin',
                bitcoinNetwork: bitcoinNetwork ?? 'testnet',
                mode: bitcoinNetworkToNetworkMode(bitcoinNetwork ?? 'testnet'),
                bitcoinUrl: bitcoinUrl ?? BITCOIN_API_BASE_URL_TESTNET3,
              },
            },
          },
        ];
      })
      .filter(([_, value]) => value !== null)
  ) as Record<string, NetworkConfiguration>;
}
