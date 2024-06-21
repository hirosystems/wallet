import type { StxCryptoAssetBalance } from '@leather.io/models';
import {
  isErrorTooManyRequests,
  isFetchedWithSuccess,
  isInitializingData,
  useStxCryptoAssetBalance,
} from '@leather.io/query';
import { StxAvatarIcon } from '@leather.io/ui';

import { CryptoAssetItemError } from '../crypto-asset-item/crypto-asset-item-error';
import { CryptoAssetItemPlaceholder } from '../crypto-asset-item/crypto-asset-item-placeholder';

interface StxBalanceLoaderProps {
  address: string;
  children(balance: StxCryptoAssetBalance, isInitialLoading: boolean): React.ReactNode;
}
export function StxBalanceLoader({ address, children }: StxBalanceLoaderProps) {
  const result = useStxCryptoAssetBalance(address);
  if (isInitializingData(result)) return <CryptoAssetItemPlaceholder />;
  if (isErrorTooManyRequests(result))
    return (
      <CryptoAssetItemError
        caption="STX"
        icon={<StxAvatarIcon />}
        onRefetch={() => result.refetch()}
        title="Stacks"
      />
    );
  if (!isFetchedWithSuccess(result))
    return <CryptoAssetItemError caption="STX" icon={<StxAvatarIcon />} title="Stacks" />;
  const { data: balance, isInitialLoading } = result;
  return children(balance, isInitialLoading);
}
