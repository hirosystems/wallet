import { DefineRpcMethod, RpcRequest, RpcSuccessResponse } from '@leather.io/rpc';

export type SupportedMethodsRequest = RpcRequest<'supportedMethods'>;

type SupportedMethodsResponse = RpcSuccessResponse<{
  documentation: string;
  methods: { name: string; docsUrl?: string | string[] }[];
}>;

export type SupportedMethods = DefineRpcMethod<SupportedMethodsRequest, SupportedMethodsResponse>;
