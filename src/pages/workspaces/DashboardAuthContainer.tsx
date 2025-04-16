import { cond, DEFAULT } from '@terra-ui-packages/core-utils';
import _ from 'lodash/fp';
import React, { ReactNode, useEffect, useState } from 'react';
import { centeredSpinner } from 'src/components/icons';
import { FirecloudBucket } from 'src/libs/ajax/firecloud/FirecloudBucket';
import { WorkspaceWrapper } from 'src/libs/ajax/workspaces/workspace-models';
import { Workspaces } from 'src/libs/ajax/workspaces/Workspaces';
import { useCancellation, useStore } from 'src/libs/react-utils';
import { authStore } from 'src/libs/state';
import SignIn from 'src/pages/SignIn';
import DashboardPublic from 'src/pages/workspaces/DashboardPublic';
import { WorkspaceDashboardPage } from 'src/workspaces/dashboard/WorkspaceDashboardPage';

export interface DashboardAuthContainerNameProps {
  namespace: string;
  name: string;
}

export interface DashboardAuthContainerIdProps {
  id: string;
}

export type DashboardAuthContainerProps = DashboardAuthContainerNameProps | DashboardAuthContainerIdProps;

const getWorkspaceNamespaceAndName = async (
  props: DashboardAuthContainerProps,
  signal: AbortSignal
): Promise<DashboardAuthContainerNameProps> => {
  const { id } = props as DashboardAuthContainerIdProps;
  const workspace: WorkspaceWrapper = await Workspaces(signal).getById(id, []);
  return { namespace: workspace.workspace.namespace, name: workspace.workspace.name };
};

export const DashboardAuthContainer = (props: DashboardAuthContainerProps): ReactNode => {
  const [namespace, setNamespace] = useState<string>('');
  const [name, setName] = useState<string>('');
  const { signInStatus } = useStore(authStore);
  const [featuredWorkspaces, setFeaturedWorkspaces] = useState<{ name: string; namespace: string }[]>();

  const isAuthInitialized = signInStatus !== 'uninitialized';

  const signal = useCancellation();

  useEffect(() => {
    const fetchData = async () => {
      setFeaturedWorkspaces(await FirecloudBucket().getFeaturedWorkspaces());
    };
    if (signInStatus === 'signedOut') {
      fetchData();
    }
  }, [signInStatus]);

  useEffect(() => {
    const fetchNamespaceAndName = async () => {
      if (signInStatus === 'userLoaded') {
        const { namespace, name } = await getWorkspaceNamespaceAndName(props, signal);
        setNamespace(namespace);
        setName(name);
        document.title = `${name} - Dashboard`;
      }
    };
    if ('namespace' in props && 'name' in props) {
      setNamespace(props.namespace);
      setName(props.name);
    } else {
      fetchNamespaceAndName();
    }
  }, [props, signal, signInStatus]);

  const isFeaturedWorkspace = () => _.some((ws) => ws.namespace === namespace && ws.name === name, featuredWorkspaces);

  return cond(
    [
      !isAuthInitialized || (signInStatus === 'signedOut' && featuredWorkspaces === undefined),
      () => centeredSpinner({ style: { position: 'fixed' } }),
    ],
    [signInStatus === 'signedOut' && isFeaturedWorkspace(), () => <DashboardPublic {...{ name, namespace }} />],
    [signInStatus === 'signedOut', () => <SignIn />],
    [DEFAULT, () => namespace && name && <WorkspaceDashboardPage {...{ name, namespace }} />]
  );
};
