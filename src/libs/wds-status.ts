import { useEffect, useRef, useState } from 'react';
import { Ajax } from 'src/libs/ajax';
import { resolveWdsApp } from 'src/libs/ajax/data-table-providers/WdsDataTableProvider';
import { ListAppResponse } from 'src/libs/ajax/leonardo/models/app-models';
import { useCallback } from 'use-memo-one';

type UseWdsStatusArgs = {
  workspaceId: string;
};

export type WdsStatus = {
  numApps: string | null;

  appName: string | null;
  appStatus: string | null;
  proxyUrl: string | null;

  wdsResponsive: string | null;
  version: string | null;
  chartVersion: string | null;
  image: string | null;

  wdsStatus: string | null;
  wdsDbStatus: string | null;
  wdsPingStatus: string | null;
  wdsIamStatus: string | null;

  defaultInstanceExists: string | null;

  cloneSourceWorkspaceId: string | null;
  cloneStatus: string | null;
};

export type UseWdsStatusResult = {
  status: WdsStatus;
  refreshStatus: () => Promise<void>;
};

const initialStatus: WdsStatus = {
  numApps: null,
  wdsResponsive: null,
  version: null,
  chartVersion: null,
  image: null,
  wdsStatus: null,
  wdsDbStatus: null,
  wdsPingStatus: null,
  wdsIamStatus: null,
  appName: null,
  appStatus: null,
  proxyUrl: null,
  defaultInstanceExists: null,
  cloneSourceWorkspaceId: null,
  cloneStatus: null,
};

export const useWdsStatus = ({ workspaceId }: UseWdsStatusArgs) => {
  const [status, setStatus] = useState<WdsStatus>(() => ({ ...initialStatus }));

  const controllerRef = useRef<AbortController>();
  const refreshStatus = useCallback(async (workspaceId: string) => {
    controllerRef.current?.abort();
    controllerRef.current = new AbortController();
    const signal = controllerRef.current.signal;

    setStatus(() => ({ ...initialStatus }));

    let listAppsResponse: ListAppResponse[];
    try {
      listAppsResponse = await Ajax(signal).Apps.listAppsV2(workspaceId);
    } catch (err) {
      setStatus({
        numApps: 'unknown',
        appName: 'unknown',
        appStatus: 'unknown',
        proxyUrl: 'unknown',
        wdsResponsive: 'unknown',
        version: 'unknown',
        chartVersion: 'unknown',
        image: 'unknown',
        wdsStatus: 'unresponsive',
        wdsDbStatus: 'unknown',
        wdsPingStatus: 'unknown',
        wdsIamStatus: 'unknown',
        defaultInstanceExists: 'unknown',
        cloneSourceWorkspaceId: 'unknown',
        cloneStatus: 'unknown',
      });
      return;
    }

    setStatus((previouStatus) => ({ ...previouStatus, numApps: `${listAppsResponse.length}` }));
    const wdsApp = resolveWdsApp(listAppsResponse);
    if (!wdsApp) {
      setStatus((previousStatus) => ({
        ...previousStatus,
        appName: 'unknown',
        appStatus: 'unknown',
        proxyUrl: 'unknown',
        wdsResponsive: 'unknown',
        version: 'unknown',
        chartVersion: 'unknown',
        image: 'unknown',
        wdsStatus: 'unresponsive',
        wdsDbStatus: 'unknown',
        wdsPingStatus: 'unknown',
        wdsIamStatus: 'unknown',
        defaultInstanceExists: 'unknown',
        cloneSourceWorkspaceId: 'unknown',
        cloneStatus: 'unknown',
      }));
      return;
    }

    const proxyUrl = wdsApp.proxyUrls.wds;
    setStatus((previousStatus) => ({
      ...previousStatus,
      appName: wdsApp.appName,
      appStatus: wdsApp.status,
      proxyUrl,
    }));

    if (wdsApp.status !== 'RUNNING') {
      setStatus((previousStatus) => ({
        ...previousStatus,
        wdsResponsive: 'unknown',
        version: 'unknown',
        chartVersion: 'unknown',
        image: 'unknown',
        wdsStatus: 'unresponsive',
        wdsDbStatus: 'unknown',
        wdsPingStatus: 'unknown',
        wdsIamStatus: 'unknown',
        defaultInstanceExists: 'unknown',
      }));
      return;
    }

    await Promise.allSettled([
      Ajax(signal)
        .WorkspaceData.getVersion(proxyUrl)
        .then((versionResponse) => {
          setStatus((previouStatus) => ({
            ...previouStatus,
            wdsResponsive: 'true',
            version: versionResponse.git?.commit?.id,
            chartVersion: versionResponse.app ? versionResponse.app['chart-version'] : 'unknown',
            image: versionResponse.app ? versionResponse.app.image : 'unknown',
          }));
        })
        .catch(() => {
          setStatus((previouStatus) => ({
            ...previouStatus,
            wdsResponsive: 'false',
            version: 'unknown',
            chartVersion: 'unknown',
            image: 'unknown',
          }));
        }),

      Ajax(signal)
        .WorkspaceData.getStatus(proxyUrl)
        .then((statusResponse) => {
          setStatus((previousStatus) => ({
            ...previousStatus,
            wdsStatus: statusResponse.status,
            wdsDbStatus: statusResponse.components?.db?.status,
            wdsPingStatus: statusResponse.components?.ping?.status,
            // "Permissions" component only exists in WDS after 3da9bfc; be resilient
            wdsIamStatus: statusResponse.components?.Permissions
              ? statusResponse.components?.Permissions?.status
              : 'disabled',
          }));
        })
        .catch(() => {
          setStatus((previousStatus) => ({
            ...previousStatus,
            wdsStatus: 'unresponsive',
            wdsDbStatus: 'unknown',
            wdsPingStatus: 'unknown',
            wdsIamStatus: 'unknown',
          }));
        }),

      Ajax(signal)
        .WorkspaceData.listInstances(proxyUrl)
        .then((instancesResponse) => {
          setStatus((previousStatus) => ({
            ...previousStatus,
            defaultInstanceExists: instancesResponse.includes(workspaceId) ? 'true' : 'false',
          }));
        })
        .catch(() => {
          setStatus((previousStatus) => ({
            ...previousStatus,
            defaultInstanceExists: 'unknown',
          }));
        }),

      Ajax(signal)
        .WorkspaceData.getCloneStatus(proxyUrl)
        .then((cloneStatusResponse) => {
          setStatus((previousStatus) => ({
            ...previousStatus,
            cloneSourceWorkspaceId: cloneStatusResponse.result.sourceWorkspaceId,
            cloneStatus: cloneStatusResponse.result.status,
          }));
        })
        .catch((err) => {
          if (!(err instanceof Response && err.status === 404)) {
            setStatus((previousStatus) => ({
              ...previousStatus,
              cloneSourceWorkspaceId: 'unknown',
              cloneStatus: 'unknown',
            }));
          }
        }),
    ]);
  }, []);

  useEffect(() => {
    refreshStatus(workspaceId);
    return () => {
      controllerRef.current?.abort();
    };
  }, [refreshStatus, workspaceId]);

  return { status, refreshStatus };
};
