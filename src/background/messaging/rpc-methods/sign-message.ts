import { isSupportedMessageSigningPaymentType } from '@leather.io/bitcoin';
import { PaymentTypes, RpcErrorCode, type SignMessageRequest } from '@leather.io/rpc';
import { isDefined, isUndefined } from '@leather.io/utils';

import { RouteUrls } from '@shared/route-urls';
import {
  getRpcSignMessageParamErrors,
  validateRpcSignMessageParams,
} from '@shared/rpc/methods/sign-message';
import { makeRpcErrorResponse } from '@shared/rpc/rpc-methods';

import {
  RequestParams,
  getTabIdFromPort,
  listenForPopupClose,
  makeSearchParamsWithDefaults,
  triggerRequestWindowOpen,
} from '../messaging-utils';
import { trackRpcRequestError, trackRpcRequestSuccess } from '../rpc-message-handler';

export async function rpcSignMessage(message: SignMessageRequest, port: chrome.runtime.Port) {
  if (isUndefined(message.params)) {
    void trackRpcRequestError({ endpoint: 'signMessage', error: 'Undefined parameters' });
    chrome.tabs.sendMessage(
      getTabIdFromPort(port),
      makeRpcErrorResponse('signMessage', {
        id: message.id,
        error: { code: RpcErrorCode.INVALID_REQUEST, message: 'Parameters undefined' },
      })
    );
    return;
  }

  if (!validateRpcSignMessageParams(message.params)) {
    void trackRpcRequestError({ endpoint: 'signMessage', error: 'Invalid parameters' });

    chrome.tabs.sendMessage(
      getTabIdFromPort(port),
      makeRpcErrorResponse('signMessage', {
        id: message.id,
        error: {
          code: RpcErrorCode.INVALID_PARAMS,
          message: getRpcSignMessageParamErrors(message.params),
        },
      })
    );
    return;
  }

  const paymentType: Extract<'p2tr' | 'p2wpkh', PaymentTypes> =
    (message.params as any).paymentType ?? 'p2wpkh';

  if (!isSupportedMessageSigningPaymentType(paymentType)) {
    void trackRpcRequestError({ endpoint: 'signMessage', error: 'Unsupported payment type' });

    chrome.tabs.sendMessage(
      getTabIdFromPort(port),
      makeRpcErrorResponse('signMessage', {
        id: message.id,
        error: {
          code: RpcErrorCode.INVALID_PARAMS,
          message:
            'Unsupported payment type. Leather only supports signing messages for Native Segwit (p2wpkh) and Taproot (p2tr) addresses.',
        },
      })
    );
    return;
  }

  void trackRpcRequestSuccess({ endpoint: message.method });

  const requestParams: RequestParams = [
    ['message', message.params.message],
    ['network', (message.params as any).network ?? 'mainnet'],
    ['paymentType', paymentType],
    ['requestId', message.id],
  ];

  if (isDefined((message.params as any).account)) {
    requestParams.push(['accountIndex', (message.params as any).account.toString()]);
  }

  const { urlParams, tabId } = makeSearchParamsWithDefaults(port, requestParams);
  const { id } = await triggerRequestWindowOpen(RouteUrls.RpcSignBip322Message, urlParams);

  listenForPopupClose({
    tabId,
    id,
    response: makeRpcErrorResponse('signMessage', {
      id: message.id,
      error: {
        code: RpcErrorCode.USER_REJECTION,
        message: 'User rejected the message signature',
      },
    }),
  });
}
