import { Stack } from '@stacks/ui';

import { openInNewTab } from '@app/common/utils/open-in-new-tab';
import { Caption, Title } from '@app/components/typography';
import { PrimaryButton } from '@app/components/primary-button';
import { BuyTokensSelectors } from '@tests/page-objects/buy-tokens-selectors';

const providersInfo = {
  transak: {
    title: 'Transak',
    body: 'Non-US residents can purchase STX with credit card, debit card, or bank transfer via Transak.',
    cta: 'Buy on Transak',
    test_id: 'BtnTransak',
  },
  okcoin: {
    title: 'Okcoin',
    body: 'US users can purchase STX quickly with USD',
    cta: 'Buy on Okcoin',
    test_id: 'BtnOkCoin',
  },
};

export interface ProvidersUrl {
  transak: string;
  okcoin: string;
}

interface OnrampProviderLayoutProps {
  provider: string;
  providerUrl: string;
}

export const OnrampProviderLayout = ({ provider, providerUrl }: OnrampProviderLayoutProps) => {
  const { title, cta, body, test_id } = providersInfo[provider as keyof ProvidersUrl];
  return (
    <Stack overflow="hidden" alignItems="flex-start" spacing="base" mt={5} className="buy-box">
      <Stack spacing="base-tight">
        <Title marginBottom="10">{title}</Title>
        <Caption>{body}</Caption>
      </Stack>
      <PrimaryButton
        onClick={() => openInNewTab(providerUrl)}
        data-testid={BuyTokensSelectors[test_id as keyof typeof BuyTokensSelectors]}
      >
        {cta}
      </PrimaryButton>
    </Stack>
  );
};
