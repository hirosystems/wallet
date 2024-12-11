import { hexToBytes } from '@stacks/common';
import { BytesReader, addressToString, deserializeAddress } from '@stacks/transactions';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

enum SbtcStatus {
  Pending = 'pending',
  Reprocessing = 'reprocessing',
  Accepted = 'accepted',
  Confirmed = 'confirmed',
  Failed = 'failed',
}

export interface SbtcDepositInfo {
  amount: number;
  bitcoinTxOutputIndex: number;
  bitcoinTxid: string;
  depositScript: string;
  lastUpdateBlockHash: string;
  lastUpdateHeight: number;
  recipient: string; // Stacks address
  reclaimScript: string;
  status: SbtcStatus;
}

interface GetSbtcDepositsResponse {
  deposits: SbtcDepositInfo[];
  nextToken?: string;
}

// TODO: Verify this is correct for mainnet launch
const emilyUrl = 'https://beta.sbtc-emily.com/deposit';

async function getSbtcDeposits(status: string): Promise<GetSbtcDepositsResponse> {
  const resp = await axios.get(`${emilyUrl}?status=${status}`, {
    headers: {
      'Content-Type': 'application/json',
    },
  });
  return resp.data;
}

function useGetSbtcDeposits(stxAddress: string, status: string) {
  return useQuery({
    queryKey: ['get-sbtc-deposits', stxAddress, status],
    queryFn: () => getSbtcDeposits(status),
    select: resp =>
      resp.deposits.filter(deposit => {
        const recipient = addressToString(
          deserializeAddress(new BytesReader(hexToBytes(deposit.recipient.slice(2))))
        );
        return recipient === stxAddress;
      }),
  });
}

export function useSbtcPendingDeposits(stxAddress: string) {
  const { data: pendingDeposits = [], isLoading: isLoadingStatusPending } = useGetSbtcDeposits(
    stxAddress,
    'pending'
  );
  const { data: reprocessingDeposits = [], isLoading: isLoadingStatusReprocessing } =
    useGetSbtcDeposits(stxAddress, 'reprocessing');
  const { data: acceptedDeposits = [], isLoading: isLoadingStatusAccepted } = useGetSbtcDeposits(
    stxAddress,
    'accepted'
  );

  return {
    isLoading: isLoadingStatusPending || isLoadingStatusReprocessing || isLoadingStatusAccepted,
    pendingSbtcDeposits: [...pendingDeposits, ...reprocessingDeposits, ...acceptedDeposits],
  };
}
