import { z } from 'zod';

import { PaymentTypes } from '@leather.io/rpc';

import { defaultNetworkIdSchema } from '../rpc-schemas';
import {
  accountSchema,
  formatValidationErrors,
  getRpcParamErrors,
  validateRpcParams,
} from './validation.utils';

const rpcSignMessageParamsSchema = z.object({
  type: z.enum(['bip322']).optional(),
  account: accountSchema.optional(),
  message: z.string(),
  network: defaultNetworkIdSchema.optional(),
  paymentType: z.enum(['p2tr', 'p2wpkh'] as [PaymentTypes, PaymentTypes]).optional(),
});

export function validateRpcSignMessageParams(obj: unknown) {
  return validateRpcParams(obj, rpcSignMessageParamsSchema);
}

export function getRpcSignMessageParamErrors(obj: unknown) {
  return formatValidationErrors(getRpcParamErrors(obj, rpcSignMessageParamsSchema));
}
