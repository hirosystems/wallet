import { RpcErrorCode, type RpcRequest, type SendTransferRequestParams } from '@leather.io/rpc';
import { isUndefined } from '@leather.io/utils';

import { RouteUrls } from '@shared/route-urls';
import {
  type RpcSendTransferParams,
  type RpcSendTransferParamsLegacy,
  convertRpcSendTransferLegacyParamsToNew,
  defaultRpcSendTransferNetwork,
  getRpcSendTransferParamErrors,
  validateRpcSendTransferLegacyParams,
  validateRpcSendTransferParams,
} from '@shared/rpc/methods/send-transfer';
import { makeRpcErrorResponse } from '@shared/rpc/rpc-methods';

import {
  RequestParams,
  getTabIdFromPort,
  listenForPopupClose,
  makeSearchParamsWithDefaults,
  triggerRequestWindowOpen,
} from '../messaging-utils';
import { trackRpcRequestError, trackRpcRequestSuccess } from '../rpc-message-handler';

export async function rpcSendTransfer(
  message: RpcRequest<'sendTransfer', RpcSendTransferParams | SendTransferRequestParams>,
  port: chrome.runtime.Port
) {
  if (isUndefined(message.params)) {
    void trackRpcRequestError({ endpoint: 'sendTransfer', error: 'Undefined parameters' });

    chrome.tabs.sendMessage(
      getTabIdFromPort(port),
      makeRpcErrorResponse('sendTransfer', {
        id: message.id,
        error: { code: RpcErrorCode.INVALID_REQUEST, message: 'Parameters undefined' },
      })
    );
    return;
  }

  // Legacy params support for backward compatibility
  const params = validateRpcSendTransferLegacyParams(message.params)
    ? convertRpcSendTransferLegacyParamsToNew(message.params as RpcSendTransferParamsLegacy)
    : (message.params as RpcSendTransferParams);

  if (!validateRpcSendTransferParams(params)) {
    void trackRpcRequestError({ endpoint: 'sendTransfer', error: 'Invalid parameters' });

    chrome.tabs.sendMessage(
      getTabIdFromPort(port),
      makeRpcErrorResponse('sendTransfer', {
        id: message.id,
        error: {
          code: RpcErrorCode.INVALID_PARAMS,
          message: getRpcSendTransferParamErrors(params),
        },
      })
    );
    return;
  }

  void trackRpcRequestSuccess({ endpoint: message.method });

  const recipients: [string, string][] = params.recipients.map(({ address }) => [
    'recipient',
    address,
  ]);
  const amounts: [string, string][] = params.recipients.map(({ amount }) => ['amount', amount]);

  const requestParams: RequestParams = [
    ...recipients,
    ...amounts,
    ['network', params.network ?? defaultRpcSendTransferNetwork],
    ['requestId', message.id],
  ];

  if (params.account) {
    requestParams.push(['accountIndex', params.account.toString()]);
  }

  const { urlParams, tabId } = makeSearchParamsWithDefaults(port, requestParams);

  const { id } = await triggerRequestWindowOpen(RouteUrls.RpcSendTransfer, urlParams);

  listenForPopupClose({
    tabId,
    id,
    response: makeRpcErrorResponse('sendTransfer', {
      id: message.id,
      error: {
        code: RpcErrorCode.USER_REJECTION,
        message: 'User rejected signing the transaction',
      },
    }),
  });
}
