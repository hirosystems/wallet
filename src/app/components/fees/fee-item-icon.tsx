import type { ReactNode } from 'react';

import {
  AnimalChameleonIcon,
  AnimalEagleIcon,
  AnimalRabbitIcon,
  AnimalSnailIcon,
} from '@leather.io/ui';

import type { FeeType } from '@app/common/fees/use-fees';

import { IconWrapper } from '../icon-wrapper';

const feeTypeToIconMap: Record<FeeType, ReactNode> = {
  slow: <AnimalSnailIcon />,
  standard: <AnimalRabbitIcon />,
  fast: <AnimalEagleIcon />,
  custom: <AnimalChameleonIcon />,
};

export function FeeItemIcon({ feeType }: { feeType: FeeType }) {
  const icon = feeTypeToIconMap[feeType] || null;

  if (!icon) {
    throw new Error('Invalid fee type');
  }

  return <IconWrapper>{icon}</IconWrapper>;
}
