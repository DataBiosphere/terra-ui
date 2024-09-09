import { LoadedState } from '@terra-ui-packages/core-utils';
import _ from 'lodash';
import { useCallback, useEffect, useState } from 'react';
import { authOpts } from 'src/auth/auth-session';
import { Ajax } from 'src/libs/ajax';
import { fetchWDS } from 'src/libs/ajax/ajax-common';
import { DataTableProvider } from 'src/libs/ajax/data-table-providers/DataTableProvider';
import {
  RecordTypeSchema,
  resolveWdsApp,
  WdsDataTableProvider,
} from 'src/libs/ajax/data-table-providers/WdsDataTableProvider';
import { appStatuses, ListAppItem } from 'src/libs/ajax/leonardo/models/app-models';
import { Capabilities } from 'src/libs/ajax/WorkspaceDataService';
import { getConfig } from 'src/libs/config';
import { reportError } from 'src/libs/error';
import { useCancellation } from 'src/libs/react-utils';

export interface UseEntityMetadataResult {
  wdsTypesResult: LoadedState<RecordTypeSchema[], string>;
  wdsDataTableProviderResult: LoadedState<DataTableProvider, string>;
  entityMetadataResult: any;
  snapshotMetadataErrorResult: boolean | undefined;
  wdsAppStatusResult: string;
  //   loadWdsTypesResult: () => Promise<void>;
}

export const useEntityMetadata = (workspaceId: string): LoadedState<UseEntityMetadataResult> => {
  const [wdsApp, setWdsApp] = useState<LoadedState<ListAppItem | undefined, string>>({
    status: 'None',
  });
  const [wdsTypes, setWdsTypes] = useState<LoadedState<RecordTypeSchema[], string>>({
    status: 'None',
  });
  const [wdsCapabilities, setWdsCapabilities] = useState<LoadedState<Capabilities, string>>({
    status: 'None',
  });
  const [wdsDataTableProvider, setWdsDataTableProvider] = useState<LoadedState<DataTableProvider, string>>({
    status: 'None',
  });
  const [wdsUrl, setWdsUrl] = useState<LoadedState<string, string>>({ status: 'None' });

  const [useCwds, setUseCwds] = useState<boolean | undefined>(undefined);

  // TODO clean this up
  const isInTerminalStatus = (status: string): boolean => ['Ready', 'Error', 'RUNNING', 'ERROR'].includes(status);

  const isReady = isInTerminalStatus(wdsTypes.status) && isInTerminalStatus(wdsDataTableProvider.status);
  // isInTerminalStatus(wdsApp.status);
  //   const pollWdsInterval = useRef<Timeout | undefined>(undefined);
  const signal = useCancellation();

  const loadWdsApp = useCallback(async () => {
    try {
      const apps = await Ajax().Apps.listAppsV2(workspaceId);
      const foundApp = resolveWdsApp(apps);
      switch (foundApp?.status) {
        case appStatuses.provisioning.status:
        case appStatuses.updating.status:
          setWdsApp({ status: 'Loading', state: foundApp });
          break;
        case appStatuses.running.status:
          setWdsApp({ status: 'Ready', state: foundApp });
          return foundApp;
        case appStatuses.error.status:
          setWdsApp({ status: 'Error', state: foundApp, error: 'Error resolving WDS app' });
          break;
        default:
          if (foundApp?.status) {
            // eslint-disable-next-line no-console
            console.log(`Unhandled state [${foundApp?.status} while polling WDS`);
          }
      }
    } catch (error) {
      setWdsApp({ status: 'Error', state: null, error: 'Error resolving WDS app' });
      reportError('Error resolving WDS app', error);
    }
  }, [workspaceId]);

  const loadWdsCapabilities = useCallback(async () => {
    if (wdsUrl.status === 'Ready' && wdsCapabilities.status === 'None') {
      // No need to call again if loading, ready, or errored
      setWdsCapabilities({ status: 'Loading', state: null });
      try {
        const capabilitiesResult = await Ajax(signal).WorkspaceData.getCapabilities(wdsUrl.state);
        setWdsCapabilities({ status: 'Ready', state: capabilitiesResult });
        return capabilitiesResult;
      } catch (error) {
        setWdsCapabilities({ status: 'Error', state: null, error: 'Error loading WDS capabilities' });
        reportError(`Error loading WDS capabilities: ${error}`);
      }
    } else if (wdsUrl.status === 'Error') {
      setWdsCapabilities({ status: 'Error', state: null, error: 'No WDS Url' });
    }
  }, [signal, wdsUrl, wdsCapabilities]);

  const loadWdsDataTableProvider = useCallback(() => {
    if (wdsUrl.status === 'Ready' && wdsCapabilities.status === 'Ready') {
      setWdsDataTableProvider({
        status: 'Ready',
        state: new WdsDataTableProvider(workspaceId, wdsUrl.state, wdsCapabilities.state),
      });
    }
  }, [workspaceId, wdsCapabilities, wdsUrl]);

  const loadWdsTypes = useCallback(async () => {
    if (!isInTerminalStatus(wdsTypes.status) && wdsUrl.status === 'Ready') {
      try {
        const typesResult = await Ajax(signal).WorkspaceData.getSchema(wdsUrl.state, workspaceId);
        setWdsTypes({ status: 'Ready', state: typesResult });
      } catch (error) {
        setWdsTypes({ status: 'Error', state: null, error: 'Error loading WDS schema' });
        reportError('Error loading WDS schema', error);
      }
    } else if (wdsUrl.status === 'Error') {
      setWdsTypes({ status: 'Error', state: null, error: 'No WDS Url' });
    }
  }, [wdsTypes, wdsUrl, signal, workspaceId]);

  const loadWdsData = useCallback(async () => {
    if (wdsUrl.status === 'Ready') {
      if (wdsTypes.status !== 'Ready') {
        await loadWdsTypes();
      }
      if (wdsCapabilities.status !== 'Ready') {
        await loadWdsCapabilities();
      }
      if (useCwds !== undefined && wdsCapabilities.status === 'Ready') {
        loadWdsDataTableProvider();
      }
    } else if (wdsUrl.status === 'Error') {
      // Error everything out
      setWdsTypes({ status: 'Error', state: null, error: 'wdsUrl in error' });
      setWdsCapabilities({ status: 'Error', state: null, error: 'wdsUrl in error' });
      setWdsDataTableProvider({ status: 'Error', state: null, error: 'wdsUrl in error' });

      setWdsApp({ status: 'Error', state: null, error: 'wdsUrl in error' });
    } else if (useCwds !== undefined && !useCwds && wdsUrl.status === 'Loading') {
      if (wdsApp.status === 'None') {
        // TODO should I check for loading as well?
        // Try to load the proxy URL
        await loadWdsApp();
        // const foundApp = await loadWdsApp();
        // if (foundApp) {
        //   setWdsApp({ status: 'Ready', state: foundApp });
        // }
        // } else {
        //   console.log('no app found, setting to error: ', foundApp);
        //   setWdsApp({ status: 'Error', state: null, error: 'No WDS app exists' });
        // }
      } else if (wdsApp.status === 'Ready') {
        const proxyUrl = wdsApp.state?.proxyUrls?.wds;
        if (proxyUrl) {
          setWdsUrl({ status: 'Ready', state: proxyUrl });
        } else {
          setWdsUrl({ status: 'Error', state: null, error: 'No proxyUrl for WDSApp' });
          // If we can't connect to the app, it's the same as being in error
          //   console.log('no proxyurl found, setting to error: ', wdsApp);

          setWdsApp({ status: 'Error', state: null, error: 'No proxyUrl for WDSApp' });
        }
      } else if (wdsApp.status === 'Error') {
        // TODO clean up this logic, just making sure the url gets set
        setWdsTypes({ status: 'Error', state: null, error: 'WdsApp in error' });
        setWdsCapabilities({ status: 'Error', state: null, error: 'WdsApp in error' });
        setWdsDataTableProvider({ status: 'Error', state: null, error: 'WdsApp in error' });
        setWdsUrl({ status: 'Error', state: null, error: 'WdsApp in error' });
      }
    }
  }, [
    wdsUrl,
    loadWdsTypes,
    wdsTypes,
    wdsCapabilities,
    loadWdsCapabilities,
    useCwds,
    loadWdsDataTableProvider,
    wdsApp,
    loadWdsApp,
  ]);

  useEffect(() => {
    const checkCWDS = async (): Promise<void> => {
      const cwdsURL = getConfig().cwdsUrlRoot;
      try {
        const response = await fetchWDS(cwdsURL)(`collections/v1/${workspaceId}`, _.merge(authOpts(), { signal }));
        const data = await response.json();
        if (Object.keys(data).length !== 0) {
          setWdsUrl({ status: 'Ready', state: cwdsURL });
          setUseCwds(true);
          setWdsApp({ status: 'Ready', state: undefined }); // No app needed for CWDS
        } else {
          setWdsUrl({ status: 'Loading', state: null });
          setUseCwds(false);
        }
      } catch (error) {
        console.error(error);
        setWdsUrl({ status: 'Loading', state: null });
        setUseCwds(false);
      }
    };

    if (useCwds === undefined) {
      checkCWDS();
    }
  }, [signal, workspaceId, wdsUrl, useCwds, wdsTypes, loadWdsData]);

  useEffect(() => {
    if (
      !isInTerminalStatus(wdsTypes.status) ||
      !isInTerminalStatus(wdsCapabilities.status) ||
      !isInTerminalStatus(wdsDataTableProvider.status)
    ) {
      loadWdsData();
    }
  }, [loadWdsData, wdsTypes, wdsCapabilities, wdsDataTableProvider]);

  // TODO need to have this polling to keep data page up to date, unsure if it should be here or in Data.js or how to change it
  //   useEffect(() => {
  //     // if (isAzureWorkspace) {
  //     // Start polling if we're missing WDS Types, and stop polling when we have them.
  //     // console.log('useeffect with loadwdsdata');
  //     // if ((!wdsTypes || !['Ready', 'Error'].includes(wdsTypes.status)) && !pollWdsInterval.current) {
  //     //   pollWdsInterval.current = setInterval(loadWdsData, 30 * 1000);
  //     // } else if (wdsTypes?.status === 'Ready' && pollWdsInterval.current) {
  //     //   clearInterval(pollWdsInterval.current);
  //     //   pollWdsInterval.current = undefined;
  //     //   }
  //     if (wdsTypes.status !== 'Ready' && wdsCapabilities.status !== 'Ready') {
  //       console.log('useeffect: calling loadwdsdata');
  //       loadWdsData();
  //     }
  //   }, [loadWdsData, wdsTypes, wdsCapabilities]);

  return {
    status: isReady ? 'Ready' : 'Loading',
    state: {
      wdsTypesResult: wdsTypes,
      wdsDataTableProviderResult: wdsDataTableProvider,
      entityMetadataResult: {},
      snapshotMetadataErrorResult: false,
      wdsAppStatusResult: wdsApp.status,
      //   loadWdsTypesResult: loadWdsTypes,
    },
  };
};
