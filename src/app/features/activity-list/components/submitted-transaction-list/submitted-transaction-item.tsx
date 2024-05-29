import { StacksTransaction } from '@stacks/transactions';
import { HStack, styled } from 'leather-styles/jsx';

import { useAnalytics } from '@app/common/hooks/analytics/use-analytics';
import { useStacksExplorerLink } from '@app/common/hooks/use-stacks-explorer-link';
import { getTxSenderAddress } from '@app/common/transactions/stacks/transaction.utils';
import { TransactionTitle } from '@app/components/transaction/transaction-title';
import { ItemLayout } from '@app/ui/components/item-layout/item-layout';
import { BasicTooltip } from '@app/ui/components/tooltip/basic-tooltip';
import { Caption } from '@app/ui/components/typography/caption';
import { Pressable } from '@app/ui/pressable/pressable';

import { SubmittedTransactionIcon } from './submitted-transaction-icon';
import { getSubmittedTransactionDetails } from './submitted-transaction-list.utils';

interface SubmittedTransactionItemProps {
  transaction: StacksTransaction;
  txid: string;
}
export function SubmittedTransactionItem({ transaction, txid }: SubmittedTransactionItemProps) {
  const analytics = useAnalytics();
  const { handleOpenStacksTxLink } = useStacksExplorerLink();

  if (!transaction) return null;

  const submittedTransactionDetails = getSubmittedTransactionDetails({
    payload: transaction.payload,
    senderAddress: getTxSenderAddress(transaction),
    txid,
  });

  const openTxLink = () => {
    void analytics.track('view_transaction');
    handleOpenStacksTxLink({
      searchParams: new URLSearchParams('&submitted=true'),
      txid,
    });
  };

  if (!submittedTransactionDetails) return null;

  const { caption, title, value } = submittedTransactionDetails;

  return (
    <Pressable onClick={openTxLink} my="space.02">
      <ItemLayout
        flagImg={<SubmittedTransactionIcon transaction={transaction} />}
        titleLeft={<TransactionTitle title={title} />}
        captionLeft={
          <HStack alignItems="center">
            <Caption
              overflow="hidden"
              textOverflow="ellipsis"
              maxWidth={{ base: '160px', md: 'unset' }}
            >
              {caption}
            </Caption>
            <BasicTooltip
              asChild
              side="bottom"
              label={'Transaction broadcasted, but not yet in the mempool'}
            >
              <Caption color="yellow.action-primary-default">Submitted</Caption>
            </BasicTooltip>
          </HStack>
        }
        titleRight={<styled.span textStyle="label.02">{value}</styled.span>}
      />
    </Pressable>
  );
}
