import type { AddressTransactionWithTransfers } from '@stacks/stacks-blockchain-api-types';

import { FtTransfer } from '@leather-wallet/models';
import { isFtAsset, useGetFungibleTokenMetadataQuery } from '@leather-wallet/query';

import { logger } from '@shared/logger';

import { getSafeImageCanonicalUri } from '@app/common/stacks-utils';
import {
  calculateTokenTransferAmount,
  getTxCaption,
} from '@app/common/transactions/stacks/transaction.utils';
import { getPrincipalFromContractId } from '@app/common/utils';
import { StacksAssetAvatar } from '@app/components/stacks-asset-avatar';
import { StacksTransactionItem } from '@app/components/stacks-transaction-item/stacks-transaction-item';
import { useCurrentStacksAccount } from '@app/store/accounts/blockchain/stacks/stacks-account.hooks';
import { ArrowDownIcon } from '@app/ui/icons/arrow-down-icon';
import { ArrowUpIcon } from '@app/ui/icons/arrow-up-icon';

import { TxTransferIconWrapper } from './tx-transfer-icon-wrapper';

interface FtTransferItemProps {
  ftTransfer: FtTransfer;
  parentTx: AddressTransactionWithTransfers;
}
export function FtTransferItem({ ftTransfer, parentTx }: FtTransferItemProps) {
  const { data: assetMetadata } = useGetFungibleTokenMetadataQuery(
    getPrincipalFromContractId(ftTransfer.asset_identifier)
  );
  const currentAccount = useCurrentStacksAccount();
  const isOriginator = ftTransfer.sender === currentAccount?.address;

  if (!(assetMetadata && isFtAsset(assetMetadata))) {
    logger.error('Token metadata not found');
    return null;
  }

  const displayAmount = calculateTokenTransferAmount(
    assetMetadata?.decimals ?? 0,
    ftTransfer.amount
  );
  if (typeof displayAmount === 'undefined') return null;

  const caption = getTxCaption(parentTx.tx) ?? '';
  const ftImageCanonicalUri =
    assetMetadata.image_canonical_uri &&
    assetMetadata.name &&
    getSafeImageCanonicalUri(assetMetadata.image_canonical_uri, assetMetadata.name);
  const icon = isOriginator ? <ArrowUpIcon variant="small" /> : <ArrowDownIcon variant="small" />;
  const title = `${assetMetadata.name || 'Token'} Transfer`;
  const value = `${isOriginator ? '-' : ''}${displayAmount.toFormat()}`;
  const transferIcon = ftImageCanonicalUri ? (
    <StacksAssetAvatar
      color="ink.background-primary"
      gradientString=""
      imageCanonicalUri={ftImageCanonicalUri}
    >
      {title}
    </StacksAssetAvatar>
  ) : (
    <TxTransferIconWrapper icon={icon} />
  );

  return (
    <StacksTransactionItem
      caption={caption}
      icon={transferIcon}
      link={parentTx.tx.tx_id}
      title={title}
      value={value}
    />
  );
}
