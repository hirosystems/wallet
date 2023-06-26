import { Box, Text } from '@stacks/ui';
import { truncateMiddle } from '@stacks/ui-utils';

import { SimplifiedBitcoinContract } from '@app/common/hooks/use-bitcoin-contracts';
import { formatMoney, i18nFormatCurrency } from '@app/common/money/format-money';
import { satToBtc } from '@app/common/money/unit-conversion';
import { useCalculateBitcoinFiatValue } from '@app/query/common/market-data/market-data.hooks';

import { BitcoinContractLockAmount } from './bitcoin-contract-lock-amount';
import { createMoneyFromDecimal } from '@shared/models/money.model';

interface BitcoinContractOfferInputProps {
  addressNativeSegwit: string;
  bitcoinContractOffer: SimplifiedBitcoinContract;
}
export function BitcoinContractOfferInput({
  addressNativeSegwit,
  bitcoinContractOffer,
}: BitcoinContractOfferInputProps) {
  const calculateFiatValue = useCalculateBitcoinFiatValue();

  const bitcoinValue = satToBtc(bitcoinContractOffer.bitcoinContractCollateralAmount);
  const money = createMoneyFromDecimal(bitcoinValue, 'BTC');
  const fiatValue = calculateFiatValue(money);
  const formattedBitcoinValue = formatMoney(money)
  const formattedFiatValue = i18nFormatCurrency(fiatValue);

  return (
    <Box
      background="white"
      borderBottomLeftRadius={'16px'}
      borderBottomRightRadius={'16px'}
      borderTopLeftRadius={'16px'}
      borderTopRightRadius={'16px'}
      p="loose"
    >
      <Text fontWeight={500}>Amount</Text>
      <BitcoinContractLockAmount
        hoverLabel={addressNativeSegwit}
        subtitle={truncateMiddle(addressNativeSegwit)}
        subValue={`${formattedFiatValue} USD`}
        value={formattedBitcoinValue }
      />
      <hr />
    </Box>
  );
}
