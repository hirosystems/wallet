import { DefineRpcMethod, RpcRequest, RpcResponse } from '@leather.io/rpc';

export type OpenRequest = RpcRequest<'open'>;

type OpenResponse = RpcResponse<{ message: string }>;

export type Open = DefineRpcMethod<OpenRequest, OpenResponse>;
