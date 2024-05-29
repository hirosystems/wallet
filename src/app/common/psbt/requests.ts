import type { Money } from '@leather-wallet/models';
import { isString } from '@leather-wallet/utils';
import * as btc from '@scure/btc-signer';
import { PsbtPayload } from '@stacks/connect';
import { decodeToken } from 'jsontokens';

export interface SignPsbtArgs {
  addressNativeSegwitTotal?: Money;
  addressTaprootTotal?: Money;
  fee?: Money;
  inputs: btc.TransactionInput[];
}

export function getPsbtPayloadFromToken(requestToken: string): PsbtPayload {
  const token = decodeToken(requestToken);
  if (isString(token.payload)) throw new Error('Error decoding json token');
  return token.payload as unknown as PsbtPayload;
}
