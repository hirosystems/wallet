import { bytesToHex } from '@stacks/common';
import { TransactionTypes } from '@stacks/connect';
import {
  AddressHashMode,
  AuthType,
  MultiSigHashMode,
  PayloadType,
  PostCondition,
  StacksTransaction,
  VersionedSmartContractPayload,
  addressToString,
  cvToValue,
  deserializeTransaction,
  serializeCV,
  serializePostCondition,
} from '@stacks/transactions';
import { createUnsecuredToken } from 'jsontokens';

import { RpcErrorCode } from '@leather.io/rpc';
import { isDefined, isUndefined } from '@leather.io/utils';

import { RouteUrls } from '@shared/route-urls';
import {
  SignStacksTransactionRequest,
  getRpcSignStacksTransactionParamErrors,
  validateRpcSignStacksTransactionParams,
} from '@shared/rpc/methods/sign-stacks-transaction';
import { makeRpcErrorResponse } from '@shared/rpc/rpc-methods';

import {
  RequestParams,
  getTabIdFromPort,
  listenForPopupClose,
  makeSearchParamsWithDefaults,
  triggerRequestWindowOpen,
} from '../messaging-utils';
import { trackRpcRequestError, trackRpcRequestSuccess } from '../rpc-message-handler';

const MEMO_DESERIALIZATION_STUB = '\u0000';

const cleanMemoString = (memo: string): string => {
  return memo.replaceAll(MEMO_DESERIALIZATION_STUB, '');
};

function encodePostConditions(postConditions: PostCondition[]) {
  return postConditions.map(pc => bytesToHex(serializePostCondition(pc)));
}

const transactionPayloadToTransactionRequest = (
  stacksTransaction: StacksTransaction,
  stxAddress?: string,
  attachment?: string
) => {
  const transactionRequest = {
    attachment,
    stxAddress,
    sponsored: stacksTransaction.auth.authType === AuthType.Sponsored,
    nonce: Number(stacksTransaction.auth.spendingCondition.nonce),
    fee: Number(stacksTransaction.auth.spendingCondition.fee),
    postConditions: encodePostConditions(stacksTransaction.postConditions.values as any[]),
    postConditionMode: stacksTransaction.postConditionMode,
    anchorMode: stacksTransaction.anchorMode,
  } as any;

  switch (stacksTransaction.payload.payloadType) {
    case PayloadType.TokenTransfer:
      transactionRequest.txType = TransactionTypes.STXTransfer;
      transactionRequest.recipient = cvToValue(stacksTransaction.payload.recipient, true);
      transactionRequest.amount = stacksTransaction.payload.amount.toString();
      transactionRequest.memo = cleanMemoString(stacksTransaction.payload.memo.content);
      break;
    case PayloadType.ContractCall:
      transactionRequest.txType = TransactionTypes.ContractCall;
      transactionRequest.contractName = stacksTransaction.payload.contractName.content;
      transactionRequest.contractAddress = addressToString(
        stacksTransaction.payload.contractAddress
      );
      transactionRequest.functionArgs = stacksTransaction.payload.functionArgs.map(arg =>
        Buffer.from(serializeCV(arg)).toString('hex')
      );
      transactionRequest.functionName = stacksTransaction.payload.functionName.content;
      break;
    case PayloadType.SmartContract:
    case PayloadType.VersionedSmartContract:
      transactionRequest.txType = TransactionTypes.ContractDeploy;
      transactionRequest.contractName = stacksTransaction.payload.contractName.content;
      transactionRequest.codeBody = stacksTransaction.payload.codeBody.content;
      transactionRequest.clarityVersion = (
        stacksTransaction.payload as VersionedSmartContractPayload
      ).clarityVersion;
      break;
    default:
      throw new Error('Unsupported tx type');
  }

  return transactionRequest;
};

function validateStacksTransaction(txHex: string) {
  try {
    deserializeTransaction(txHex);
    return true;
  } catch (e) {
    return false;
  }
}

export async function rpcSignStacksTransaction(
  message: SignStacksTransactionRequest,
  port: chrome.runtime.Port
) {
  if (isUndefined(message.params)) {
    void trackRpcRequestError({ endpoint: message.method, error: 'Undefined parameters' });
    chrome.tabs.sendMessage(
      getTabIdFromPort(port),
      makeRpcErrorResponse('stx_signTransaction', {
        id: message.id,
        error: { code: RpcErrorCode.INVALID_REQUEST, message: 'Parameters undefined' },
      })
    );
    return;
  }

  if (!validateRpcSignStacksTransactionParams(message.params)) {
    void trackRpcRequestError({ endpoint: message.method, error: 'Invalid parameters' });

    chrome.tabs.sendMessage(
      getTabIdFromPort(port),
      makeRpcErrorResponse('stx_signTransaction', {
        id: message.id,
        error: {
          code: RpcErrorCode.INVALID_PARAMS,
          message: getRpcSignStacksTransactionParamErrors(message.params),
        },
      })
    );
    return;
  }

  if (!validateStacksTransaction(message.params.txHex!)) {
    void trackRpcRequestError({ endpoint: message.method, error: 'Invalid Stacks transaction' });

    chrome.tabs.sendMessage(
      getTabIdFromPort(port),
      makeRpcErrorResponse('stx_signTransaction', {
        id: message.id,
        error: { code: RpcErrorCode.INVALID_PARAMS, message: 'Invalid Stacks transaction hex' },
      })
    );
    return;
  }

  const stacksTransaction = deserializeTransaction(message.params.txHex!);
  const request = transactionPayloadToTransactionRequest(
    stacksTransaction,
    message.params.stxAddress,
    message.params.attachment
  );

  const hashMode = stacksTransaction.auth.spendingCondition.hashMode as MultiSigHashMode;
  const isMultisig =
    hashMode === AddressHashMode.SerializeP2SH || hashMode === AddressHashMode.SerializeP2WSH;

  void trackRpcRequestSuccess({ endpoint: message.method });

  const requestParams = [
    ['txHex', message.params.txHex],
    ['requestId', message.id],
    ['request', createUnsecuredToken(request)],
    ['isMultisig', isMultisig],
  ] as RequestParams;

  if (isDefined(message.params.network)) {
    requestParams.push(['network', message.params.network]);
  }

  const { urlParams, tabId } = makeSearchParamsWithDefaults(port, requestParams);

  const { id } = await triggerRequestWindowOpen(RouteUrls.RpcSignStacksTransaction, urlParams);

  listenForPopupClose({
    tabId,
    id,
    response: makeRpcErrorResponse('stx_signTransaction', {
      id: message.id,
      error: {
        code: RpcErrorCode.USER_REJECTION,
        message: 'User rejected the Stacks transaction signing request',
      },
    }),
  });
}
