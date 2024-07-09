import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';

import { RouteUrls } from '@shared/route-urls';
import { closeWindow } from '@shared/utils';
import { analytics } from '@shared/utils/analytics';

import { useInitalizeAnalytics } from '@app/common/app-analytics';
import { LoadingSpinner } from '@app/components/loading-spinner';
import { SwitchAccountDialog } from '@app/features/dialogs/switch-account-dialog/switch-account-dialog';
import { InAppMessages } from '@app/features/hiro-messages/in-app-messages';
import { useOnSignOut } from '@app/routes/hooks/use-on-sign-out';
import { useOnWalletLock } from '@app/routes/hooks/use-on-wallet-lock';
import { useHasStateRehydrated } from '@app/store';

import { useRestoreFormState } from '../popup-send-form-restoration/use-restore-form-state';

export function Container() {
  const [isShowingSwitchAccount, setIsShowingSwitchAccount] = useState(false);
  const { pathname: locationPathname } = useLocation();
  const pathname = locationPathname as RouteUrls;

  const hasStateRehydrated = useHasStateRehydrated();

  useOnWalletLock(() => closeWindow());
  useOnSignOut(() => closeWindow());
  useRestoreFormState();
  useInitalizeAnalytics();

  useEffect(() => void analytics.page('view', `${pathname}`), [pathname]);

  if (!hasStateRehydrated) return <LoadingSpinner />;

  return (
    <>
      {isShowingSwitchAccount && (
        <SwitchAccountDialog
          isShowing={isShowingSwitchAccount}
          onClose={() => setIsShowingSwitchAccount(false)}
        />
      )}

      <InAppMessages />
      {/* > Pete , back to this in the AM 
- tackle issue with memory leak 
- try decouple logic like Kyran said 

In a smaller follow up then
- fix actual bugs with account showing 
- resizing of popout  */}

      {/* {layout &&
        cloneElement(
          layout,
          { isShowingSwitchAccount, setIsShowingSwitchAccount }, // don't think this is used? is it?
          // actually check the HomeLayout and try and replace the other isShowingSwitchAccount with this one and pass it down?
          <Outlet context={{ isShowingSwitchAccount, setIsShowingSwitchAccount }} />
        )} */}
      <Outlet context={{ isShowingSwitchAccount, setIsShowingSwitchAccount }} />
    </>
  );
}
