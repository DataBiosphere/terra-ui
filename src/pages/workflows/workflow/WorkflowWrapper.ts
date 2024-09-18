import { Select, useUniqueId } from '@terra-ui-packages/components';
import _ from 'lodash/fp';
import { Fragment, PropsWithChildren, ReactNode } from 'react';
import { div, h, label } from 'react-hyperscript-helpers';
import FooterWrapper from 'src/components/FooterWrapper';
import { centeredSpinner } from 'src/components/icons';
import { TabBar } from 'src/components/tabBars';
import { TopBar } from 'src/components/TopBar';
import { Ajax } from 'src/libs/ajax';
import * as Nav from 'src/libs/nav';
import { useCancellation, useOnMount, useStore, withDisplayName } from 'src/libs/react-utils';
import { snapshotsListStore, snapshotStore } from 'src/libs/state';
import * as Style from 'src/libs/style';

export interface WrapWorkflowOptions {
  breadcrumbs: (props: { name: string; namespace: string }) => ReactNode[];
  activeTab?: string;
}

interface WorkflowWrapperProps extends PropsWithChildren {
  namespace: string;
  name: string;
  snapshotId: string;
}

interface WorkflowContainerProps extends PropsWithChildren {
  namespace: string;
  name: string;
  snapshotId: string;
  tabName: string | undefined;
}

interface WrappedComponentProps {
  namespace: string;
  name: string;
}

type WrappedWorkflowComponent = (props: WrappedComponentProps) => ReactNode;

export const wrapWorkflows = (opts: WrapWorkflowOptions) => {
  const { breadcrumbs, activeTab } = opts;
  return (WrappedComponent: WrappedWorkflowComponent) => {
    const Wrapper = (props: WorkflowWrapperProps) => {
      const { namespace, name, snapshotId } = props;
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
        h(TopBar, { title: 'Broad Methods Repository', href: Nav.getLink('workflows') }, [
          div({ style: Style.breadcrumb.breadcrumb }, [
            div(breadcrumbs(props)),
            div({ style: Style.breadcrumb.textUnderBreadcrumb }, [`${namespace}/${name}`]),
          ]),
        ]),
        div({ role: 'main', style: { flex: 1, display: 'flex', flexFlow: 'column nowrap' } }, [
          snapshotsList
            ? h(WorkflowsContainer, { namespace, name, snapshotId, tabName: activeTab }, [
                h(WrappedComponent, { ...props }),
              ])
            : centeredSpinner(),
        ]),
      ]);
    };
    return withDisplayName('wrapWorkflows', Wrapper);
  };
};

export const WorkflowsContainer = (props: WorkflowContainerProps) => {
  const { namespace, name, snapshotId, tabName, children } = props;
  const signal = useCancellation();
  const cachedSnapshotsList: any = useStore(snapshotsListStore);
  const cachedSnapshot = useStore(snapshotStore);
  // @ts-ignore
  const selectedSnapshot: number | undefined = snapshotId * 1 || _.last(cachedSnapshotsList).snapshotId;
  const snapshotLabelId = useUniqueId();

  const snapshot =
    cachedSnapshot &&
    _.isEqual(
      { namespace, name, snapshotId: selectedSnapshot },
      _.pick(['namespace', 'name', 'snapshotId'], cachedSnapshot)
    )
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
      window.history.replaceState(
        {},
        '',
        Nav.getLink('workflow-dashboard', { namespace, name, snapshotId: selectedSnapshot })
      );
    }
  });

  return h(Fragment, [
    h(
      TabBar,
      {
        'aria-label': 'workflow menu',
        activeTab: tabName,
        tabNames: ['dashboard', 'wdl'],
        displayNames: { configs: 'configurations' },
        getHref: (currentTab) =>
          Nav.getLink(`workflow-${currentTab}`, { namespace, name, snapshotId: selectedSnapshot }),
      },
      [
        label({ htmlFor: snapshotLabelId, style: { marginRight: '1rem' } }, ['Snapshot:']),
        div({ style: { width: 100 } }, [
          h(Select, {
            id: snapshotLabelId,
            value: selectedSnapshot,
            isSearchable: false,
            options: _.map('snapshotId', cachedSnapshotsList),
            onChange: ({ value }: any) => Nav.goToPath(`workflow-${tabName}`, { namespace, name, snapshotId: value }),
          }),
        ]),
      ]
    ),
    snapshot ? div({ style: { flex: 1, display: 'flex', flexDirection: 'column' } }, [children]) : centeredSpinner(),
  ]);
};
