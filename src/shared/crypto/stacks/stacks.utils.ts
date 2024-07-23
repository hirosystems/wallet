import { ChainID } from '@stacks/transactions';

import type { NetworkModes } from '@leather.io/models';

export const stxDerivationWithAccount = `m/44'/5757'/{account}'/0/0`;
const stxIdentityDerivationWithAccount = `m/888'/0'/{account}'`;

function getAccountIndexFromDerivationPathFactory(derivationPath: string) {
  return (account: number) => derivationPath.replace('{account}', account.toString());
}

export const getStxDerivationPath =
  getAccountIndexFromDerivationPathFactory(stxDerivationWithAccount);

export const getIdentityDerivationPath = getAccountIndexFromDerivationPathFactory(
  stxIdentityDerivationWithAccount
);

export function stacksChainIdToCoreNetworkMode(chainId: ChainID): NetworkModes {
  return whenStacksChainId(chainId)({
    [ChainID.Mainnet]: 'mainnet',
    [ChainID.Testnet]: 'testnet',
  });
}

interface WhenStacksChainIdMap<T> {
  [ChainID.Mainnet]: T;
  [ChainID.Testnet]: T;
}
export function whenStacksChainId(chainId: ChainID) {
  return <T>(chainIdMap: WhenStacksChainIdMap<T>): T => chainIdMap[chainId];
}
