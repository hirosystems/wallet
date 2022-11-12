import { useMemo } from 'react';

import type { AllTransferableCryptoAssetBalances } from '@shared/models/crypto-asset-balance.model';

import { useBitcoinCryptoCurrencyAssetBalance } from '@app/query/bitcoin/address/address.hooks';
import {
  useStacksCryptoCurrencyAssetBalance,
  useTransferableStacksFungibleTokenAssetBalances,
} from '@app/query/stacks/balance/crypto-asset-balances.hooks';
import {
  useCurrentAccount,
  useCurrentAccountBtcAddressState,
} from '@app/store/accounts/account.hooks';

export function useAllTransferableCryptoAssetBalances(): AllTransferableCryptoAssetBalances[] {
  const account = useCurrentAccount();
  const currentAccountBtcAddress = useCurrentAccountBtcAddressState();
  const btcCryptoCurrencyAssetBalance =
    useBitcoinCryptoCurrencyAssetBalance(currentAccountBtcAddress);
  const stxCryptoCurrencyAssetBalance = useStacksCryptoCurrencyAssetBalance(account?.address ?? '');
  const stacksFtAssetBalances = useTransferableStacksFungibleTokenAssetBalances(
    account?.address ?? ''
  );

  return useMemo(
    () => [btcCryptoCurrencyAssetBalance, stxCryptoCurrencyAssetBalance, ...stacksFtAssetBalances],
    [btcCryptoCurrencyAssetBalance, stacksFtAssetBalances, stxCryptoCurrencyAssetBalance]
  );
}

export function useTransferableCryptoAssetBalance(currencySymbol: string) {
  const allBalances = useAllTransferableCryptoAssetBalances();
  return allBalances.find(balance => balance.asset.symbol === currencySymbol);
}
