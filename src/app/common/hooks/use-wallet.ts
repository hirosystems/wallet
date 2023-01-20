import { useCallback } from 'react';

import { finalizeAuthResponse } from '@shared/actions/finalize-auth-response';

import { useKeyActions } from '@app/common/hooks/use-key-actions';
import { bytesToText } from '@app/common/store-utils';
import {
  useCurrentAccount,
  useCurrentAccountIndex,
  useCurrentAccountStxAddressState,
  useTransactionNetworkVersion,
} from '@app/store/accounts/account.hooks';
import { useCurrentNetworkState } from '@app/store/networks/networks.hooks';
import {
  useEncryptedSecretKeyState,
  useFinishSignInCallback,
  useSecretKey,
  useStacksWalletState,
} from '@app/store/wallet/wallet.hooks';

import { useOnboardingState } from './auth/use-onboarding-state';
import { useDefaultRequestParams } from './use-default-request-search-params';

export function useWallet() {
  const wallet = useStacksWalletState();
  const secretKey = useSecretKey();
  const encryptedSecretKey = useEncryptedSecretKeyState();
  const currentAccountIndex = useCurrentAccountIndex();
  const currentAccount = useCurrentAccount();
  const currentAccountStxAddress = useCurrentAccountStxAddressState();
  const transactionVersion = useTransactionNetworkVersion();
  const currentNetwork = useCurrentNetworkState();
  const keyActions = useKeyActions();
  const { origin, tabId } = useDefaultRequestParams();

  const { decodedAuthRequest, authRequest } = useOnboardingState();

  const hasGeneratedWallet = !!currentAccount;

  const cancelAuthentication = useCallback(() => {
    if (!decodedAuthRequest || !authRequest || !origin || !tabId) {
      return;
    }
    const authResponse = 'cancel';
    finalizeAuthResponse({
      decodedAuthRequest,
      authRequest,
      authResponse,
      requestingOrigin: origin,
      tabId,
    });
  }, [decodedAuthRequest, authRequest, origin, tabId]);

  const finishSignIn = useFinishSignInCallback();

  return {
    wallet,
    secretKey: secretKey ? bytesToText(secretKey) : undefined,
    hasGeneratedWallet,
    currentAccount,
    currentAccountIndex,
    currentAccountStxAddress,
    transactionVersion,
    currentNetwork,
    encryptedSecretKey,
    finishSignIn,
    cancelAuthentication,
    ...keyActions,
  };
}
