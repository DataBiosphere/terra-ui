import { Atom, atom } from '@terra-ui-packages/core-utils';
import _ from 'lodash/fp';
import { Fragment, ReactNode, useEffect } from 'react';
import { br, h } from 'react-hyperscript-helpers';
import { Link } from 'src/components/common';
import { Ajax } from 'src/libs/ajax';
import * as Nav from 'src/libs/nav';
import { useStore } from 'src/libs/react-utils';
import { AuthState, authStore, TermsOfServiceStatus } from 'src/libs/state';

type TermsOfServiceAlert = {
  id: string;
  title: string;
  message: ReactNode;
  severity: string;
};

const getNewTermsOfServiceNeedsAcceptingAlert = async (): Promise<TermsOfServiceAlert | null> => {
  let responseText;
  try {
    const { text } = await Ajax().FirecloudBucket.getTosGracePeriodText();
    responseText = text;
  } catch (e) {
    responseText = undefined;
  }
  const gracePeriodText = _.isUndefined(responseText)
    ? "There is currently a grace period allowing you to use Terra under the terms of service you've previously agreed to."
    : responseText;

  return {
    id: 'terms-of-service-needs-accepting-grace-period',
    title: 'There is a new Terra Terms of Service.',
    message: h(Fragment, [
      h(Fragment, { key: 'customText' }, [gracePeriodText]),
      h(Fragment, { key: 'lineBreak' }, [br()]),
      h(Link, { href: Nav.getLink('terms-of-service'), key: 'tosLink' }, ['Accept the new Terms of Service here.']),
    ]),
    severity: 'error',
  };
};

export const getTermsOfServiceAlerts = async (
  termsOfServiceState: TermsOfServiceStatus
): Promise<TermsOfServiceAlert[]> => {
  const shouldNotify = !termsOfServiceState.userHasAcceptedLatestTos && termsOfServiceState.permitsSystemUsage;
  const alerts: TermsOfServiceAlert | null = shouldNotify ? await getNewTermsOfServiceNeedsAcceptingAlert() : null;
  return _.compact([alerts]);
};

export const tosGracePeriodAlertsStore: Atom<TermsOfServiceAlert[]> = atom<TermsOfServiceAlert[]>([]);

export const useTermsOfServiceAlerts = () => {
  useEffect(() => {
    return authStore.subscribe((authState: AuthState) =>
      getTermsOfServiceAlerts(authState.termsOfService).then(
        (tosGracePeriodAlerts: TermsOfServiceAlert[]) => tosGracePeriodAlertsStore.set(tosGracePeriodAlerts),
        _.noop
      )
    ).unsubscribe;
  }, []);
  return useStore(tosGracePeriodAlertsStore);
};
