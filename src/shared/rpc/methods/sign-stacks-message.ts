import { StacksNetworks } from '@stacks/network';
import { z } from 'zod';

import { DefineRpcMethod, RpcRequest, RpcResponse, stxMessageSigningTypes } from '@leather.io/rpc';

import { formatValidationErrors, getRpcParamErrors, validateRpcParams } from './validation.utils';

// TODO: refactor to use .discriminatedUnion
const rpcSignStacksMessageParamsSchema = z.object({
  network: z.enum(StacksNetworks).optional(),
  message: z.string(),
  domain: z.string().optional(),
  messageType: z.enum(stxMessageSigningTypes),
});

export function validateRpcSignStacksMessageParams(obj: unknown) {
  return validateRpcParams(obj, rpcSignStacksMessageParamsSchema);
}

export function getRpcSignStacksMessageParamErrors(obj: unknown) {
  return formatValidationErrors(getRpcParamErrors(obj, rpcSignStacksMessageParamsSchema));
}

type SignStacksMessageRequestParams = z.infer<typeof rpcSignStacksMessageParamsSchema>;

export type SignStacksMessageRequest = RpcRequest<
  'stx_signMessage',
  SignStacksMessageRequestParams
>;

type SignStacksMessageResponse = RpcResponse<{ signature: string }>;

export type SignStacksMessage = DefineRpcMethod<
  SignStacksMessageRequest,
  SignStacksMessageResponse
>;
