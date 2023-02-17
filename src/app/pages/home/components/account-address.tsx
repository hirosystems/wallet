import { FiCopy } from 'react-icons/fi';

import { Box, Button, Text, useClipboard } from '@stacks/ui';
import { color, truncateMiddle } from '@stacks/ui-utils';
import { UserAreaSelectors } from '@tests-legacy/integration/user-area.selectors';

import { useAnalytics } from '@app/common/hooks/analytics/use-analytics';
import { Tooltip } from '@app/components/tooltip';

interface AccountAddressProps {
  address: string;
  label: string;
}
export function AccountAddress({ address, label }: AccountAddressProps) {
  const { onCopy, hasCopied } = useClipboard(address);
  const analytics = useAnalytics();

  const copyToClipboard = () => {
    void analytics.track('copy_address_to_clipboard');
    onCopy();
  };

  return (
    <>
      <Tooltip hideOnClick={false} label={hasCopied ? 'Copied!' : label} placement="right">
        <Button onClick={copyToClipboard}>
          <Text color={color('text-caption')} fontSize={['12px', '14px']}>
            {truncateMiddle(address, 4)}
          </Text>
          <Box
            _hover={{ cursor: 'pointer' }}
            size="12px"
            color={color('text-caption')}
            data-testid={UserAreaSelectors.AccountCopyAddress}
            as={FiCopy}
          />
        </Button>
      </Tooltip>
    </>
  );
}
