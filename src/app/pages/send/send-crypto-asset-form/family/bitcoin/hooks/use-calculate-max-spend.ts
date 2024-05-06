import { useCallback } from 'react';

import { useAverageBitcoinFeeRates } from '@leather-wallet/query';

import { calculateMaxBitcoinSpend } from '@app/common/transactions/bitcoin/fees/calculate-max-bitcoin-spend';
import { UtxoResponseItem } from '@app/query/bitcoin/bitcoin-client';

export function useCalculateMaxBitcoinSpend() {
  const { data: feeRates } = useAverageBitcoinFeeRates();

  return useCallback(
    (address = '', utxos: UtxoResponseItem[], feeRate?: number) =>
      calculateMaxBitcoinSpend({
        address,
        utxos,
        feeRate,
        fetchedFeeRates: feeRates,
      }),
    [feeRates]
  );
}
