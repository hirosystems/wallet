import { HStack, Stack, styled } from 'leather-styles/jsx';

import type { RpcSendTransferRecipient } from '@shared/rpc/methods/send-transfer';

import { truncateMiddle } from '@app/ui/utils/truncate-middle';

interface SendTransferDetailsProps {
  recipients: RpcSendTransferRecipient[];
  currentAddress: string;
}

export function SendTransferDetails({ recipients, currentAddress }: SendTransferDetailsProps) {
  return (
    <Stack width="100%">
      {recipients.map(({ address, amount }, index) => (
        <Stack
          key={address + index}
          border="active"
          borderRadius="sm"
          gap="space.04"
          p="space.05"
          width="100%"
        >
          <HStack alignItems="center" gap="space.04" justifyContent="space-between">
            <styled.span textStyle="caption.01">From</styled.span>
            <styled.span textStyle="label.01">{truncateMiddle(currentAddress)}</styled.span>
          </HStack>
          <HStack alignItems="center" gap="space.04" justifyContent="space-between">
            <styled.span textStyle="caption.01">To</styled.span>
            <styled.span textStyle="label.01">{truncateMiddle(address)}</styled.span>
          </HStack>
          <HStack alignItems="center" gap="space.04" justifyContent="space-between">
            <styled.span textStyle="caption.01">Amount</styled.span>
            <styled.span textStyle="label.01">{amount}</styled.span>
          </HStack>
        </Stack>
      ))}
    </Stack>
  );
}
