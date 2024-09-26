import { Spinner } from '@terra-ui-packages/components';
import { delay } from '@terra-ui-packages/core-utils';
import _ from 'lodash/fp';
import { Fragment, useEffect, useState } from 'react';
import { b, div, h, input, label } from 'react-hyperscript-helpers';
import { getConvertedRuntimeStatus, usableStatuses } from 'src/analysis/utils/runtime-utils';
import { cookiesAcceptedKey } from 'src/auth/accept-cookies';
import { ButtonPrimary, IdContainer, spinnerOverlay } from 'src/components/common';
import { icon } from 'src/components/icons';
import { Runtimes } from 'src/libs/ajax/leonardo/Runtimes';
import { Metrics } from 'src/libs/ajax/Metrics';
import colors from 'src/libs/colors';
import { withErrorIgnoring, withErrorReporting } from 'src/libs/error';
import Events from 'src/libs/events';
import { getLocalPref } from 'src/libs/prefs';
import { useCancellation, useGetter, useOnMount, usePollingEffect, usePrevious, useStore } from 'src/libs/react-utils';
import { authStore, azureCookieReadyStore, cookieReadyStore } from 'src/libs/state';
import * as Style from 'src/libs/style';
import * as Utils from 'src/libs/utils';
import { cloudProviderTypes } from 'src/workspaces/utils';

export const StatusMessage = ({ hideSpinner, children }) => {
  return div({ style: { paddingLeft: '2rem', display: 'flex', alignItems: 'center' } }, [
    !hideSpinner && h(Spinner, { style: { marginRight: '0.5rem' } }),
    div([children]),
  ]);
};

export const RadioBlock = ({ labelText, children, name, checked, onChange, style = {} }) => {
  return div(
    {
      style: {
        backgroundColor: colors.warning(0.2),
        borderRadius: 3,
        border: `1px solid ${checked ? colors.accent() : 'transparent'}`,
        boxShadow: checked ? Style.standardShadow : undefined,
        display: 'flex',
        alignItems: 'baseline',
        padding: '.75rem',
        ...style,
      },
    },
    [
      h(IdContainer, [
        (id) =>
          h(Fragment, [
            input({ type: 'radio', name, checked, onChange, id }),
            div({ style: { marginLeft: '.75rem' } }, [label({ style: { fontWeight: 600, fontSize: 16 }, htmlFor: id }, [labelText]), children]),
          ]),
      ]),
    ]
  );
};

export function RuntimeKicker({ runtime, refreshRuntimes }) {
  const getRuntime = useGetter(runtime);
  const signal = useCancellation();
  const [busy, setBusy] = useState();

  const startRuntimeOnce = withErrorReporting('Error starting cloud environment')(async () => {
    while (!signal.aborted) {
      const currentRuntime = getRuntime();
      const { googleProject, runtimeName, cloudContext, workspaceId } = currentRuntime || {};
      const status = getConvertedRuntimeStatus(currentRuntime);
      if (status === 'Stopped') {
        setBusy(true);
        (await cloudContext.cloudProvider) === cloudProviderTypes.AZURE
          ? Runtimes().runtimeV2(workspaceId, runtimeName).start()
          : Runtimes().runtime(googleProject, runtimeName).start();
        await refreshRuntimes();
        setBusy(false);
        return;
      }
      if (currentRuntime === undefined || status === 'Stopping') {
        await delay(500);
      } else {
        return;
      }
    }
  });

  useOnMount(() => {
    startRuntimeOnce();
  });

  return busy ? spinnerOverlay : null;
}

export const ApplicationHeader = ({ label, labelBgColor, bgColor, children }) => {
  return div(
    {
      style: {
        backgroundColor: bgColor,
        display: 'flex',
        alignItems: 'center',
        borderBottom: `2px solid ${colors.dark(0.2)}`,
        whiteSpace: 'pre',
      },
    },
    [
      b({ style: { backgroundColor: labelBgColor, padding: '0.75rem 2rem', alignSelf: 'stretch', display: 'flex', alignItems: 'center' } }, [label]),
      children,
    ]
  );
};

export const PlaygroundHeader = ({ children }) => {
  return h(
    ApplicationHeader,
    {
      label: 'PLAYGROUND MODE',
      labelBgColor: colors.warning(0.4),
      bgColor: colors.warning(0.25),
    },
    [
      icon('warning-standard', { style: { color: colors.warning(), marginLeft: '1rem' } }),
      div({ style: { margin: '0.5rem 1rem', whiteSpace: 'initial' } }, [children]),
    ]
  );
};

export function RuntimeStatusMonitor({ runtime, onRuntimeStoppedRunning = _.noop, onRuntimeStartedRunning = _.noop }) {
  const currentStatus = getConvertedRuntimeStatus(runtime);
  const prevStatus = usePrevious(currentStatus);

  useEffect(() => {
    if (prevStatus === 'Running' && !_.includes(currentStatus, usableStatuses)) {
      onRuntimeStoppedRunning();
    } else if (prevStatus !== 'Running' && _.includes(currentStatus, usableStatuses)) {
      onRuntimeStartedRunning();
    }
  }, [currentStatus, onRuntimeStartedRunning, onRuntimeStoppedRunning, prevStatus]);

  return null;
}

export function AuthenticatedCookieSetter() {
  const { termsOfService } = useStore(authStore);
  const cookiesAccepted = getLocalPref(cookiesAcceptedKey) !== false;
  const allowedToUseSystem = termsOfService.permitsSystemUsage;

  return allowedToUseSystem && cookiesAccepted ? h(PeriodicCookieSetter) : null;
}

export function PeriodicCookieSetter() {
  const signal = useCancellation();
  usePollingEffect(
    withErrorIgnoring(async () => {
      await Runtimes(signal).setCookie();
      cookieReadyStore.set(true);
    }),
    { ms: 5 * 60 * 1000, leading: true }
  );
  return null;
}

export async function setAzureCookieOnUrl(signal, proxyUrl, forApp) {
  await Runtimes(signal).azureProxy(proxyUrl).setAzureCookie();
  if (forApp) azureCookieReadyStore.update(_.set('readyForApp', true));
  else azureCookieReadyStore.update(_.set('readyForRuntime', true));
}

export function PeriodicAzureCookieSetter({ proxyUrl, forApp = false }) {
  const signal = useCancellation();
  usePollingEffect(
    withErrorIgnoring(async () => {
      await setAzureCookieOnUrl(signal, proxyUrl, forApp);
    }),
    { ms: 5 * 60 * 1000, leading: true }
  );
  return null;
}

export const GalaxyLaunchButton = ({ app, onClick, ...props }) => {
  const cookieReady = useStore(cookieReadyStore);
  return h(
    ButtonPrimary,
    {
      disabled: !cookieReady || _.lowerCase(app.status) !== 'running',
      // toolTip: _.lowerCase(app.status) == 'running' ? 'Cannot launch galaxy that is not Running' : '',
      href: app.proxyUrls.galaxy,
      onClick: () => {
        onClick();
        Metrics().captureEvent(Events.applicationLaunch, { app: 'Galaxy' });
      },
      ...Utils.newTabLinkPropsWithReferrer, // Galaxy needs the referrer to be present so we can validate it, otherwise we fail with 401
      ...props,
    },
    ['Open Galaxy']
  );
};
