import { useState } from 'react';
import { useLocation } from 'react-router-dom';

import { ChainID } from '@stacks/transactions';
import { OnboardingSelectors } from '@tests/selectors/onboarding.selectors';
import { Box, Flex } from 'leather-styles/jsx';

import { Flag, Logo, NetworkModeBadge } from '@leather.io/ui';

import { RouteUrls } from '@shared/route-urls';

import { CurrentAccountAvatar } from '@app/features/current-account/current-account-avatar';
import { CurrentAccountName } from '@app/features/current-account/current-account-name';
import { useCurrentNetworkState } from '@app/store/networks/networks.hooks';

import { TotalBalance } from '../total-balance';
import { Header } from './headers/header';

function isNoHeaderPopup(pathname: RouteUrls) {
  return pathname === RouteUrls.RpcGetAddresses || pathname === RouteUrls.ChooseAccount;
}

function showAccountInfo(pathname: RouteUrls) {
  switch (pathname) {
    case RouteUrls.TransactionRequest:
    case RouteUrls.ProfileUpdateRequest:
    case RouteUrls.RpcSendTransfer:
      return true;
    default:
      return false;
  }
}

function showBalanceInfo(pathname: RouteUrls) {
  switch (pathname) {
    case RouteUrls.ProfileUpdateRequest:
    case RouteUrls.RpcSendTransfer:
      return true;
    case RouteUrls.TransactionRequest:
    default:
      return false;
  }
}

function getDisplayAddresssBalanceOf(pathname: RouteUrls) {
  //  TODO it's unclear when to show ALL or STX balance here
  switch (pathname) {
    case RouteUrls.TransactionRequest:
    case RouteUrls.ProfileUpdateRequest:
    case RouteUrls.RpcSendTransfer:
      return 'all';
    default:
      return 'stx';
  }
}

interface PopupLayoutProps {
  children?: React.JSX.Element | React.JSX.Element[];
}
export function PopupLayout({ children }: PopupLayoutProps) {
  const [isShowingSwitchAccount, setIsShowingSwitchAccount] = useState(false);
  // const navigate = useNavigate();
  const { pathname: locationPathname } = useLocation();
  const pathname = locationPathname as RouteUrls;

  const { chain, name: chainName } = useCurrentNetworkState();

  const displayHeader = !isNoHeaderPopup(pathname);

  // this should probably never be clickable in popups ?
  // const isLogoClickable = !isRpcRoute(pathname);
  return (
    <Flex
      data-testid="main-container"
      flexDirection="column"
      flexGrow={1}
      width="100%"
      height={{ base: '100vh', sm: '100%' }}
    >
      {displayHeader && (
        <Header
          networkBadge={
            <NetworkModeBadge
              isTestnetChain={chain.stacks.chainId === ChainID.Testnet}
              name={chainName}
            />
          }
          logo={
            //  PETE check this and improve - why no logo here, can't rememebr
            pathname !== RouteUrls.RpcGetAddresses && (
              <Box height="headerPopupHeight" margin="auto" px="space.02">
                <Logo
                  data-testid={OnboardingSelectors.LogoRouteToHome}
                  // onClick={isLogoClickable ? () => navigate(RouteUrls.Home) : undefined}
                />
              </Box>
            )
          }
          account={
            showAccountInfo(pathname) && (
              <Flag
                align="middle"
                img={
                  <CurrentAccountAvatar
                    toggleSwitchAccount={() => setIsShowingSwitchAccount(!isShowingSwitchAccount)}
                  />
                }
              >
                <CurrentAccountName />
              </Flag>
            )
          }
          totalBalance={
            showBalanceInfo(pathname) && (
              <TotalBalance displayAddresssBalanceOf={getDisplayAddresssBalanceOf(pathname)} />
            )
          }
        />
      )}
      <Flex className="main-content" flexGrow={1} position="relative" width="100%">
        {children}
      </Flex>
    </Flex>
  );
}
