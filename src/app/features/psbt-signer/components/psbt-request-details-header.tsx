import { HStack, styled } from 'leather-styles/jsx';

import { LockIcon, UnlockIcon } from '@leather.io/ui';

import { usePsbtSignerContext } from '@app/features/psbt-signer/psbt-signer.context';
import { BadgeWithTooltip } from '@app/ui/components/badge/badge-with-tooltip';

const immutableLabel =
  'Any modification to the transaction, including the fee amount or other inputs/outputs, will invalidate the signature.';
const uncertainLabel =
  'The transaction details can be altered by other participants. This means the final outcome of the transaction might be different than initially agreed upon.';

export function PsbtRequestDetailsHeader() {
  const { isPsbtMutable } = usePsbtSignerContext();

  return (
    <HStack alignItems="center" gap="space.02">
      <styled.h2 textStyle="heading.05">Transaction</styled.h2>
      <BadgeWithTooltip
        hoverLabel={isPsbtMutable ? uncertainLabel : immutableLabel}
        icon={isPsbtMutable ? <UnlockIcon variant="small" /> : <LockIcon variant="small" />}
        label={isPsbtMutable ? 'Uncertain' : 'Certain'}
        variant={isPsbtMutable ? 'warning' : 'default'}
        outlined
      />
    </HStack>
  );
}
