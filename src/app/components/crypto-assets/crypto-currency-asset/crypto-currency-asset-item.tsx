import { StackProps } from '@stacks/ui';
import { forwardRefWithAs } from '@stacks/ui-core';

import type { AllCryptoCurrencyAssetBalances } from '@shared/models/crypto-asset-balance.model';
import { CryptoCurrencies } from '@shared/models/currencies.model';

import { CryptoCurrencyAssetItemLayout } from './crypto-currency-asset-item.layout';

interface CryptoCurrencyAssetItemProps extends StackProps {
  assetBalance: AllCryptoCurrencyAssetBalances;
  assetSubBalance?: AllCryptoCurrencyAssetBalances;
  icon: JSX.Element;
  isPressable?: boolean;
  address: string;
  currency?: CryptoCurrencies;
}
export const CryptoCurrencyAssetItem = forwardRefWithAs(
  (props: CryptoCurrencyAssetItemProps, ref) => {
    const { assetBalance, assetSubBalance, icon, isPressable, address, currency, ...rest } = props;
    const { balance, asset } = assetBalance;

    return (
      <CryptoCurrencyAssetItemLayout
        balance={balance}
        caption={assetBalance.balance.symbol}
        icon={icon}
        isPressable={isPressable}
        ref={ref}
        subBalance={assetSubBalance?.balance}
        title={asset.name}
        address={address}
        currency={currency}
        {...rest}
      />
    );
  }
);
