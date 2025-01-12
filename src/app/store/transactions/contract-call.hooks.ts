import { useCallback } from 'react';

import { ContractCallPayload } from '@stacks/connect';

import { useNextNonce } from '@leather.io/query';

import { StacksTransactionFormValues } from '@shared/models/form.model';

import {
  GenerateUnsignedTransactionOptions,
  generateUnsignedTransaction,
} from '@app/common/transactions/stacks/generate-unsigned-txs';

import { useCurrentStacksAccount } from '../accounts/blockchain/stacks/stacks-account.hooks';
import { useCurrentStacksNetworkState } from '../networks/networks.hooks';

export function useGenerateStacksContractCallUnsignedTx() {
  const account = useCurrentStacksAccount();

  const { data: nextNonce } = useNextNonce(account?.address ?? '');
  const network = useCurrentStacksNetworkState();

  return useCallback(
    async (payload: ContractCallPayload, values: Partial<StacksTransactionFormValues>) => {
      if (!account) return;

      const options: GenerateUnsignedTransactionOptions = {
        publicKey: account.stxPublicKey,
        nonce: Number(values?.nonce) ?? nextNonce?.nonce,
        fee: values.fee ?? 0,
        txData: { ...payload, network },
      };
      const transaction = await generateUnsignedTransaction(options);
      return { transaction, options };
    },
    [account, network, nextNonce?.nonce]
  );
}
