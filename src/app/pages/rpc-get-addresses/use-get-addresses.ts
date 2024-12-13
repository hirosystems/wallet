import { bytesToHex } from '@stacks/common';

import { ecdsaPublicKeyToSchnorr } from '@leather.io/bitcoin';
import { BtcAddress } from '@leather.io/rpc';

import { logger } from '@shared/logger';
import { makeRpcSuccessResponse } from '@shared/rpc/rpc-methods';
import { analytics } from '@shared/utils/analytics';

import { focusTabAndWindow } from '@app/common/focus-tab';
import { useRpcRequestParams } from '@app/common/rpc-helpers';
import { useCurrentAccountNativeSegwitSigner } from '@app/store/accounts/blockchain/bitcoin/native-segwit-account.hooks';
import { useCurrentAccountTaprootSigner } from '@app/store/accounts/blockchain/bitcoin/taproot-account.hooks';
import { useCurrentStacksAccount } from '@app/store/accounts/blockchain/stacks/stacks-account.hooks';
import { useAppPermissions } from '@app/store/app-permissions/app-permissions.slice';

export function useGetAddresses() {
  const permissions = useAppPermissions();
  const { tabId, origin, requestId } = useRpcRequestParams();

  const createNativeSegwitSigner = useCurrentAccountNativeSegwitSigner();
  const createTaprootSigner = useCurrentAccountTaprootSigner();
  const stacksAccount = useCurrentStacksAccount();

  function focusInitatingTab() {
    void analytics.track('user_clicked_requested_by_link', { endpoint: 'getAddresses' });
    focusTabAndWindow(tabId);
  }

  return {
    origin,
    focusInitatingTab,
    onUserApproveGetAddresses() {
      if (!tabId || !origin) {
        logger.error('Cannot give app accounts: missing tabId, origin');
        return;
      }

      void analytics.track('user_approved_get_addresses', { origin });

      permissions.hasRequestedAccounts(origin);

      const keysToIncludeInResponse = [];

      if (createNativeSegwitSigner) {
        const nativeSegwitSigner = createNativeSegwitSigner(0);

        const nativeSegwitAddressResponse: BtcAddress = {
          symbol: 'BTC',
          type: 'p2wpkh',
          address: nativeSegwitSigner.address,
          publicKey: bytesToHex(nativeSegwitSigner.publicKey),
          derivationPath: nativeSegwitSigner.derivationPath,
        };

        keysToIncludeInResponse.push(nativeSegwitAddressResponse);
      }

      if (createTaprootSigner) {
        const taprootSigner = createTaprootSigner(0);
        const taprootAddressResponse: BtcAddress = {
          symbol: 'BTC',
          type: 'p2tr',
          address: taprootSigner.address,
          publicKey: bytesToHex(taprootSigner.publicKey),
          tweakedPublicKey: bytesToHex(ecdsaPublicKeyToSchnorr(taprootSigner.publicKey)),
          derivationPath: taprootSigner.derivationPath,
        };
        keysToIncludeInResponse.push(taprootAddressResponse);
      }

      if (stacksAccount) {
        const stacksAddressResponse = {
          symbol: 'STX',
          address: stacksAccount.address ?? '',
          publicKey: stacksAccount.stxPublicKey ?? '',
        };

        keysToIncludeInResponse.push(stacksAddressResponse);
      }

      chrome.tabs.sendMessage(
        tabId,
        makeRpcSuccessResponse('getAddresses', {
          id: requestId,
          result: { addresses: keysToIncludeInResponse as any },
        })
      );
    },
  };
}
