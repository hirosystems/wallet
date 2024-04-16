import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

import BigNumber from 'bignumber.js';

import { createMoney } from '@shared/models/money.model';
import { RouteUrls } from '@shared/route-urls';

import { useDefaultRequestParams } from '@app/common/hooks/use-default-request-search-params';
import { useOnMount } from '@app/common/hooks/use-on-mount';
import { initialSearchParams } from '@app/common/initial-search-params';
import { sumNumbers } from '@app/common/math/helpers';
import { useCurrentNativeSegwitUtxos } from '@app/query/bitcoin/address/utxos-by-address.hooks';

export function useRpcSendTransferRequestParams() {
  const defaultParams = useDefaultRequestParams();
  return useMemo(
    () => ({
      ...defaultParams,
      requestId: initialSearchParams.get('requestId') ?? '',
      recipientsAddresses: initialSearchParams.getAll('recipient') ?? [],
      amounts: initialSearchParams.getAll('amount') ?? [],
    }),
    [defaultParams]
  );
}

export function useRpcSendTransfer() {
  const navigate = useNavigate();
  const { origin, recipientsAddresses, amounts } = useRpcSendTransferRequestParams();
  const { data: utxos = [], refetch } = useCurrentNativeSegwitUtxos();
  const totalAmount = sumNumbers(amounts.map(Number));
  const amountAsMoney = createMoney(new BigNumber(totalAmount), 'BTC');

  // Forcing a refetch to ensure UTXOs are fresh
  useOnMount(() => refetch());

  if (!origin) throw new Error('Invalid params');

  const recipients = recipientsAddresses.map((address, index) => ({
    address,
    amount: amounts[index],
  }));

  return {
    recipients,
    origin,
    utxos,
    totalAmount,
    amountAsMoney,
    recipientsAddresses,
    async onChooseTransferFee() {
      navigate(RouteUrls.RpcSendTransferChooseFee, {
        state: { recipients, utxos, amountAsMoney },
      });
    },
  };
}
