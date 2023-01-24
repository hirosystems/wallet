import { useMemo } from 'react';

import { StacksTransaction, TokenTransferPayload, addressToString } from '@stacks/transactions';
import { truncateMiddle } from '@stacks/ui-utils';

import { useConvertCryptoCurrencyToFiatAmount } from '@app/common/hooks/use-convert-to-fiat-amount';
import { convertAmountToBaseUnit } from '@app/common/money/calculate-money';
import { TransactionFee } from '@app/components/fee-row/components/transaction-fee';

import { ConfirmationDetail } from '../_components/confirmation/components/confirmation-detail';
import { ConfirmationDetailsLayout } from '../_components/confirmation/components/confirmation-details.layout';
import { convertToMoneyTypeWithDefaultOfZero } from '../_components/confirmation/send-form-confirmation.utils';

interface StxSendFormConfirmationDetailsProps {
  unsignedTx: StacksTransaction;
}
export function StxSendFormConfirmationDetails(props: StxSendFormConfirmationDetailsProps) {
  const { unsignedTx } = props;

  const convertFeeToUsd = useConvertCryptoCurrencyToFiatAmount('STX');
  const payload = unsignedTx.payload as TokenTransferPayload;

  const amount = convertToMoneyTypeWithDefaultOfZero('STX', Number(payload.amount));
  const fee = convertToMoneyTypeWithDefaultOfZero(
    'STX',
    Number(unsignedTx.auth.spendingCondition.fee)
  );
  const recipient = truncateMiddle(addressToString(payload.recipient.address), 4);

  const feeInUsd = useMemo(() => convertFeeToUsd(fee), [convertFeeToUsd, fee]);

  return (
    <ConfirmationDetailsLayout amount={amount}>
      <ConfirmationDetail detail="Token" value="Stacks" />
      <ConfirmationDetail detail="To" value={recipient} />
      <ConfirmationDetail detail="Memo" value={payload.memo.content ?? 'No memo'} />
      <ConfirmationDetail
        detail="Fee"
        value={
          <TransactionFee fee={convertAmountToBaseUnit(fee).toString()} usdAmount={feeInUsd} />
        }
      />
      <ConfirmationDetail detail="Nonce" value={String(unsignedTx.auth.spendingCondition.nonce)} />
    </ConfirmationDetailsLayout>
  );
}
