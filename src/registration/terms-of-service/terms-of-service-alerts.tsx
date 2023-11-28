import { Link } from '@terra-ui-packages/components';
import { atom } from '@terra-ui-packages/core-utils';
import _ from 'lodash/fp';
import React, { useEffect } from 'react';
import { Alert } from 'src/alerts/Alert';
import * as Nav from 'src/libs/nav';
import { useStore } from 'src/libs/react-utils';
import { AuthState, authStore } from 'src/libs/state';

const getNewTermsOfServiceNeedsAcceptingAlert = (authState: AuthState): Alert | undefined => {
  const shouldNotify =
    authState.termsOfService.isCurrentVersion === false && authState.termsOfService.permitsSystemUsage === true;
  if (!shouldNotify) {
    return undefined;
  }

  const message = (
    <div>
      <div>
        A new Terra Terms of Service has been released. You will be required to accept the new Terms of Service the next
        time you log in. You can also accept the new Terms of Service now by clicking the link below.
      </div>
      <br />
      <Link href={Nav.getLink('terms-of-service')}>Accept the new Terms of Service here.</Link>
    </div>
  );

  return {
    id: 'new-terms-of-service-alert',
    title: 'There is a new Terra Terms of Service.',
    message,
    severity: 'warn',
  };
};

export const getTermsOfServiceAlerts = (authState: AuthState): Alert[] => {
  const alerts = getNewTermsOfServiceNeedsAcceptingAlert(authState);
  return _.compact([alerts]);
};

export const tosAlertsStore = atom<Alert[]>([]);

export const useTermsOfServiceAlerts = () => {
  useEffect(() => {
    return authStore.subscribe((authState) => {
      const alerts = getTermsOfServiceAlerts(authState);
      tosAlertsStore.set(alerts);
    }).unsubscribe;
  }, []);
  return useStore(tosAlertsStore);
};
