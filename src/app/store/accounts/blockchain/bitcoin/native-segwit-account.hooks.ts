import { useMemo } from 'react';
import { useSelector } from 'react-redux';

import { PaymentTypes } from '@btckit/types';
import { createSelector } from '@reduxjs/toolkit';
import * as btc from '@scure/btc-signer';
import { Psbt } from 'bitcoinjs-lib';
import AppClient from 'ledger-bitcoin';

import { getBitcoinJsLibNetworkConfigByMode } from '@shared/crypto/bitcoin/bitcoin.network';
import {
  bitcoinNetworkModeToCoreNetworkMode,
  deriveAddressIndexZeroFromAccount,
  getInputPaymentType,
  lookUpLedgerKeysByPath,
} from '@shared/crypto/bitcoin/bitcoin.utils';
import { getTaprootAccountDerivationPath } from '@shared/crypto/bitcoin/p2tr-address-gen';
import {
  deriveNativeSegwitAccountFromRootKeychain,
  getNativeSegWitPaymentFromAddressIndex,
  getNativeSegwitAccountDerivationPath,
} from '@shared/crypto/bitcoin/p2wpkh-address-gen';
import { logger } from '@shared/logger';
import { makeNumberRange, reverseBytes } from '@shared/utils';

import { mnemonicToRootNode } from '@app/common/keychain/keychain';
import {
  addSignatureToPsbt,
  createNativeSegwitDefaultWalletPolicy,
  createTaprootDefaultWalletPolicy,
} from '@app/features/ledger/utils/bitcoin-ledger-utils';
import { useBitcoinClient } from '@app/store/common/api-clients.hooks';
import { selectCurrentAccountIndex } from '@app/store/keys/key.selectors';
import { selectCurrentNetwork, useCurrentNetwork } from '@app/store/networks/networks.selectors';

import { useCurrentAccountIndex } from '../../account';
import {
  bitcoinAccountBuilderFactory,
  useBitcoinExtendedPublicKeyVersions,
} from './bitcoin-keychain';
import {
  bitcoinAddressIndexSignerFactory,
  useMakeBitcoinNetworkSignersForPaymentType,
} from './bitcoin-signer';

const selectNativeSegwitAccountBuilder = bitcoinAccountBuilderFactory(
  deriveNativeSegwitAccountFromRootKeychain,
  lookUpLedgerKeysByPath(getNativeSegwitAccountDerivationPath)
);

const selectCurrentNetworkNativeSegwitAccountBuilder = createSelector(
  selectNativeSegwitAccountBuilder,
  selectCurrentNetwork,
  (nativeSegwitKeychain, network) =>
    nativeSegwitKeychain[bitcoinNetworkModeToCoreNetworkMode(network.chain.bitcoin.network)]
);

export function useNativeSegwitAccountBuilder() {
  return useSelector(selectCurrentNetworkNativeSegwitAccountBuilder);
}

const selectCurrentNativeSegwitAccount = createSelector(
  selectCurrentNetworkNativeSegwitAccountBuilder,
  selectCurrentAccountIndex,
  (generateAccount, accountIndex) => generateAccount(accountIndex)
);

export function useCurrentNativeSegwitAccount() {
  return useSelector(selectCurrentNativeSegwitAccount);
}

export function useNativeSegwitNetworkSigners() {
  const { mainnet: mainnetKeychain, testnet: testnetKeychain } = useSelector(
    selectNativeSegwitAccountBuilder
  );

  return useMakeBitcoinNetworkSignersForPaymentType(
    mainnetKeychain,
    testnetKeychain,
    getNativeSegWitPaymentFromAddressIndex
  );
}

function useNativeSegwitSigner(accountIndex: number) {
  const account = useNativeSegwitAccountBuilder()(accountIndex);
  const extendedPublicKeyVersions = useBitcoinExtendedPublicKeyVersions();

  return useMemo(() => {
    if (!account) return;
    return bitcoinAddressIndexSignerFactory({
      accountIndex,
      accountKeychain: account.keychain,
      paymentFn: getNativeSegWitPaymentFromAddressIndex,
      network: account.network,
      extendedPublicKeyVersions,
    });
  }, [account, accountIndex, extendedPublicKeyVersions]);
}

export function useCurrentAccountNativeSegwitSigner() {
  const currentAccountIndex = useCurrentAccountIndex();
  return useNativeSegwitSigner(currentAccountIndex);
}

export function useCurrentAccountNativeSegwitIndexZeroSigner() {
  const signer = useCurrentAccountNativeSegwitSigner();
  return useMemo(() => {
    if (!signer) throw new Error('No signer');
    return signer(0);
  }, [signer]);
}

/**
 * @deprecated Use signer.address instead
 */
export function useCurrentAccountNativeSegwitAddressIndexZero() {
  const signer = useCurrentAccountNativeSegwitSigner();
  return useMemo(() => signer?.(0).payment.address, [signer]) as string;
}

/**
 * @deprecated Use signer.address instead
 */
export function useNativeSegwitAccountIndexAddressIndexZero(accountIndex: number) {
  const signer = useNativeSegwitSigner(accountIndex)?.(0);
  return signer?.payment.address as string;
}

export function getNativeSegwitMainnetAddressFromMnemonic(secretKey: string) {
  return (accountIndex: number) => {
    const rootNode = mnemonicToRootNode(secretKey);
    const account = deriveNativeSegwitAccountFromRootKeychain(rootNode, 'mainnet')(accountIndex);
    return getNativeSegWitPaymentFromAddressIndex(
      deriveAddressIndexZeroFromAccount(account.keychain),
      'mainnet'
    );
  };
}

export function useUpdateLedgerSpecificTaprootInputPropsForAdddressIndexZero() {
  const taprootSigner = useCurrentAccountNativeSegwitIndexZeroSigner();
  const bitcoinClient = useBitcoinClient();

  return async (tx: Psbt, fingerprint: string, inputsToUpdate: number[] = []) => {
    const inputsTxHex = await Promise.all(
      tx.txInputs.map(input =>
        bitcoinClient.transactionsApi.getBitcoinTransactionHex(
          // txids are encoded onchain in reverse byte order
          reverseBytes(input.hash).toString('hex')
        )
      )
    );

    const inputsToSign =
      inputsToUpdate.length > 0 ? inputsToUpdate : makeNumberRange(tx.inputCount);
    inputsToSign.forEach(inputIndex => {
      tx.updateInput(inputIndex, {
        nonWitnessUtxo: Buffer.from(inputsTxHex[inputIndex], 'hex'),
        // On device warning if we don't add this
        // Required for Ledger signing
        bip32Derivation: [
          {
            masterFingerprint: Buffer.from(fingerprint, 'hex'),
            pubkey: Buffer.from(taprootSigner.publicKey),
            path: taprootSigner.derivationPath,
          },
        ],
      });
    });
  };
}

export function useUpdateLedgerSpecificNativeSegwitInputPropsForAdddressIndexZero() {
  const nativeSegwitSigner = useCurrentAccountNativeSegwitIndexZeroSigner();
  const bitcoinClient = useBitcoinClient();

  return async (tx: Psbt, fingerprint: string, inputsToUpdate: number[] = []) => {
    console.log('native segwit', { tx, fingerprint, inputsToUpdate });

    const inputsTxHex = await Promise.all(
      tx.txInputs.map(input =>
        bitcoinClient.transactionsApi.getBitcoinTransactionHex(
          // txids are encoded onchain in reverse byte order
          reverseBytes(input.hash).toString('hex')
        )
      )
    );

    const inputsToSign =
      inputsToUpdate.length > 0 ? inputsToUpdate : makeNumberRange(tx.inputCount);

    console.log({ inputsTxHex, inputsToSign, count: tx.inputCount });

    inputsToSign.forEach(inputIndex => {
      tx.updateInput(inputIndex, {
        nonWitnessUtxo: Buffer.from(inputsTxHex[inputIndex], 'hex'),

        // On device warning if we don't add this
        // Required for Ledger signing
        bip32Derivation: [
          {
            masterFingerprint: Buffer.from(fingerprint, 'hex'),
            pubkey: Buffer.from(nativeSegwitSigner.publicKey),
            path: nativeSegwitSigner.derivationPath,
          },
        ],
      });
    });
  };
}

export function useSignNativeSegwitLedgerTx() {
  const accountIndex = useCurrentAccountIndex();
  const network = useCurrentNetwork();

  const updateNativeSegwitLedgerProps =
    useUpdateLedgerSpecificNativeSegwitInputPropsForAdddressIndexZero();

  const updateTaprootLedgerInputs = useUpdateLedgerSpecificTaprootInputPropsForAdddressIndexZero();

  return async (app: AppClient, rawPsbt: Uint8Array, indexesToSign?: number[]) => {
    // debugger;
    const fingerprint = await app.getMasterFingerprint();

    console.log('fpnt', fingerprint, network.chain.bitcoin.network, accountIndex);

    const nativeSegwitExtendedPublicKey = await app.getExtendedPubkey(
      getNativeSegwitAccountDerivationPath(network.chain.bitcoin.network, accountIndex)
    );

    console.log({ extendedPublicKey: nativeSegwitExtendedPublicKey });

    // BtcSigner not compatible with Ledger. Encoded format returns more terse
    // version. BitcoinJsLib works.
    const psbt = Psbt.fromBuffer(Buffer.from(rawPsbt), {
      network: getBitcoinJsLibNetworkConfigByMode(network.chain.bitcoin.network),
    });

    const btcSignerPsbtTest = btc.Transaction.fromPSBT(psbt.toBuffer());

    const inputByPaymentType = makeNumberRange(btcSignerPsbtTest.inputsLength).map(index => [
      index,
      getInputPaymentType(index, btcSignerPsbtTest.getInput(index), network.chain.bitcoin.network),
    ]) as readonly [number, PaymentTypes][];

    const nativeSegwitInputsToSign = inputByPaymentType
      .filter(([_, paymentType]) => paymentType === 'p2wpkh')
      .map(([index]) => index);

    // console.log({ nativeSegwitInputsToSign, taprootInputsToSign });

    await updateNativeSegwitLedgerProps(psbt, fingerprint, nativeSegwitInputsToSign);

    const nativeSegwitPolicy = createNativeSegwitDefaultWalletPolicy({
      fingerprint,
      accountIndex,
      network: network.chain.bitcoin.network,
      xpub: nativeSegwitExtendedPublicKey,
    });

    // try {
    const nativeSegwitSignatures = await app.signPsbt(psbt.toBase64(), nativeSegwitPolicy, null);
    logger.debug('Native Segwit signatures', nativeSegwitSignatures);
    // addSignatureToPsbt(psbt, nativeSegwitSignatures);

    const taprootInputsToSign = inputByPaymentType
      .filter(([_, paymentType]) => paymentType === 'p2tr')
      .map(([index]) => index);

    await updateTaprootLedgerInputs(psbt, fingerprint, taprootInputsToSign);

    const taprootExtendedPublicKey = await app.getExtendedPubkey(
      getTaprootAccountDerivationPath(network.chain.bitcoin.network, accountIndex)
    );

    const taprootPolicy = createTaprootDefaultWalletPolicy({
      fingerprint,
      accountIndex,
      network: network.chain.bitcoin.network,
      xpub: taprootExtendedPublicKey,
    });

    const taprootSigs = await app.signPsbt(psbt.toBase64(), taprootPolicy, null);
    console.log({ taprootSigs });

    // addSignatureToPsbt(psbt, taprootSigs);

    // Turn back into BtcSigner lib format
    const btcSignerPsbt = btc.Transaction.fromPSBT(psbt.toBuffer());

    btcSignerPsbt.finalize();
    return btcSignerPsbt;
    // } catch (e) {
    //   logger.error('Failed signing BTC transaction on Ledger', e);
    // }

    // if (app.transport) await app.transport.close();

    // return null;
  };
}
