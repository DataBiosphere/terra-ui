// This file is where any notifications not tied to a specific action are managed for leonardo-related resource
// For example, if you load a page and your apps/runtimes are in an error state, this component is responsible for that notification

import { isToday } from 'date-fns';
import { isAfter } from 'date-fns/fp';
import _ from 'lodash/fp';
import { Fragment, PropsWithChildren, useEffect, useState } from 'react';
import { h, p } from 'react-hyperscript-helpers';
import { AppErrorModal } from 'src/analysis/modals/AppErrorModal';
import { RuntimeErrorModal } from 'src/analysis/modals/RuntimeErrorModal';
import { GalaxyLaunchButton } from 'src/analysis/runtime-common-components';
import { appLauncherTabName, GalaxyWarning } from 'src/analysis/runtime-common-text';
import { getCurrentApp } from 'src/analysis/utils/app-utils';
import { dataSyncingDocUrl } from 'src/analysis/utils/gce-machines';
import { getCurrentRuntime } from 'src/analysis/utils/runtime-utils';
import { appTools, runtimeToolLabels } from 'src/analysis/utils/tool-utils';
import { ButtonPrimary, Clickable, Link } from 'src/components/common';
import { App } from 'src/libs/ajax/leonardo/models/app-models';
import { Runtime } from 'src/libs/ajax/leonardo/models/runtime-models';
import { leoAppProvider } from 'src/libs/ajax/leonardo/providers/LeoAppProvider';
import { getDynamic, getSessionStorage, setDynamic } from 'src/libs/browser-storage';
import { getLink } from 'src/libs/nav';
import { clearNotification, notify } from 'src/libs/notifications';
import { usePrevious } from 'src/libs/react-utils';
import { errorNotifiedApps, errorNotifiedRuntimes } from 'src/libs/state';
import { newTabLinkProps } from 'src/libs/utils';

const RuntimeErrorNotification = ({ runtime }) => {
  const [modalOpen, setModalOpen] = useState(false);

  return h(Fragment, [
    h(
      Clickable,
      {
        'aria-label': 'Runtime error notification',
        onClick: () => setModalOpen(true),
        style: {
          marginTop: '1rem',
          textDecoration: 'underline',
          fontWeight: 'bold',
        },
      },
      ['Details']
    ),
    modalOpen &&
      h(RuntimeErrorModal, {
        runtime,
        onDismiss: () => setModalOpen(false),
      }),
  ]);
};

const AppErrorNotification = ({ app }) => {
  const [modalOpen, setModalOpen] = useState(false);

  return h(Fragment, [
    h(
      Clickable,
      {
        'aria-label': 'App error notification',
        onClick: () => setModalOpen(true),
        style: {
          marginTop: '1rem',
          textDecoration: 'underline',
          fontWeight: 'bold',
        },
      },
      ['Details']
    ),
    modalOpen &&
      h(AppErrorModal, {
        app,
        onDismiss: () => setModalOpen(false),
        appProvider: leoAppProvider,
      }),
  ]);
};

interface AnalysisNotificationManagerProps extends PropsWithChildren {
  namespace: string;
  name: string;
  runtimes: Runtime[];
  apps: App[];
}

export const AnalysisNotificationManager = (props: AnalysisNotificationManagerProps) => {
  const { namespace, name, runtimes, apps } = props;
  const prevRuntimes: Runtime[] = usePrevious(runtimes) || [];
  const prevApps: App[] = usePrevious(apps) || [];

  useEffect(() => {
    const runtime: Runtime | undefined = getCurrentRuntime(runtimes);
    const prevRuntime: Runtime | undefined = _.last(
      _.sortBy('auditInfo.createdDate', _.remove({ status: 'Deleting' }, prevRuntimes))
    );
    const twoMonthsAgo = _.tap((d) => d.setMonth(d.getMonth() - 2), new Date());
    const welderCutOff = new Date('2019-08-01');
    const createdDate = runtime ? new Date(runtime.auditInfo.createdDate) : new Date();
    const dateNotified = getDynamic(getSessionStorage(), `notifiedOutdatedRuntime${runtime?.id}`) || {};
    const rStudioLaunchLink = getLink(appLauncherTabName, { namespace, name, application: 'RStudio' });
    const galaxyApp = getCurrentApp(appTools.GALAXY.label, apps);
    const prevGalaxyApp = getCurrentApp(appTools.GALAXY.label, prevApps || []);

    if (
      runtime?.status === 'Error' &&
      prevRuntime?.status !== 'Error' &&
      !_.includes(runtime.id, errorNotifiedRuntimes.get())
    ) {
      notify('error', 'Error Creating Cloud Environment', {
        message: h(RuntimeErrorNotification, { runtime }),
      });
      errorNotifiedRuntimes.update((value) => [...value, runtime.id]);
    } else if (
      runtime?.status === 'Running' &&
      prevRuntime?.status !== 'Running' &&
      runtime?.labels?.tool === runtimeToolLabels.RStudio &&
      window.location.hash !== rStudioLaunchLink
    ) {
      const rStudioNotificationId = notify('info', 'Your cloud environment is ready.', {
        message: h(
          ButtonPrimary,
          {
            href: rStudioLaunchLink,
            onClick: () => clearNotification(rStudioNotificationId),
          },
          ['Open RStudio']
        ),
      });
    } else if (isAfter(createdDate, welderCutOff) && !isToday(dateNotified)) {
      // TODO: remove this notification some time after the data syncing release
      setDynamic(getSessionStorage(), `notifiedOutdatedRuntime${runtime?.id}`, Date.now());
      notify('warn', 'Please Update Your Cloud Environment', {
        message: h(Fragment, [
          p([
            'Last year, we introduced important updates to Terra that are not compatible with the older cloud environment associated with this workspace. You are no longer able to save new changes to notebooks using this older cloud environment.',
          ]),
          h(Link, { 'aria-label': 'Welder cutoff link', href: dataSyncingDocUrl, ...newTabLinkProps }, [
            'Read here for more details.',
          ]),
        ]),
      });
    } else if (isAfter(createdDate, twoMonthsAgo) && !isToday(dateNotified)) {
      setDynamic(getSessionStorage(), `notifiedOutdatedRuntime${runtime?.id}`, Date.now());
      notify('warn', 'Outdated Cloud Environment', {
        message:
          'Your cloud environment is over two months old. Please consider deleting and recreating your cloud environment in order to access the latest features and security updates.',
      });
    } else if (runtime?.status === 'Running' && prevRuntime?.status === 'Updating') {
      notify('success', 'Number of workers has updated successfully.');
    }
    if (prevGalaxyApp && prevGalaxyApp.status !== 'RUNNING' && galaxyApp?.status === 'RUNNING') {
      const galaxyId = notify('info', 'Your cloud environment for Galaxy is ready.', {
        message: h(Fragment, [
          h(GalaxyWarning),
          h(GalaxyLaunchButton, {
            app: galaxyApp,
            onClick: () => clearNotification(galaxyId),
          }),
        ]),
      });
    } else if (galaxyApp?.status === 'ERROR' && !_.includes(galaxyApp.appName, errorNotifiedApps.get())) {
      notify('error', 'Error Creating Galaxy App', {
        message: h(AppErrorNotification, { app: galaxyApp }),
      });
      errorNotifiedApps.update((value) => [...value, galaxyApp.appName]);
    }
  }, [runtimes, apps, namespace, name]); // eslint-disable-line react-hooks/exhaustive-deps

  return h(Fragment);
};

export default AnalysisNotificationManager;
