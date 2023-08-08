import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import * as yup from 'yup';

import { logger } from '@shared/logger';
import { OrdinalSendFormValues } from '@shared/models/form.model';
import { RouteUrls } from '@shared/route-urls';
import { noop } from '@shared/utils';

import { FormErrorMessages } from '@app/common/error-messages';
import { useAnalytics } from '@app/common/hooks/analytics/use-analytics';
import { formFeeRowValue } from '@app/common/send/utils';
import { useWalletType } from '@app/common/use-wallet-type';
import {
  btcAddressNetworkValidator,
  btcAddressValidator,
} from '@app/common/validation/forms/address-validators';
import { getNumberOfInscriptionOnUtxo } from '@app/query/bitcoin/ordinals/ordinals-aware-utxo.query';
import { useCurrentNetwork } from '@app/store/networks/networks.selectors';

import { useSendInscriptionState } from '../components/send-inscription-container';
import { recipeintFieldName } from '../send-inscription-form';
import { useGenerateSignedOrdinalTx } from './use-generate-ordinal-tx';

export function useSendInscriptionForm() {
  const [currentError, setShowError] = useState<null | string>(null);
  const [isCheckingFees, setIsCheckingFees] = useState(false);
  const analytics = useAnalytics();
  const navigate = useNavigate();
  const { whenWallet } = useWalletType();
  const { inscription, utxo } = useSendInscriptionState();
  const currentNetwork = useCurrentNetwork();

  const { coverFeeFromAdditionalUtxos } = useGenerateSignedOrdinalTx(utxo);

  return {
    currentError,
    isCheckingFees,
    async chooseTransactionFee(values: OrdinalSendFormValues) {
      setIsCheckingFees(true);
      // Check tx with lowest fee for errors before routing and
      // generating the final transaction with the chosen fee to send
      const resp = coverFeeFromAdditionalUtxos(values);

      if (!resp) {
        setShowError(
          'Insufficient funds to cover fee. Deposit some BTC to your Native Segwit address.'
        );
        return;
      }

      if (Number(inscription.offset) !== 0) {
        setShowError('Sending inscriptions at non-zero offsets is unsupported');
        return;
      }

      try {
        const numInscriptionsOnUtxo = await getNumberOfInscriptionOnUtxo(utxo.txid, utxo.vout);
        if (numInscriptionsOnUtxo > 1) {
          setShowError('Sending inscription from utxo with multiple inscriptions is unsupported');
          return;
        }
      } catch (error) {
        void analytics.track('ordinals_dot_com_unavailable', { error });
        setShowError('Unable to establish if utxo has multiple inscriptions');
        return;
      } finally {
        setIsCheckingFees(false);
      }

      navigate(RouteUrls.SendOrdinalInscriptionChooseFee, {
        state: { inscription, recipient: values.recipient, utxo },
      });
    },

    async reviewTransaction(
      feeValue: number,
      time: string,
      values: OrdinalSendFormValues,
      isCustomFee?: boolean
    ) {
      // Generate the final tx with the chosen fee to send
      const resp = coverFeeFromAdditionalUtxos(values);

      if (!resp) {
        logger.error('Failed to generate transaction for send');
        return;
      }

      const { hex } = resp;
      const feeRowValue = formFeeRowValue(values.feeRate, isCustomFee);
      whenWallet({
        ledger() {
          navigate(RouteUrls.ConnectLedger, {
            replace: true,
            state: {
              tx: hex,
              recipient: values.recipient,
              fee: feeValue,
              feeRowValue,
              time,
            },
          });
        },
        software() {
          navigate(RouteUrls.SendOrdinalInscriptionReview, {
            state: {
              fee: feeValue,
              inscription,
              utxo,
              recipient: values.recipient,
              time,
              feeRowValue,
              tx: hex,
            },
          });
        },
      })();
    },

    validationSchema: yup.object({
      [recipeintFieldName]: yup
        .string()
        .required(FormErrorMessages.AddressRequired)
        .concat(btcAddressValidator())
        .concat(btcAddressNetworkValidator(currentNetwork.chain.bitcoin.network)),
    }),
  };
}
