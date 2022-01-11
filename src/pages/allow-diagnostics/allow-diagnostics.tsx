import React, { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

import { initSentry } from '@common/sentry-init';
import { initSegment } from '@common/segment-init';
import { PopupContainer } from '@components/popup/container';
import { Header } from '@components/header';
import { RouteUrls } from '@routes/route-urls';
import { useHasAllowedDiagnostics } from '@store/onboarding/onboarding.hooks';

import { AllowDiagnosticsLayout } from './allow-diagnostics-layout';

export const AllowDiagnosticsPage = () => {
  const navigate = useNavigate();
  const [, setHasAllowedDiagnostics] = useHasAllowedDiagnostics();

  const goToOnboardingAndSetDiagnosticsPermissionTo = useCallback(
    (areDiagnosticsAllowed: boolean | undefined) => {
      if (typeof areDiagnosticsAllowed === undefined) return;
      setHasAllowedDiagnostics(areDiagnosticsAllowed);
      if (areDiagnosticsAllowed) {
        initSentry();
        void initSegment();
      }
      navigate(RouteUrls.Onboarding);
    },
    [navigate, setHasAllowedDiagnostics]
  );

  return (
    <PopupContainer header={<Header hideActions />} requestType="auth">
      <AllowDiagnosticsLayout
        onUserDenyDiagnosticsPermissions={() => goToOnboardingAndSetDiagnosticsPermissionTo(false)}
        onUserAllowDiagnostics={() => goToOnboardingAndSetDiagnosticsPermissionTo(true)}
      />
    </PopupContainer>
  );
};
