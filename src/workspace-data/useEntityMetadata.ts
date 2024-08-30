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
  loadWdsDataResult: () => Promise<void>;
  dataTableProviderResult: LoadedState<DataTableProvider>;
  entityMetadataResult: any;
  snapshotMetadataErrorResult: boolean | undefined;
  wdsAppResult: LoadedState<ListAppItem | undefined, string>;
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
  const [wdsDataTableProvider, setWdsDataTableProvider] = useState<LoadedState<DataTableProvider>>({ status: 'None' });
  const [wdsUrl, setWdsUrl] = useState<LoadedState<string>>({ status: 'None' });

  const [isProviderCreated, setIsProviderCreated] = useState(false);

  const isReady = wdsTypes.status === 'Ready' && wdsDataTableProvider.status === 'Ready' && wdsApp.status === 'Ready';
  const signal = useCancellation();

  const checkCWDS = useCallback(async (): Promise<string | undefined> => {
    console.log('checkCWDS');
    const cwdsURL = getConfig().cwdsUrlRoot;
    try {
      const response = await fetchWDS(cwdsURL)(`collections/v1/${workspaceId}`, _.merge(authOpts(), { signal }));
      const data = await response.json();
      console.log('checkcwds completed with data:', data);
      // return !data.isEmpty;
      if (!data.isEmpty) {
        return cwdsURL;
      }
      console.log('checkcwds completed with empty data');
      return undefined;
    } catch (error) {
      console.error(error);
      console.log('checkcwds completed with error');
      return undefined;
    }
  }, [signal, workspaceId]);

  // This is just passed to WdsDataTableProvider
  const loadWdsCapabilities = useCallback(
    async (url: string) => {
      console.log('loadWdsCapabilities');
      setWdsCapabilities({ status: 'Loading', state: null });
      try {
        const capabilitiesResult = await Ajax(signal).WorkspaceData.getCapabilities(url);
        setWdsCapabilities({ status: 'Ready', state: capabilitiesResult });
      } catch (error) {
        setWdsCapabilities({ status: 'Error', state: null, error: 'Error loading WDS capabilities' });
        reportError('Error loading WDS capabilities', error);
      }
    },
    [signal]
  );

  // WdsTypes is used inside a useEffect in Data.js
  const loadWdsTypes = useCallback(
    (url: string) => {
      console.log('loadWdsTypes');
      setWdsTypes({ status: 'Loading', state: null });
      return Ajax(signal) // change to const result = await...
        .WorkspaceData.getSchema(url, workspaceId)
        .then((typesResult) => {
          setWdsTypes({ status: 'Ready', state: typesResult }); // change to use await
        })
        .catch((error) => {
          setWdsTypes({ status: 'Error', state: null, error: 'Error loading WDS schema' });
          reportError('Error loading WDS schema', error);
        });
    },
    [workspaceId, signal]
  );

  // WdsApp is passed to WdsDataTableProvider
  // It is also a dependency for the useEffect in Data.js
  // We also have a number of variables based on its state
  // returns the found app only if it is in a ready state,
  // otherwise returns undefined
  const loadWdsApp = useCallback(async () => {
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
    // })
    // .catch((error) => {
    //   setWdsApp({ status: 'Error', state: null, error: 'Error resolving WDS app' });
    //   reportError('Error resolving WDS app', error);
    // });
  }, [workspaceId]);

  // This method is used inside a useEffect in Data.js
  const loadWdsData = useCallback(
    async () => {
      // Try to load the proxy URL
      if (!wdsApp || !['Ready', 'Error'].includes(wdsApp.status)) {
        const foundApp = await loadWdsApp();
        // TODO: figure out how not to make this redundant fetch, per
        // https://github.com/DataBiosphere/terra-ui/pull/4202#discussion_r1319145491
        if (foundApp) {
          loadWdsTypes(foundApp.proxyUrls?.wds);
          loadWdsCapabilities(foundApp.proxyUrls?.wds);
        }
      }
      // If we have the proxy URL try to load the WDS types
      else if (wdsApp?.status === 'Ready') {
        const proxyUrl = wdsApp?.state?.proxyUrls?.wds;
        if (proxyUrl) {
          await loadWdsTypes(proxyUrl);
          await loadWdsCapabilities(proxyUrl);
        }
      }
    },
    // }, [wdsApp, loadWdsApp, loadWdsTypes, loadWdsCapabilities, workspaceId]);
    [loadWdsCapabilities, loadWdsTypes, loadWdsApp, wdsApp]
  );

  //   const azureLoadEntityMetadata = async () => {
  //     // This is not used for Azure Workspaces, but if left undefined the page will spin forever
  //     setEntityMetadata({});
  //   };

  //   const azureLoadSnapshotMetadata = async () => {
  //     setSnapshotMetadataError(false);
  //   };

  // const createWdsDataTableProvider = useMemo(
  //   (proxyUrl: string) => {
  //     console.log('createWdsDataTableProvider');
  //     setWdsDataTableProvider({
  //       status: 'Ready',
  //       state: new WdsDataTableProvider(workspaceId, proxyUrl, wdsCapabilities.state),
  //     });
  //   },
  //   [wdsCapabilities, workspaceId]
  // );

  // // TODO how to make this render only once, AFTER the data is loaded?
  // const loadWdsDataTableProvider = useCallback(() => {
  //   console.log('loadWdsDataTableProvider');
  //   if (wdsApp.status === 'Ready' && wdsCapabilities.status === 'Ready') {
  //     const app = wdsApp.state;
  //     const proxyUrl = app?.proxyUrls?.wds;
  //     if (proxyUrl) {
  //       createWdsDataTableProvider(proxyUrl);
  //       // setWdsDataTableProvider({
  //       //   status: 'Ready',
  //       //   state: new WdsDataTableProvider(workspaceId, proxyUrl, wdsCapabilities.state),
  //       // });
  //     }
  //   }
  // }, [wdsApp, wdsCapabilities, createWdsDataTableProvider]);

  useEffect(() => {
    // Function to create WdsDataTableProvider
    const createProvider = (proxyUrl: string, capabilities: Capabilities) => {
      console.log('Creating WdsDataTableProvider');
      setWdsDataTableProvider({
        status: 'Ready',
        state: new WdsDataTableProvider(workspaceId, proxyUrl, capabilities), // Note: passing in capabilities so that it knows it exists
      });
      setIsProviderCreated(true); // Mark as created
    };

    console.log('Checking readiness for WdsDataTableProvider creation');
    if (wdsApp.status === 'Ready' && wdsCapabilities.status === 'Ready' && !isProviderCreated) {
      const app = wdsApp.state;
      const proxyUrl = app?.proxyUrls?.wds;
      if (proxyUrl) {
        createProvider(proxyUrl, wdsCapabilities.state);
      }
    }
  }, [wdsApp, wdsCapabilities, workspaceId, isProviderCreated]); // Add isProviderCreated to the dependency array

  useEffect(() => {
    const initializeData = async () => {
      const cwdsCheckResult = await checkCWDS();
      if (cwdsCheckResult) {
        console.log('Using CWDS, initializing other data...');
        setWdsUrl({ status: 'Ready', state: cwdsCheckResult });
        loadWdsCapabilities(cwdsCheckResult);
        loadWdsTypes(cwdsCheckResult);
      } else {
        console.log('Using WDS app');
        // Handle the case where checkCWDS fails, if necessary
        const foundApp = await loadWdsApp();
        if (foundApp) {
          loadWdsTypes(foundApp.proxyUrls?.wds);
          loadWdsCapabilities(foundApp.proxyUrls?.wds);
        }
      }
    };

    initializeData().catch(console.error);
  }, [checkCWDS, loadWdsApp, loadWdsCapabilities, loadWdsTypes]);

  return {
    status: isReady ? 'Ready' : 'Loading',
    state: {
      wdsTypesResult: wdsTypes,
      loadWdsDataResult: loadWdsData,
      dataTableProviderResult: wdsDataTableProvider,
      entityMetadataResult: {},
      snapshotMetadataErrorResult: false,
      wdsAppResult: wdsApp,
    },
    // wdsTypes,
    // loadWdsData,
    // dataTableProvider: wdsDataTableProvider,
    // entityMetadata: {},
    // snapshotMetadataError: false,
    // wdsApp,
  };
};
