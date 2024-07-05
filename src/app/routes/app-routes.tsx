import {
  Navigate,
  Route,
  RouterProvider,
  createHashRouter,
  createRoutesFromElements,
} from 'react-router-dom';

import * as Sentry from '@sentry/react';

import { RouteUrls } from '@shared/route-urls';

import { LoadingSpinner } from '@app/components/loading-spinner';
import { AddNetwork } from '@app/features/add-network/add-network';
import { Container } from '@app/features/container/container';
// import { HomeLayout } from '@app/ui/pages/home.layout'; - TODO  rename this other home wrapper
import { HomeLayout } from '@app/features/container/containers/home.layout';
import { OnboardingLayout } from '@app/features/container/containers/onboarding.layout';
import { PageLayout } from '@app/features/container/containers/page.layout';
import { PopupLayout } from '@app/features/container/containers/popup.layout';
import { IncreaseBtcFeeDialog } from '@app/features/dialogs/increase-fee-dialog/increase-btc-fee-dialog';
import { IncreaseStxFeeDialog } from '@app/features/dialogs/increase-fee-dialog/increase-stx-fee-dialog';
import { leatherIntroDialogRoutes } from '@app/features/dialogs/leather-intro-dialog/leather-intro-dialog';
import { RouterErrorBoundary } from '@app/features/errors/app-error-boundary';
import { ledgerBitcoinTxSigningRoutes } from '@app/features/ledger/flows/bitcoin-tx-signing/ledger-bitcoin-sign-tx-container';
import { ledgerJwtSigningRoutes } from '@app/features/ledger/flows/jwt-signing/ledger-sign-jwt.routes';
import { requestBitcoinKeysRoutes } from '@app/features/ledger/flows/request-bitcoin-keys/ledger-request-bitcoin-keys';
import { requestStacksKeysRoutes } from '@app/features/ledger/flows/request-stacks-keys/ledger-request-stacks-keys';
import { ledgerStacksTxSigningRoutes } from '@app/features/ledger/flows/stacks-tx-signing/ledger-sign-stacks-tx-container';
import { UnsupportedBrowserLayout } from '@app/features/ledger/generic-steps';
import { ConnectLedgerStart } from '@app/features/ledger/generic-steps/connect-device/connect-ledger-start';
import { RetrieveTaprootToNativeSegwit } from '@app/features/retrieve-taproot-to-native-segwit/retrieve-taproot-to-native-segwit';
import { BitcoinContractList } from '@app/pages/bitcoin-contract-list/bitcoin-contract-list';
import { ChooseAccount } from '@app/pages/choose-account/choose-account';
import { ChooseCryptoAssetToFund } from '@app/pages/fund/choose-asset-to-fund/choose-asset-to-fund';
import { FundPage } from '@app/pages/fund/fund';
import { Home } from '@app/pages/home/home';
import { BackUpSecretKeyPage } from '@app/pages/onboarding/back-up-secret-key/back-up-secret-key';
import { SignIn } from '@app/pages/onboarding/sign-in/sign-in';
import { WelcomePage } from '@app/pages/onboarding/welcome/welcome';
import { ReceiveBtcModal } from '@app/pages/receive/receive-btc';
import { ReceiveStxModal } from '@app/pages/receive/receive-stx';
import { RequestError } from '@app/pages/request-error/request-error';
import { BroadcastError } from '@app/pages/send/broadcast-error/broadcast-error';
import { LockBitcoinSummary } from '@app/pages/send/locked-bitcoin-summary/locked-bitcoin-summary';
import { sendOrdinalRoutes } from '@app/pages/send/ordinal-inscription/ordinal-routes';
import { sendCryptoAssetFormRoutes } from '@app/pages/send/send-crypto-asset-form/send-crypto-asset-form.routes';
import { alexSwapRoutes } from '@app/pages/swap/alex-swap-container';
import { UnauthorizedRequest } from '@app/pages/unauthorized-request/unauthorized-request';
import { Unlock } from '@app/pages/unlock';
import { ViewSecretKey } from '@app/pages/view-secret-key/view-secret-key';
import { AccountGate } from '@app/routes/account-gate';
import { receiveRoutes } from '@app/routes/receive-routes';
import { legacyRequestRoutes } from '@app/routes/request-routes';
import { rpcRequestRoutes } from '@app/routes/rpc-routes';

// is the gate maybe the place to wrap instead?
import { OnboardingGate } from './onboarding-gate';

export function SuspenseLoadingSpinner() {
  return <LoadingSpinner height="600px" />;
}

export function AppRoutes() {
  const routes = useAppRoutes();
  return <RouterProvider router={routes} />;
}

const sentryCreateBrowserRouter = Sentry.wrapCreateBrowserRouter(createHashRouter);

export const homePageModalRoutes = (
  <>
    {receiveRoutes}
    {ledgerStacksTxSigningRoutes}
    {ledgerBitcoinTxSigningRoutes}
    {requestBitcoinKeysRoutes}
    {requestStacksKeysRoutes}
    {sendOrdinalRoutes}
  </>
);

function useAppRoutes() {
  return sentryCreateBrowserRouter(
    createRoutesFromElements(
      <Route>
        {/* where to pass onGoBack though? */}
        {/* PETE make a HOC to wrap these common stuff
 accept layout and children and always have error boundary + catch all

 also refactor the routes to split them up into smaller files by category
*/}
        <Route element={<Container layout={<HomeLayout />} />}>
          <Route key="error" errorElement={<RouterErrorBoundary />}>
            <Route
              path="/*"
              element={
                <AccountGate>
                  <Home />
                </AccountGate>
              }
            >
              {homePageModalRoutes}
            </Route>

            {/* Catch-all route redirects to onboarding */}
            <Route path="*" element={<Navigate replace to={RouteUrls.Onboarding} />} />
          </Route>
        </Route>
        <Route element={<Container layout={<PageLayout />} />}>
          <Route key="error" errorElement={<RouterErrorBoundary />}>
            <Route
              path={RouteUrls.RetrieveTaprootFunds}
              element={<RetrieveTaprootToNativeSegwit />}
            />
            <Route path={RouteUrls.IncreaseStxFee} element={<IncreaseStxFeeDialog />}>
              {ledgerStacksTxSigningRoutes}
            </Route>
            <Route
              path={`${RouteUrls.IncreaseStxFee}/${RouteUrls.TransactionBroadcastError}`}
              element={<BroadcastError />}
            />
            <Route path={RouteUrls.IncreaseBtcFee} element={<IncreaseBtcFeeDialog />}>
              {ledgerBitcoinTxSigningRoutes}
            </Route>

            {ledgerStacksTxSigningRoutes}

            <Route path={RouteUrls.BitcoinContractLockSuccess} element={<LockBitcoinSummary />} />
            <Route path={RouteUrls.BitcoinContractLockError} element={<BroadcastError />} />
            <Route path={RouteUrls.BitcoinContractList} element={<BitcoinContractList />} />

            <Route
              path={RouteUrls.AddNetwork}
              element={
                <AccountGate>
                  <AddNetwork />
                </AccountGate>
              }
            />
            <Route
              path={RouteUrls.ChooseAccount}
              element={
                <AccountGate>
                  <ChooseAccount />
                </AccountGate>
              }
            >
              {ledgerJwtSigningRoutes}
            </Route>
            {/* PETE seems like Fund is just a normal page. 
            nothing fancy other than the need to set onGoBack */}
            <Route
              path={RouteUrls.Fund}
              element={
                <AccountGate>
                  <FundPage />
                </AccountGate>
              }
            >
              <Route path={RouteUrls.ReceiveStx} element={<ReceiveStxModal />} />
              <Route path={RouteUrls.ReceiveBtc} element={<ReceiveBtcModal />} />
            </Route>
            <Route
              path={RouteUrls.FundChooseCurrency}
              element={
                <AccountGate>
                  <ChooseCryptoAssetToFund />
                </AccountGate>
              }
            >
              <Route path={RouteUrls.ReceiveStx} element={<ReceiveStxModal />} />
            </Route>

            {sendCryptoAssetFormRoutes}

            <Route path={RouteUrls.Unlock} element={<Unlock />}>
              {leatherIntroDialogRoutes}
            </Route>
            <Route path={RouteUrls.UnauthorizedRequest} element={<UnauthorizedRequest />} />
            <Route
              path={RouteUrls.RequestError}
              element={
                <AccountGate>
                  <RequestError />
                </AccountGate>
              }
            />

            {alexSwapRoutes}

            {/* Catch-all route redirects to onboarding */}
            <Route path="*" element={<Navigate replace to={RouteUrls.Onboarding} />} />
          </Route>
        </Route>

        <Route element={<Container layout={<OnboardingLayout />} />}>
          <Route key="error" errorElement={<RouterErrorBoundary />}>
            <Route
              path={RouteUrls.Onboarding}
              element={
                <OnboardingGate>
                  <WelcomePage />
                </OnboardingGate>
              }
            >
              <Route path={RouteUrls.ConnectLedgerStart} element={<ConnectLedgerStart />} />
              <Route
                path={RouteUrls.LedgerUnsupportedBrowser}
                element={<UnsupportedBrowserLayout />}
              />

              {requestBitcoinKeysRoutes}
              {requestStacksKeysRoutes}
            </Route>

            <Route
              path={RouteUrls.BackUpSecretKey}
              element={
                <OnboardingGate>
                  <BackUpSecretKeyPage />
                </OnboardingGate>
              }
            />
            <Route
              path={RouteUrls.SetPassword}
              lazy={async () => {
                const { SetPasswordRoute } = await import(
                  '@app/pages/onboarding/set-password/set-password'
                );
                return { Component: SetPasswordRoute };
              }}
            />

            <Route
              path={RouteUrls.SignIn}
              element={
                <OnboardingGate>
                  <SignIn />
                </OnboardingGate>
              }
            />

            <Route
              path={RouteUrls.ViewSecretKey}
              element={
                <AccountGate>
                  <ViewSecretKey />
                </AccountGate>
              }
            />

            {/* Catch-all route redirects to onboarding */}
            <Route path="*" element={<Navigate replace to={RouteUrls.Onboarding} />} />
          </Route>
        </Route>

        <Route element={<Container layout={<PopupLayout />} />}>
          {legacyRequestRoutes}
          {rpcRequestRoutes}
        </Route>
      </Route>
    )
  );
}
