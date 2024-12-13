import { StacksNetworks } from '@stacks/network';
import { z } from 'zod';

import { DefineRpcMethod, RpcRequest, RpcResponse } from '@leather.io/rpc';

import { formatValidationErrors, getRpcParamErrors, validateRpcParams } from './validation.utils';

const rpcSignStacksTransactionParamsSchema = z.object({
  stxAddress: z.string().optional(),
  txHex: z.string(),
  attachment: z.string().optional(),
  network: z.enum(StacksNetworks).optional(),
});

export function validateRpcSignStacksTransactionParams(obj: unknown) {
  return validateRpcParams(obj, rpcSignStacksTransactionParamsSchema);
}

export function getRpcSignStacksTransactionParamErrors(obj: unknown) {
  return formatValidationErrors(getRpcParamErrors(obj, rpcSignStacksTransactionParamsSchema));
}

type SignStacksTransactionRequestParams = z.infer<typeof rpcSignStacksTransactionParamsSchema>;

export type SignStacksTransactionRequest = RpcRequest<
  'stx_signTransaction',
  SignStacksTransactionRequestParams
>;

type SignStacksTransactionResponse = RpcResponse<{ txHex: string }>;

export type SignStacksTransaction = DefineRpcMethod<
  SignStacksTransactionRequest,
  SignStacksTransactionResponse
>;
