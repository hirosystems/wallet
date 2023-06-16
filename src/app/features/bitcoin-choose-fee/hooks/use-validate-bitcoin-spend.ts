import { useState } from 'react';

import { Money, createMoney } from '@shared/models/money.model';

import { sumMoney } from '@app/common/money/calculate-money';
import { useCurrentNativeSegwitAddressBalance } from '@app/query/bitcoin/balance/bitcoin-balances.query';

export function useValidateBitcoinSpend(amount?: Money) {
  const [showInsufficientBalanceError, setShowInsufficientBalanceError] = useState(false);
  const balance = useCurrentNativeSegwitAddressBalance();

  return {
    showInsufficientBalanceError,
    onValidateBitcoinFeeSpend(feeValue: number) {
      const feeAsMoney = createMoney(feeValue, 'BTC');

      if (feeAsMoney.amount.isGreaterThan(balance.amount)) {
        setShowInsufficientBalanceError(true);
        return false;
      }
      return true;
    },
    onValidateBitcoinAmountSpend(feeValue: number) {
      const feeAsMoney = createMoney(feeValue, 'BTC');

      if (!amount) {
        throw new Error('Amount should be defined to validate total spend');
      }

      const totalSpend = sumMoney([amount, feeAsMoney]);
      if (totalSpend.amount.isGreaterThan(balance.amount)) {
        setShowInsufficientBalanceError(true);
        return false;
      }

      return true;
    },
  };
}
