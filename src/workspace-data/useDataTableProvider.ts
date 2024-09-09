import { LoadedState } from '@terra-ui-packages/core-utils';
import _ from 'lodash';
import { Dispatch, SetStateAction, useCallback, useEffect, useMemo, useState } from 'react';
import { authOpts } from 'src/auth/auth-session';
import { Ajax } from 'src/libs/ajax';
import { fetchWDS } from 'src/libs/ajax/ajax-common';
import { Ajax } from 'src/libs/ajax';
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

/**
 * Get a workspace data table provider.
 *
 * @param workspaceId - Workspace id
 * @returns WdsDataTableProvider - Workspace data table provider
 * @returns LoadedState<ListAppItem, string> - WDS app state
 * @returns LoadedState<RecordTypeSchema[], string> - WDS types state
 * @returns Dispatch<SetStateAction<LoadedState<RecordTypeSchema[], string>>> - WDS types setter
 *  @returns () => Promise<void> - Function to load WDS data
 */
export const useDataTableProvider = (
  workspaceId: string
): [
  WdsDataTableProvider,
  LoadedState<ListAppItem, string>,
  LoadedState<RecordTypeSchema[], string>,
  Dispatch<SetStateAction<LoadedState<RecordTypeSchema[], string>>>,
  () => Promise<void>
] => {
  const [wdsApp, setWdsApp] = useState<LoadedState<ListAppItem, string>>({ status: 'None' });
  const [wdsTypes, setWdsTypes] = useState<LoadedState<RecordTypeSchema[], string>>({ status: 'None' });
  const [wdsCapabilities, setWdsCapabilities] = useState<LoadedState<Capabilities, string>>({ status: 'None' });
  const [useCwds, setUseCwds] = useState<LoadedState<boolean>>({ status: 'None' });
  const [wdsUrl, setWdsUrl] = useState<LoadedState<string>>({ status: 'None' });
  const cwdsURL = getConfig().cwdsUrlRoot;

  const signal = useCancellation();
  const wdsDataTableProvider = useMemo(() => {
    const proxyUrl = wdsUrl.status === 'Ready' ? wdsUrl.state : '';
    return new WdsDataTableProvider(
      workspaceId,
      proxyUrl,
      wdsCapabilities.status === 'Ready' ? wdsCapabilities.state : {}
    );
  }, [workspaceId, wdsCapabilities, wdsUrl]);

  // returns the found app only if it is in a ready state,
  // otherwise returns undefined
  const loadWdsApp = useCallback(() => {
    return Ajax()
      .Apps.listAppsV2(workspaceId)
      .then((apps) => {
        const foundApp = resolveWdsApp(apps);
        switch (foundApp?.status) {
          case appStatuses.provisioning.status:
          case appStatuses.updating.status:
            setWdsApp({ status: 'Loading', state: foundApp });
            break;
          case appStatuses.running.status:
            setWdsApp({ status: 'Ready', state: foundApp });
            setWdsUrl({ status: 'Ready', state: foundApp.proxyUrls?.wds });
            break;
          case appStatuses.error.status:
            setWdsApp({ status: 'Error', state: foundApp, error: 'Error in WDS app' }); // todo get real error?
            break;
          default:
            if (foundApp?.status) {
              // eslint-disable-next-line no-console
              console.log(`Unhandled state [${foundApp?.status} while polling WDS`);
            }
        }
      })
      .catch((error) => {
        setWdsApp({ status: 'Error', state: null, error: 'Error resolving WDS app' });
        reportError('Error resolving WDS app', error);
      });
  }, [setWdsApp, workspaceId]);

  const loadWdsTypes = useCallback(() => {
    // setWdsTypes({ status: 'None' }); //TODO I don't think we need this since we initialize it to None
    if (wdsUrl.status === 'Ready') {
      return Ajax(signal)
        .WorkspaceData.getSchema(wdsUrl.state, workspaceId)
        .then((typesResult) => {
          setWdsTypes({ status: 'Ready', state: typesResult });
        })
        .catch((error) => {
          setWdsTypes({ status: 'Error', state: null, error: 'Error loading WDS schema' });
          reportError('Error loading WDS schema', error);
        });
    }
  }, [signal, setWdsTypes, wdsUrl, workspaceId]);

  const loadWdsCapabilities = useCallback(async () => {
    if (wdsUrl.status === 'Ready') {
      try {
        const capabilitiesResult = await Ajax(signal).WorkspaceData.getCapabilities(wdsUrl.state);
        setWdsCapabilities({ status: 'Ready', state: capabilitiesResult });
      } catch (error) {
        setWdsCapabilities({ status: 'Error', state: null, error: 'Error loading WDS capabilities' });
        reportError('Error loading WDS capabilities', error);
      }
    }
  }, [signal, setWdsCapabilities, wdsUrl]);

  const loadWdsData = useCallback(async () => {
    if (useCwds.status === 'Ready') {
      // Try to load the proxy URL
      if (!['Ready', 'Error'].includes(wdsApp.status)) {
        await loadWdsApp();
      }
    }
  }, [wdsApp, loadWdsApp, useCwds]);

  useEffect(() => {
    if (useCwds.status === 'Ready' && wdsApp.status === 'None') {
      loadWdsApp();
    }
    if (wdsUrl.status === 'Ready') {
      loadWdsTypes();
      loadWdsCapabilities();
    }
  }, [wdsUrl, loadWdsTypes, loadWdsCapabilities, useCwds, wdsApp, loadWdsApp]);

  useEffect(() => {
    const checkCWDS = async (): Promise<void> => {
      try {
        const response = await fetchWDS(cwdsURL)(`collections/v1/${workspaceId}`, _.merge(authOpts(), { signal }));
        const data = await response.json();
        if (Object.keys(data).length !== 0) {
          setWdsUrl({ status: 'Ready', state: cwdsURL });
          setUseCwds({ status: 'Ready', state: true });
          // setWdsApp({ status: 'Ready', state: undefined }); // No app needed for CWDS
        } else {
          setWdsUrl({ status: 'Loading', state: null });
          setUseCwds({ status: 'Ready', state: false });
        }
      } catch (error) {
        console.error(error);
        setWdsUrl({ status: 'Loading', state: null });
        setUseCwds({ status: 'Ready', state: false });
      }
    };

    if (useCwds.status !== 'Ready') {
      checkCWDS();
    }
  }, [signal, workspaceId, useCwds, wdsTypes, cwdsURL]);


  return [wdsDataTableProvider, wdsApp, wdsTypes, setWdsTypes, loadWdsData];
};
