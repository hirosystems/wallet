import React from 'react';
import { Box, Button, useClipboard, Stack } from '@stacks/ui';
import { PopupContainer } from '@components/popup/container';
import { useChangeScreen } from '@common/hooks/use-change-screen';
import { RouteUrls } from '@routes/route-urls';
import { useWallet } from '@common/hooks/use-wallet';
import { Toast } from '@components/toast';
import { getAccountDisplayName } from '@stacks/wallet-sdk';
import { Caption, Title } from '@components/typography';
import { truncateMiddle } from '@stacks/ui-utils';
import { Tooltip } from '@components/tooltip';
import { QrCode } from './components/address-qr-code';
import { ReceiveTokensHeader } from './components/recieve-tokens-header';
import { useAnalytics } from '@common/hooks/analytics/use-analytics';

export const PopupReceive: React.FC = () => {
  const { currentAccount, currentAccountStxAddress } = useWallet();
  const changeScreen = useChangeScreen();
  const address = currentAccountStxAddress || '';
  const analytics = useAnalytics();
  const { onCopy, hasCopied } = useClipboard(address);
  const copyToClipboard = () => {
    void analytics.track('copy_address_to_clipboard');
    onCopy();
  };

  return (
    <PopupContainer
      header={<ReceiveTokensHeader onClose={() => changeScreen(RouteUrls.PopupHome)} />}
    >
      <Toast show={hasCopied} />
      <Box mt="extra-loose" textAlign="center" mx="auto">
        <QrCode principal={address} />
      </Box>
      <Stack spacing="base-loose" width="100%" mt="extra-loose" textAlign="center">
        {currentAccount && (
          <Title fontSize={3} lineHeight="1rem">
            {getAccountDisplayName(currentAccount)}
          </Title>
        )}
        <Box>
          <Tooltip interactive placement="bottom" label={address}>
            <Caption userSelect="none">{truncateMiddle(address, 4)}</Caption>
          </Tooltip>
        </Box>
      </Stack>
      <Box mt="auto">
        <Button width="100%" onClick={copyToClipboard} borderRadius="10px">
          Copy your address
        </Button>
      </Box>
    </PopupContainer>
  );
};
