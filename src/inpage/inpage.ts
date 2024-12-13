import type { StacksProvider } from '@stacks/connect';

import { RpcRequest } from '@leather.io/rpc';

import { BRANCH, COMMIT_SHA } from '@shared/environment';
import {
  AuthenticationRequestEventDetails,
  DomEventName,
  ProfileUpdateRequestEventDetails,
  PsbtRequestEventDetails,
  SignatureRequestEventDetails,
  TransactionRequestEventDetails,
} from '@shared/inpage-types';
import {
  AuthenticationResponseMessage,
  ExternalMethods,
  LegacyMessageToContentScript,
  MESSAGE_SOURCE,
  ProfileUpdateResponseMessage,
  PsbtResponseMessage,
  SignatureResponseMessage,
  TransactionResponseMessage,
} from '@shared/message-types';
import type { WalletMethodMap, WalletMethodNames, WalletResponses } from '@shared/rpc/rpc-methods';

import { addLeatherToProviders } from './add-leather-to-providers';

type CallableMethods = keyof typeof ExternalMethods;

addLeatherToProviders();

interface ExtensionResponse {
  source: 'blockstack-extension';
  method: CallableMethods;
  [key: string]: any;
}

async function callAndReceive(
  methodName: CallableMethods | 'getURL',
  opts: any = {}
): Promise<ExtensionResponse> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject('Unable to get response from Blockstack extension');
    }, 1000);
    const waitForResponse = (event: MessageEvent) => {
      if (
        event.data.source === 'blockstack-extension' &&
        event.data.method === `${methodName}Response`
      ) {
        clearTimeout(timeout);
        window.removeEventListener('message', waitForResponse);
        resolve(event.data);
      }
    };
    window.addEventListener('message', waitForResponse);
    window.postMessage(
      {
        method: methodName,
        source: 'blockstack-app',
        ...opts,
      },
      window.location.origin
    );
  });
}

function isValidEvent(event: MessageEvent, method: LegacyMessageToContentScript['method']) {
  const { data } = event;
  const correctSource = data.source === MESSAGE_SOURCE;
  const correctMethod = data.method === method;
  return correctSource && correctMethod && !!data.payload;
}

interface LeatherProviderOverrides extends StacksProvider {
  isLeather: true;
}

const provider: LeatherProviderOverrides = {
  isLeather: true,

  getURL: async () => {
    const { url } = await callAndReceive('getURL');
    return url;
  },

  structuredDataSignatureRequest: async signatureRequest => {
    const event = new CustomEvent<SignatureRequestEventDetails>(
      DomEventName.structuredDataSignatureRequest,
      {
        detail: { signatureRequest },
      }
    );
    document.dispatchEvent(event);
    return new Promise((resolve, reject) => {
      const handleMessage = (event: MessageEvent<SignatureResponseMessage>) => {
        if (!isValidEvent(event, ExternalMethods.signatureResponse)) return;
        if (event.data.payload?.signatureRequest !== signatureRequest) return;
        window.removeEventListener('message', handleMessage);
        if (event.data.payload.signatureResponse === 'cancel') {
          reject(event.data.payload.signatureResponse);
          return;
        }
        if (typeof event.data.payload.signatureResponse !== 'string') {
          resolve(event.data.payload.signatureResponse);
        }
      };
      window.addEventListener('message', handleMessage);
    });
  },

  signatureRequest: async signatureRequest => {
    const event = new CustomEvent<SignatureRequestEventDetails>(DomEventName.signatureRequest, {
      detail: { signatureRequest },
    });
    document.dispatchEvent(event);
    return new Promise((resolve, reject) => {
      const handleMessage = (event: MessageEvent<SignatureResponseMessage>) => {
        if (!isValidEvent(event, ExternalMethods.signatureResponse)) return;
        if (event.data.payload?.signatureRequest !== signatureRequest) return;
        window.removeEventListener('message', handleMessage);
        if (event.data.payload.signatureResponse === 'cancel') {
          reject(event.data.payload.signatureResponse);
          return;
        }
        if (typeof event.data.payload.signatureResponse !== 'string') {
          resolve(event.data.payload.signatureResponse);
        }
      };
      window.addEventListener('message', handleMessage);
    });
  },

  authenticationRequest: async authenticationRequest => {
    // eslint-disable-next-line no-console
    console.warn(`
        WARNING: Legacy Leather request detected

        Leather now uses an RPC-style API, that can be used directly, 
        rather than through libraries such as Stacks Connect. For example,
        to get a user's addresses, you should use the 
        LeatherProvider.request('getAddresses') method.

        See our docs for more information https://leather.gitbook.io/
      `);
    const event = new CustomEvent<AuthenticationRequestEventDetails>(
      DomEventName.authenticationRequest,
      {
        detail: { authenticationRequest },
      }
    );
    document.dispatchEvent(event);
    return new Promise((resolve, reject) => {
      const handleMessage = (event: MessageEvent<AuthenticationResponseMessage>) => {
        if (!isValidEvent(event, ExternalMethods.authenticationResponse)) return;
        if (event.data.payload?.authenticationRequest !== authenticationRequest) return;
        window.removeEventListener('message', handleMessage);
        if (event.data.payload.authenticationResponse === 'cancel') {
          reject(event.data.payload.authenticationResponse);
          return;
        }
        resolve(event.data.payload.authenticationResponse);
      };
      window.addEventListener('message', handleMessage);
    });
  },

  transactionRequest: async transactionRequest => {
    const event = new CustomEvent<TransactionRequestEventDetails>(DomEventName.transactionRequest, {
      detail: { transactionRequest },
    });
    document.dispatchEvent(event);
    return new Promise((resolve, reject) => {
      const handleMessage = (event: MessageEvent<TransactionResponseMessage>) => {
        if (!isValidEvent(event, ExternalMethods.transactionResponse)) return;
        if (event.data.payload?.transactionRequest !== transactionRequest) return;
        window.removeEventListener('message', handleMessage);
        if (event.data.payload.transactionResponse === 'cancel') {
          reject(event.data.payload.transactionResponse);
          return;
        }
        if (typeof event.data.payload.transactionResponse !== 'string') {
          resolve(event.data.payload.transactionResponse);
        }
      };
      window.addEventListener('message', handleMessage);
    });
  },
  psbtRequest: async psbtRequest => {
    const event = new CustomEvent<PsbtRequestEventDetails>(DomEventName.psbtRequest, {
      detail: { psbtRequest },
    });
    document.dispatchEvent(event);
    return new Promise((resolve, reject) => {
      const handleMessage = (event: MessageEvent<PsbtResponseMessage>) => {
        if (!isValidEvent(event, ExternalMethods.psbtResponse)) return;
        if (event.data.payload?.psbtRequest !== psbtRequest) return;
        window.removeEventListener('message', handleMessage);
        if (event.data.payload.psbtResponse === 'cancel') {
          reject(event.data.payload.psbtResponse);
          return;
        }
        if (typeof event.data.payload.psbtResponse !== 'string') {
          resolve(event.data.payload.psbtResponse);
        }
      };
      window.addEventListener('message', handleMessage);
    });
  },
  profileUpdateRequest: async profileUpdateRequest => {
    const event = new CustomEvent<ProfileUpdateRequestEventDetails>(
      DomEventName.profileUpdateRequest,
      {
        detail: { profileUpdateRequest },
      }
    );
    document.dispatchEvent(event);
    return new Promise((resolve, reject) => {
      const handleMessage = (event: MessageEvent<ProfileUpdateResponseMessage>) => {
        if (!isValidEvent(event, ExternalMethods.profileUpdateResponse)) return;
        if (event.data.payload?.profileUpdateRequest !== profileUpdateRequest) return;
        window.removeEventListener('message', handleMessage);
        if (event.data.payload.profileUpdateResponse === 'cancel') {
          reject(event.data.payload.profileUpdateResponse);
          return;
        }
        if (typeof event.data.payload.profileUpdateResponse !== 'string') {
          resolve(event.data.payload.profileUpdateResponse);
        }
      };
      window.addEventListener('message', handleMessage);
    });
  },

  getProductInfo() {
    return {
      version: VERSION,
      name: 'Leather',
      meta: {
        tag: BRANCH,
        commit: COMMIT_SHA,
      },
    };
  },

  request<T extends WalletMethodNames>(
    method: T,
    params?: Record<string, any>
  ): Promise<WalletMethodMap[T]['response']> {
    const id = crypto.randomUUID();
    const rpcRequest: RpcRequest<T> = {
      jsonrpc: '2.0',
      id,
      method,
      params,
    };
    document.dispatchEvent(new CustomEvent(DomEventName.request, { detail: rpcRequest }));
    return new Promise((resolve, reject) => {
      function handleMessage(event: MessageEvent<WalletResponses>) {
        const response = event.data;
        if (response.id !== id) return;
        window.removeEventListener('message', handleMessage);
        if ('error' in response) return reject(response);
        return resolve(response);
      }
      window.addEventListener('message', handleMessage);
    });
  },
};

function consoleDeprecationNotice(text: string) {
  // eslint-disable-next-line no-console
  console.warn(`Deprecation warning: ${text}`);
}

function warnAboutDeprecatedProvider(legacyProvider: object) {
  return Object.fromEntries(
    Object.entries(legacyProvider).map(([key, value]) => {
      if (typeof value === 'function') {
        return [
          key,
          (...args: any[]) => {
            switch (key) {
              case 'authenticationRequest':
                consoleDeprecationNotice(
                  `Use LeatherProvider.request('getAddresses') instead, see docs https://leather.gitbook.io/developers/bitcoin/connect-users/get-addresses`
                );
                break;
              case 'psbtRequest':
                consoleDeprecationNotice(
                  `Use LeatherProvider.request('signPsbt') instead, see docs https://leather.gitbook.io/developers/bitcoin/sign-transactions/partially-signed-bitcoin-transactions-psbts`
                );
                break;
              case 'structuredDataSignatureRequest':
              case 'signatureRequest':
                consoleDeprecationNotice(`Use LeatherProvider.request('stx_signMessage') instead`);
                break;
              default:
                consoleDeprecationNotice(
                  'The provider object is deprecated. Use `LeatherProvider` instead'
                );
            }

            return value(...args);
          },
        ];
      }
      return [key, value];
    })
  );
}

try {
  // Makes properties immutable to contend with other wallets that use agressive
  // "prioritisation" default settings. As other wallet's use this approach,
  // Leather has to use it too, so that the browsers' own internal logic being
  // used to determine content script exeuction order. A more fair way to
  // contend over shared provider space. `StacksProvider` should be considered
  // deprecated and each wallet use their own provider namespace.
  Object.defineProperty(window, 'StacksProvider', {
    get: () => warnAboutDeprecatedProvider(provider),
    set: () => {},
  });
} catch (e) {}

try {
  Object.defineProperty(window, 'HiroWalletProvider', {
    get: () => warnAboutDeprecatedProvider(provider),
    set: () => {},
  });
} catch (e) {}

try {
  Object.defineProperty(window, 'LeatherProvider', { get: () => provider, set: () => {} });
} catch (e) {
  // eslint-disable-next-line no-console
  console.warn('Unable to set LeatherProvider');
}

// Legacy product provider objects
if (typeof (window as any).btc === 'undefined') {
  (window as any).btc = warnAboutDeprecatedProvider(provider);
}
