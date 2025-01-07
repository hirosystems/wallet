import { createMoney, formatMoney, truncateMiddle } from '@leather.io/utils';

import { PsbtInput } from '@app/features/psbt-signer/hooks/use-parsed-inputs';
import { BadgeWithTooltip } from '@app/ui/components/badge/badge-with-tooltip';

import { PsbtInputOutputItemLayout } from '../../psbt-input-output-item.layout';

const hoverLabel = `Value you're approving as contribution to transaction.`;

export function PsbtInputItem({ utxo }: { utxo: PsbtInput }) {
  return (
    <PsbtInputOutputItemLayout
      address={truncateMiddle(utxo.address)}
      addressHoverLabel={utxo.address}
      amount={formatMoney(createMoney(utxo.value, 'BTC'))}
      label={
        utxo.toSign ? (
          <BadgeWithTooltip hoverLabel={hoverLabel} label="Approve" outlined />
        ) : undefined
      }
      txId={truncateMiddle(utxo.txid)}
      txIdHoverLabel={utxo.txid}
    />
  );
}
