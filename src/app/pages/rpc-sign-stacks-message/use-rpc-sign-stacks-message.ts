import { useMemo } from 'react';

import { StacksNetwork } from '@stacks/network';
import { deserializeCV } from '@stacks/transactions';

import { RpcErrorCode } from '@leather.io/rpc';

import { makeRpcErrorResponse, makeRpcSuccessResponse } from '@shared/rpc/rpc-methods';
import {
  isSignableMessageType,
  isStructuredMessageType,
  isUtf8MessageType,
} from '@shared/signature/signature-types';
import { closeWindow } from '@shared/utils';
import { analytics } from '@shared/utils/analytics';

import { useDefaultRequestParams } from '@app/common/hooks/use-default-request-search-params';
import { initialSearchParams } from '@app/common/initial-search-params';
import {
  StructuredPayload,
  Utf8Payload,
} from '@app/features/stacks-message-signer/stacks-message-signing';
import { useSignStacksMessage } from '@app/features/stacks-message-signer/use-sign-stacks-message';

function getNetwork(networkName: string | null) {
  if (
    networkName === 'mainnet' ||
    networkName === 'testnet' ||
    networkName === 'devnet' ||
    networkName === 'mocknet'
  ) {
    return StacksNetwork.fromName(networkName);
  }
  return;
}

export function useRpcStacksMessagePayload() {
  const { messageType, message, network, appName, domain } = useRpcSignStacksMessageParams();

  if (isUtf8MessageType(messageType)) {
    return {
      messageType: 'utf8' as const,
      message,
      network: getNetwork(network),
      appName,
    } satisfies Utf8Payload;
  }
  if (isStructuredMessageType(messageType)) {
    if (!domain) return null;

    return {
      messageType: 'structured' as const,
      message: deserializeCV(Buffer.from(message, 'hex')),
      domain: deserializeCV(Buffer.from(domain, 'hex')),
      network: getNetwork(network),
      appName,
    } satisfies StructuredPayload;
  }
  return null;
}

export function useRpcSignStacksMessageParams() {
  const { origin, tabId } = useDefaultRequestParams();
  const requestId = initialSearchParams.get('requestId');
  const network = initialSearchParams.get('network');
  const appName = initialSearchParams.get('appName');
  const message = initialSearchParams.get('message');
  const messageType = initialSearchParams.get('messageType');
  const domain = initialSearchParams.get('domain');

  if (!requestId || !message || !origin || !isSignableMessageType(messageType))
    throw new Error('Missing required parameters for Stacks signing message request');

  return useMemo(
    () => ({
      origin,
      tabId: tabId ?? 0,
      requestId,
      network,
      message,
      messageType,
      appName,
      domain,
    }),
    [origin, requestId, network, message, messageType, tabId, appName, domain]
  );
}

export function useRpcSignStacksMessage() {
  const { tabId, requestId } = useRpcSignStacksMessageParams();
  if (!tabId) throw new Error('Requests can only be made with corresponding tab');

  const { isLoading, signMessage } = useSignStacksMessage({
    onSignMessageCompleted(messageSignature) {
      chrome.tabs.sendMessage(
        tabId,
        makeRpcSuccessResponse('stx_signMessage', {
          id: requestId,
          result: { signature: messageSignature.signature },
        })
      );
      closeWindow();
    },
    onSignMessageCancelled: onCancelMessageSigning,
  });

  function onCancelMessageSigning() {
    if (!requestId || !tabId) return;
    void analytics.track('request_signature_cancel');
    chrome.tabs.sendMessage(
      tabId,
      makeRpcErrorResponse('stx_signMessage', {
        id: requestId,
        error: {
          message: 'User denied signing',
          code: RpcErrorCode.USER_REJECTION,
        },
      })
    );
    closeWindow();
  }

  return { isLoading, signMessage, onCancelMessageSigning };
}
