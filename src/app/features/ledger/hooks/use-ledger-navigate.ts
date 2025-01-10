import { useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { bytesToHex } from '@stacks/common';
import { StacksTransaction } from '@stacks/transactions';

import type { SupportedBlockchains } from '@leather.io/models';

import { BitcoinInputSigningConfig } from '@shared/crypto/bitcoin/signer-config';
import { RouteUrls } from '@shared/route-urls';
import {
  type UnsignedMessage,
  toSerializableUnsignedMessage,
} from '@shared/signature/signature-types';

import { immediatelyAttemptLedgerConnection } from './use-when-reattempt-ledger-connection';

export function useLedgerNavigate() {
  const navigate = useNavigate();
  const location = useLocation();

  return useMemo(
    () => ({
      toConnectStepAndTryAgain() {
        return navigate(`../${RouteUrls.ConnectLedger}`, {
          replace: true,
          state: { [immediatelyAttemptLedgerConnection]: true },
        });
      },

      toConnectAndSignStacksTransactionStep(transaction: StacksTransaction) {
        return navigate(RouteUrls.ConnectLedger, {
          replace: true,
          relative: 'path',
          state: { tx: bytesToHex(transaction.serialize()) },
        });
      },

      toConnectAndSignBitcoinTransactionStep(
        psbt: Uint8Array,
        inputsToSign?: BitcoinInputSigningConfig[]
      ) {
        return navigate(RouteUrls.ConnectLedger, {
          replace: true,
          relative: 'route',
          state: {
            tx: bytesToHex(psbt),
            inputsToSign,
            backgroundLocation: { pathname: RouteUrls.Home },
          },
        });
      },

      toConnectAndSignMessageStep(message: UnsignedMessage) {
        return navigate(RouteUrls.ConnectLedger, {
          replace: true,
          // Unsigned messages may contain unserializable data, such as bigint
          state: { ...toSerializableUnsignedMessage(message) },
        });
      },

      toDeviceBusyStep(description?: string) {
        return navigate(RouteUrls.DeviceBusy, {
          replace: true,
          state: { description, backgroundLocation: { pathname: RouteUrls.Home } },
        });
      },

      toConnectionSuccessStep(chain: SupportedBlockchains) {
        return navigate(RouteUrls.ConnectLedgerSuccess, {
          replace: true,
          state: {
            chain,
            backgroundLocation: { pathname: RouteUrls.Home },
          },
        });
      },

      toErrorStep(chain: SupportedBlockchains, errorMessage?: string) {
        return navigate(RouteUrls.ConnectLedgerError, {
          replace: true,
          state: {
            latestLedgerError: errorMessage,
            chain,
            backgroundLocation: { pathname: RouteUrls.Home },
          },
        });
      },

      toAwaitingDeviceOperation({ hasApprovedOperation }: { hasApprovedOperation: boolean }) {
        return navigate(RouteUrls.AwaitingDeviceUserAction, {
          replace: true,
          state: {
            hasApprovedOperation,
            backgroundLocation: { pathname: RouteUrls.Home },
          },
        });
      },

      toPublicKeyMismatchStep() {
        return navigate(RouteUrls.LedgerPublicKeyMismatch, {
          replace: true,
          state: {
            backgroundLocation: { pathname: RouteUrls.Home },
          },
        });
      },

      toDevicePayloadInvalid() {
        return navigate(RouteUrls.LedgerDevicePayloadInvalid, {
          replace: true,
          state: {
            backgroundLocation: { pathname: RouteUrls.Home },
          },
        });
      },

      toOperationRejectedStep(description?: string) {
        return navigate(RouteUrls.LedgerOperationRejected, {
          replace: true,
          state: {
            backgroundLocation: { pathname: RouteUrls.Home },
            description,
          },
        });
      },

      toDeviceDisconnectStep() {
        return navigate(RouteUrls.LedgerDisconnected, {
          replace: true,
          state: {
            backgroundLocation: { pathname: RouteUrls.Home },
          },
        });
      },

      toBroadcastErrorStep(error: string) {
        return navigate(RouteUrls.LedgerBroadcastError, {
          replace: true,
          state: {
            backgroundLocation: { pathname: RouteUrls.Home },
            error,
          },
        });
      },

      cancelLedgerAction() {
        return navigate('..', {
          relative: 'path',
          replace: true,
          state: { ...location.state, wentBack: true },
        });
      },

      cancelLedgerActionAndReturnHome() {
        return navigate(RouteUrls.Home);
      },
    }),

    [location, navigate]
  );
}
