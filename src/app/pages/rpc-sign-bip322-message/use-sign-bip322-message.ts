import { useMemo, useState } from 'react';

import * as btc from '@scure/btc-signer';
import * as bitcoin from 'bitcoinjs-lib';

import { signBip322MessageSimple } from '@leather.io/bitcoin';
import { PaymentTypes, RpcErrorCode } from '@leather.io/rpc';

import { logger } from '@shared/logger';
import { makeRpcErrorResponse, makeRpcSuccessResponse } from '@shared/rpc/rpc-methods';
import { closeWindow, createDelay } from '@shared/utils';
import { analytics } from '@shared/utils/analytics';

import { useDefaultRequestParams } from '@app/common/hooks/use-default-request-search-params';
import { initialSearchParams } from '@app/common/initial-search-params';
import { useToast } from '@app/features/toasts/use-toast';
import { useSignBitcoinTx } from '@app/store/accounts/blockchain/bitcoin/bitcoin.hooks';
import {
  useCurrentAccountNativeSegwitSigner,
  useCurrentNativeSegwitAccount,
} from '@app/store/accounts/blockchain/bitcoin/native-segwit-account.hooks';
import {
  useCurrentAccountTaprootSigner,
  useCurrentTaprootAccount,
} from '@app/store/accounts/blockchain/bitcoin/taproot-account.hooks';
import { useCurrentNetwork } from '@app/store/networks/networks.selectors';

function useRpcSignBitcoinMessage() {
  const defaultParams = useDefaultRequestParams();
  return useMemo(
    () => ({
      ...defaultParams,
      requestId: initialSearchParams.get('requestId') ?? '',
      message: initialSearchParams.get('message') ?? '',
      paymentType: (initialSearchParams.get('paymentType') ?? 'p2wpkh') as Extract<
        'p2tr' | 'p2wpkh',
        PaymentTypes
      >,
    }),
    [defaultParams]
  );
}

const shortPauseBeforeToast = createDelay(250);
const allowTimeForUserToReadToast = createDelay(1200);

interface SignBip322MessageFactoryArgs {
  address: string;
  signPsbt(a: bitcoin.Psbt): Promise<btc.Transaction>;
}
function useSignBip322MessageFactory({ address, signPsbt }: SignBip322MessageFactoryArgs) {
  const network = useCurrentNetwork();

  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();

  const { tabId, origin, requestId, message } = useRpcSignBitcoinMessage();

  return {
    origin,
    message,
    isLoading,
    formattedOrigin: new URL(origin ?? '').host,
    address,
    onUserRejectBip322MessageSigningRequest() {
      if (!tabId) return;
      chrome.tabs.sendMessage(
        tabId,
        makeRpcErrorResponse('signMessage', {
          id: requestId,
          error: {
            code: RpcErrorCode.USER_REJECTION,
            message: 'User rejected message signing request',
          },
        })
      );
      closeWindow();
    },
    async onUserApproveBip322MessageSigningRequest() {
      setIsLoading(true);

      if (!tabId || !origin) {
        logger.error('Cannot give app accounts: missing tabId, origin');
        return;
      }

      const { signature } = await signBip322MessageSimple({
        message,
        address,
        signPsbt,
        network: network.chain.bitcoin.mode,
      });

      await shortPauseBeforeToast();
      toast.success('Message signed successfully');

      chrome.tabs.sendMessage(
        tabId,
        makeRpcSuccessResponse('signMessage', {
          id: requestId,
          result: { signature, address, message },
        })
      );

      void analytics.track('user_approved_message_signing', { origin });

      await allowTimeForUserToReadToast();
      closeWindow();
    },
  };
}

function useSignBip322MessageTaproot() {
  const createTaprootSigner = useCurrentAccountTaprootSigner();
  if (!createTaprootSigner) throw new Error('No taproot signer for current account');
  const currentTaprootAccount = useCurrentTaprootAccount();
  if (!currentTaprootAccount) throw new Error('No keychain for current account');
  const sign = useSignBitcoinTx();
  const signer = createTaprootSigner(0);

  async function signPsbt(psbt: bitcoin.Psbt) {
    psbt.data.inputs.forEach(
      input => (input.tapInternalKey = Buffer.from(signer.payment.tapInternalKey))
    );
    return sign(psbt.toBuffer());
  }

  return useSignBip322MessageFactory({ address: signer.payment.address ?? '', signPsbt });
}

function useSignBip322MessageNativeSegwit() {
  const createNativeSegwitSigner = useCurrentAccountNativeSegwitSigner();
  if (!createNativeSegwitSigner) throw new Error('No native segwit signer for current account');

  const currentNativeSegwitAccount = useCurrentNativeSegwitAccount();
  if (!currentNativeSegwitAccount) throw new Error('No keychain for current account');
  const sign = useSignBitcoinTx();

  const signer = createNativeSegwitSigner(0);

  async function signPsbt(psbt: bitcoin.Psbt) {
    return sign(psbt.toBuffer());
  }

  return useSignBip322MessageFactory({
    address: signer.payment.address ?? '',
    signPsbt,
  });
}

export function useSignBip322Message() {
  const { paymentType } = useRpcSignBitcoinMessage();

  const taprootMsgSigner = useSignBip322MessageTaproot();
  const nativeSegwitMsgSigner = useSignBip322MessageNativeSegwit();

  switch (paymentType) {
    case 'p2tr':
      return taprootMsgSigner;
    case 'p2wpkh':
      return nativeSegwitMsgSigner;
  }
}
