import { Select, useUniqueId } from '@terra-ui-packages/components';
import _ from 'lodash/fp';
import { Fragment } from 'react';
import { div, h, label } from 'react-hyperscript-helpers';
import * as breadcrumbs from 'src/components/breadcrumbs';
import FooterWrapper from 'src/components/FooterWrapper';
import { centeredSpinner } from 'src/components/icons';
import { TabBar } from 'src/components/tabBars';
import TopBar from 'src/components/TopBar';
import { Ajax } from 'src/libs/ajax';
import * as Nav from 'src/libs/nav';
import { useCancellation, useOnMount, useStore, withDisplayName } from 'src/libs/react-utils';
import { snapshotsListStore, snapshotStore } from 'src/libs/state';
import * as Style from 'src/libs/style';

export const wrapWorkflows = ({ activeTab }) => {
  return (WrappedComponent) => {
    const Wrapper = (props) => {
      const { namespace, name, snapshotId, children } = props;
      const signal = useCancellation();
      const cachedSnapshotsList = useStore(snapshotsListStore);
      const snapshotsList =
        cachedSnapshotsList && _.isEqual({ namespace, name }, _.pick(['namespace', 'name'], cachedSnapshotsList[0]))
          ? cachedSnapshotsList
          : undefined;

      useOnMount(() => {
        const loadSnapshots = async () => {
          snapshotsListStore.set(snapshotsList || (await Ajax(signal).Methods.list({ namespace, name })));
        };

        if (!snapshotsList) {
          loadSnapshots();
        }
      });

      return h(FooterWrapper, [
        h(TopBar, { title: 'Workflows', href: Nav.getLink('workflows') }, [
          div({ style: Style.breadcrumb.breadcrumb }, [
            div(breadcrumbs.commonPaths.workflowList()),
            div({ style: Style.breadcrumb.textUnderBreadcrumb }, [`${namespace}/${name}`]),
          ]),
        ]),
        div({ role: 'main', style: { flex: 1, display: 'flex', flexFlow: 'column nowrap' } }, [
          snapshotsList
            ? h(WorkflowsContainer, { namespace, name, snapshotId, tabName: activeTab, children }, [h(WrappedComponent, { ...props })])
            : centeredSpinner(),
        ]),
      ]);
    };
    return withDisplayName('wrapWorkflows', Wrapper);
  };
};

export const WorkflowsContainer = ({ namespace, name, snapshotId, tabName, children }) => {
  const signal = useCancellation();
  const cachedSnapshotsList = useStore(snapshotsListStore);
  const cachedSnapshot = useStore(snapshotStore);
  const selectedSnapshot = snapshotId * 1 || _.last(cachedSnapshotsList).snapshotId;
  const snapshotLabelId = useUniqueId();

  const snapshot =
    cachedSnapshot && _.isEqual({ namespace, name, snapshotId: selectedSnapshot }, _.pick(['namespace', 'name', 'snapshotId'], cachedSnapshot))
      ? cachedSnapshot
      : undefined;

  useOnMount(() => {
    const loadSnapshot = async () => {
      snapshotStore.set(await Ajax(signal).Methods.method(namespace, name, selectedSnapshot).get());
    };

    if (!snapshot) {
      loadSnapshot();
    }

    if (!snapshotId) {
      window.history.replaceState({}, '', Nav.getLink('workflow-dashboard', { namespace, name, snapshotId: selectedSnapshot }));
    }
  });

  return h(Fragment, [
    h(
      TabBar,
      {
        'aria-label': 'workflow menu',
        activeTab: tabName,
        tabNames: ['dashboard', 'wdl', 'configs'],
        displayNames: { configs: 'configurations' },
        getHref: (currentTab) => Nav.getLink(`workflow-${currentTab}`, { namespace, name, snapshotId: selectedSnapshot }),
      },
      [
        label({ htmlFor: snapshotLabelId, style: { marginRight: '1rem' } }, ['Snapshot:']),
        div({ style: { width: 100 } }, [
          h(Select, {
            id: snapshotLabelId,
            value: selectedSnapshot,
            isSearchable: false,
            options: _.map('snapshotId', cachedSnapshotsList),
            onChange: ({ value }) => Nav.goToPath(`workflow-${tabName}`, { namespace, name, snapshotId: value }),
          }),
        ]),
      ]
    ),
    snapshot ? div({ style: { flex: 1, display: 'flex', flexDirection: 'column' } }, [children]) : centeredSpinner(),
  ]);
};
