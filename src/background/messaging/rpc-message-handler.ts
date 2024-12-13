import { RpcErrorCode } from '@leather.io/rpc';

import { WalletRequests, makeRpcErrorResponse } from '@shared/rpc/rpc-methods';

import { queueAnalyticsRequest } from '@background/background-analytics';
import { rpcSignStacksTransaction } from '@background/messaging/rpc-methods/sign-stacks-transaction';

import { getTabIdFromPort, listenForOriginTabClose } from './messaging-utils';
import { rpcGetAddresses } from './rpc-methods/get-addresses';
import { rpcOpen } from './rpc-methods/open';
import { rpcSendTransfer } from './rpc-methods/send-transfer';
import { rpcSignMessage } from './rpc-methods/sign-message';
import { rpcSignPsbt } from './rpc-methods/sign-psbt';
import { rpcSignStacksMessage } from './rpc-methods/sign-stacks-message';
import { rpcSupportedMethods } from './rpc-methods/supported-methods';

export async function rpcMessageHandler(message: WalletRequests, port: chrome.runtime.Port) {
  listenForOriginTabClose({ tabId: port.sender?.tab?.id });

  switch (message.method) {
    case 'open': {
      await rpcOpen(message, port);
      break;
    }
    case 'getAddresses': {
      await rpcGetAddresses(message, port);
      break;
    }

    case 'signMessage': {
      await rpcSignMessage(message, port);
      break;
    }

    case 'sendTransfer': {
      await rpcSendTransfer(message, port);
      break;
    }

    case 'signPsbt': {
      await rpcSignPsbt(message, port);
      break;
    }

    case 'stx_signTransaction': {
      await rpcSignStacksTransaction(message, port);
      break;
    }

    case 'supportedMethods': {
      rpcSupportedMethods(message, port);
      break;
    }

    case 'stx_signMessage': {
      await rpcSignStacksMessage(message, port);
      break;
    }

    default:
      chrome.tabs.sendMessage(
        getTabIdFromPort(port),
        makeRpcErrorResponse('' as any, {
          id: message.id,
          error: {
            code: RpcErrorCode.METHOD_NOT_FOUND,
            message: `"${message.method}" is not supported. Try running \`.request('supportedMethods')\` to see what Leather can do, or check out our developer documentation at https://leather.gitbook.io/developers/home/welcome`,
          },
        })
      );
      break;
  }
}

interface TrackRpcRequestSuccess {
  endpoint: WalletRequests['method'];
}
export async function trackRpcRequestSuccess(args: TrackRpcRequestSuccess) {
  return queueAnalyticsRequest('rpc_request_successful', { ...args });
}

interface TrackRpcRequestError {
  endpoint: WalletRequests['method'];
  error: string;
}
export async function trackRpcRequestError(args: TrackRpcRequestError) {
  return queueAnalyticsRequest('rpc_request_error', { ...args });
}
