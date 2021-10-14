import { useMemo } from 'react';
import BigNumber from 'bignumber.js';

import { validateStacksAddress } from '@common/stacks-utils';
import { useWallet } from '@common/hooks/use-wallet';
import { TransactionErrorReason } from '@pages/transaction-signing/components/transaction-error';
import { useTransactionFee } from '@pages/transaction-signing/hooks/use-transaction-fee';
import { useContractInterface } from '@query/contract/contract.hooks';
import { TransactionTypes } from '@stacks/connect';
import { useCurrentAccountAvailableStxBalance } from '@store/accounts/account.hooks';
import { useOrigin } from '@store/transactions/requests.hooks';
import {
  useTransactionBroadcastError,
  useTransactionRequestState,
  useTransactionRequestValidation,
} from '@store/transactions/requests.hooks';

export function useTransactionError() {
  const transactionRequest = useTransactionRequestState();
  const contractInterface = useContractInterface(transactionRequest);
  const fee = useTransactionFee();
  const broadcastError = useTransactionBroadcastError();
  const isValidTransaction = useTransactionRequestValidation();
  const origin = useOrigin();

  const { currentAccount } = useWallet();
  const availableStxBalance = useCurrentAccountAvailableStxBalance();

  return useMemo<TransactionErrorReason | void>(() => {
    if (origin === false) return TransactionErrorReason.ExpiredRequest;
    if (isValidTransaction === false) return TransactionErrorReason.Unauthorized;

    if (!transactionRequest || !availableStxBalance || !currentAccount) {
      return TransactionErrorReason.Generic;
    }

    if (transactionRequest.txType === TransactionTypes.ContractCall) {
      if (!validateStacksAddress(transactionRequest.contractAddress))
        return TransactionErrorReason.InvalidContractAddress;
      if (!contractInterface) return TransactionErrorReason.NoContract;
    }

    if (broadcastError) return TransactionErrorReason.BroadcastError;

    if (availableStxBalance) {
      const zeroBalance = availableStxBalance.toNumber() === 0;

      if (transactionRequest.txType === TransactionTypes.STXTransfer) {
        if (zeroBalance) return TransactionErrorReason.StxTransferInsufficientFunds;

        const transferAmount = new BigNumber(transactionRequest.amount);
        if (transferAmount.gte(availableStxBalance))
          return TransactionErrorReason.StxTransferInsufficientFunds;
      }

      if (zeroBalance && !fee.isSponsored) return TransactionErrorReason.FeeInsufficientFunds;

      if (fee && !fee.isSponsored && fee.amount) {
        const feeAmount = new BigNumber(fee.amount);
        if (feeAmount.gte(availableStxBalance)) return TransactionErrorReason.FeeInsufficientFunds;
      }
    }
    return;
  }, [
    fee,
    broadcastError,
    contractInterface,
    availableStxBalance,
    currentAccount,
    transactionRequest,
    isValidTransaction,
    origin,
  ]);
}
