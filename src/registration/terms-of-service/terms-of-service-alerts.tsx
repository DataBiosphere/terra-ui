import { atom } from '@terra-ui-packages/core-utils';
import _ from 'lodash/fp';
import React, { useEffect } from 'react';
import { Alert } from 'src/alerts/Alert';
import * as Nav from 'src/libs/nav';
import { useStore } from 'src/libs/react-utils';
import { AuthState, authStore } from 'src/libs/state';

const getNewTermsOfServiceNeedsAcceptingAlert = async (authState: AuthState) => {
  const shouldNotify =
    authState.termsOfService.isCurrentVersion === false && authState.termsOfService.permitsSystemUsage === true;
  if (!shouldNotify) {
    return null;
  }

  const message = (
    <div key="customText">
      A new Terra Terms of Service has been released. You will be required to accept the new Terms of Service the next
      time you log in. You can also accept the new Terms of Service now by clicking the link below.
    </div>
  );

  return {
    id: 'new-terms-of-service-alert',
    title: 'There is a new Terra Terms of Service.',
    message,
    severity: 'error',
    linkTitle: 'Accept the new Terms of Service here.',
    link: Nav.getLink('terms-of-service'),
  };
};

export const getTermsOfServiceAlerts = async (authState: AuthState) => {
  const alerts = await getNewTermsOfServiceNeedsAcceptingAlert(authState);
  return _.compact([alerts]);
};

export const tosAlertsStore = atom<Alert[]>([]);

export const useTermsOfServiceAlerts = () => {
  useEffect(() => {
    return authStore.subscribe((authState) =>
      getTermsOfServiceAlerts(authState).then((tosAlerts) => tosAlertsStore.set(tosAlerts), _.noop)
    ).unsubscribe;
  }, []);
  return useStore(tosAlertsStore);
};
