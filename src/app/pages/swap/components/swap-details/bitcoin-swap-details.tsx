import { SwapSelectors } from '@tests/selectors/swap.selectors';
import BigNumber from 'bignumber.js';
import { useFormikContext } from 'formik';
import { HStack, styled } from 'leather-styles/jsx';

import { ChevronRightIcon } from '@leather.io/ui';
import {
  convertAmountToBaseUnit,
  createMoney,
  createMoneyFromDecimal,
  formatMoneyPadded,
  isUndefined,
  satToBtc,
} from '@leather.io/utils';

import type { SwapFormValues } from '@shared/models/form.model';

import { useSwapContext } from '@app/pages/swap/swap.context';

import type { BitcoinSwapContext } from '../../providers/bitcoin-swap-provider';
import { SwapDetailLayout } from './swap-detail.layout';
import { SwapDetailsLayout } from './swap-details.layout';

function RouteNames() {
  return (
    <HStack gap="space.01">
      <styled.span>BTC</styled.span>
      <ChevronRightIcon variant="small" />
      <styled.span>sBTC</styled.span>
    </HStack>
  );
}

export function BitcoinSwapDetails() {
  const { swapData } = useSwapContext<BitcoinSwapContext>();
  const { values } = useFormikContext<SwapFormValues>();

  if (isUndefined(values.swapAssetBase) || isUndefined(values.swapAssetQuote)) return null;

  const maxSignerFee = satToBtc(swapData.maxSignerFee ?? 0);

  const formattedMinToReceive = formatMoneyPadded(
    createMoneyFromDecimal(
      new BigNumber(values.swapAmountQuote).minus(maxSignerFee),
      values.swapAssetQuote.balance.symbol,
      values.swapAssetQuote.balance.decimals
    )
  );

  return (
    <SwapDetailsLayout>
      <SwapDetailLayout
        dataTestId={SwapSelectors.SwapDetailsProtocol}
        title="Powered by"
        value={swapData.protocol}
      />
      <SwapDetailLayout
        title="Route"
        value={
          <HStack gap="space.01">
            <RouteNames />
          </HStack>
        }
      />
      <SwapDetailLayout title="Min to receive" value={formattedMinToReceive} />
      <SwapDetailLayout title="Slippage tolerance" value="0%" />
      <SwapDetailLayout title="Max signer fee" value={maxSignerFee.toString()} />
      <SwapDetailLayout
        title="Transaction fees"
        value={`${convertAmountToBaseUnit(
          swapData.fee ?? createMoney(new BigNumber(0), 'BTC')
        ).toString()} BTC`}
      />
    </SwapDetailsLayout>
  );
}
