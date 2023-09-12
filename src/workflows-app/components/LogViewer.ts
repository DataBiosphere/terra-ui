import { LoadedState } from '@terra-ui-packages/core-utils';
import _ from 'lodash/fp';
import { useCallback, useEffect, useState } from 'react';
import { dd, div, dl, dt, h, span } from 'react-hyperscript-helpers';
import { ButtonOutline } from 'src/components/common';
import { centeredSpinner, icon } from 'src/components/icons';
import Modal from 'src/components/Modal';
import { InfoBox } from 'src/components/PopupTrigger';
import { SimpleTabBar } from 'src/components/tabBars';
import { isAzureUri } from 'src/data/data-table/uri-viewer/uri-viewer-utils';
import { Ajax } from 'src/libs/ajax';
import { useCancellation } from 'src/libs/react-utils';
import { newTabLinkProps } from 'src/libs/utils';
/**
 * Information needed to preview a log file.
 * @member logUri - The URI of the log file. Must be a valid Azure blob URI. No Sas token should be appended: a fresh one will be obtained.
 * @member logTitle - The title of the log. Displayed to the user as a tab title.
 * @member logKey - A unique key for this particular log.
 * @member logFilename - The filename of this particular log. Does not need to be unique.
 */
export type LogInfo = {
  logUri: string;
  logTitle: string;
  logKey: string;
  logFilename: string;
};

/**
 * Props for the LogViewer component.
 * @member modalTitle - Should represent the group of logs being displayed. E.g. "Task Logs"
 * @member logs - An array of LogInfo objects.
 */
export type LogViewerProps = {
  modalTitle: string;
  logs: LogInfo[];
  onDismiss: () => void;
};

/**
 * Props for the SimpleTab component. See src/components/tabBars.js
 */
type SimpleTabProps = {
  key: string;
  title: string;
  width: number;
};

/**
 * Represents data that has been fetched using an Azure Blob URI
 */
type FetchedLogData = {
  /** The character data of the log file */
  textContent: string | undefined;
  /** The URI to use for downloading the log file. May or may not have sas token appended, depending on if the file is public or private.  */
  downloadUri: string | undefined;
};

const logLoadingErrorMessage =
  "Log file could not be loaded. If the workflow or task is still in progress, the log file likely hasn't been generated yet. Some logs may be unavailable if the workflow or task failed before they could be generated.";
const modalMaxWidth = 1100;
const tabMaxWidth = modalMaxWidth / 4 - 20;

export const LogViewer = ({ modalTitle, logs, onDismiss }: LogViewerProps) => {
  const [currentlyActiveLog, setCurrentlyActiveLog] = useState<LogInfo | undefined>(
    _.isEmpty(logs) ? undefined : logs[0]
  );

  const [activeTextContent, setActiveTextContent] = useState<LoadedState<string>>({
    status: 'Loading',
    state: null,
  });
  const [activeDownloadUri, setActiveDownloadUri] = useState<string | undefined>(undefined);
  const signal = useCancellation();
  const fetchLogContent = useCallback(
    async (azureBlobUri: string): Promise<FetchedLogData | null> => {
      if (!isAzureUri(azureBlobUri)) {
        return null;
      }
      try {
        const response = await Ajax(signal).AzureStorage.blobMetadata(azureBlobUri).getData();
        const uri = _.isEmpty(response.azureSasStorageUrl) ? response.azureStorageUrl : response.azureSasStorageUrl;
        return { textContent: response.textContent, downloadUri: uri };
      } catch (e) {
        return null;
      }
    },
    [signal]
  );

  useEffect(() => {
    const loadAzureLog = async (logUri: string) => {
      const res = await fetchLogContent(logUri);
      if (_.isEmpty(res?.textContent)) {
        setActiveDownloadUri(undefined);
        setActiveTextContent({
          status: 'Error',
          state: null,
          error: { name: 'Log Download Error', message: logLoadingErrorMessage },
        });
      } else {
        const content = res?.textContent;
        setActiveDownloadUri(res?.downloadUri);
        setActiveTextContent({
          status: 'Ready',
          state: _.isEmpty(content) ? '' : content,
        });
      }
    };

    // when switching tabs, switch to loading state while we fetch new content.
    setActiveTextContent({
      status: 'Loading',
      state: null,
    });
    setActiveDownloadUri(undefined);

    // tab switching set the currently active log (which triggers this effect). Fetch the content for the new log.
    const uri = currentlyActiveLog?.logUri;
    if (!_.isEmpty(uri)) {
      loadAzureLog(uri);
    }
  }, [logs, currentlyActiveLog, fetchLogContent]);

  const renderActiveTextContent = () => {
    switch (activeTextContent.status) {
      case 'Loading':
        return div([centeredSpinner()]);
      case 'Error':
        return div([activeTextContent.error.message]);
      case 'Ready':
        return div([activeTextContent.state]);
      default:
        return div(['Unknown error']);
    }
  };

  const tabsArray: SimpleTabProps[] = logs.map((log) => {
    return { key: log.logKey, title: log.logTitle, width: tabMaxWidth };
  });

  return h(
    Modal,
    {
      onDismiss,
      title: modalTitle,
      titleChildren: h(
        InfoBox,
        {
          style: { marginLeft: '1ch' },
          tooltip: undefined,
          size: undefined,
          side: undefined,
          iconOverride: undefined,
        },
        [
          dl([
            dt({ style: { fontWeight: 'bold' } }, ['Execution:']),
            dd({ style: { marginBottom: '0.5rem' } }, [
              'Each workflow has a single execution log which comes from the engine running your workflow. Errors in this log might indicate a Terra systems issue, or a problem parsing your WDL.',
            ]),
            dt({ style: { fontWeight: 'bold' } }, ['Task Standard Out/Error:']),
            dd({ style: { marginBottom: '0.5rem' } }, [
              "Task logs are from user-defined commands in your WDL. You might see an error in these logs if there was a logic or syntax error in a command, or if something went wrong with the tool you're running.",
            ]),
            dt({ style: { fontWeight: 'bold' } }, ['Backend Standard Out/Error:']),
            dd({ style: { marginBottom: '0.5rem' } }, [
              "Backend logs are from the Azure Cloud compute job that prepares your task to run and cleans up afterwards. You might see errors in these logs if the there was a problem downloading the task's input files or pulling its container, or if something went wrong on the compute node while the task was running.",
            ]),
          ]),
        ]
      ),
      showCancel: false,
      showX: true,
      showButtons: false,
      width: modalMaxWidth,
    },
    [
      h(
        SimpleTabBar,
        {
          value: currentlyActiveLog?.logKey,
          'aria-label': 'Log file tabs',
          onChange: (key: string) => {
            const newLog = logs.find((log) => log.logKey === key);
            setCurrentlyActiveLog(newLog);
          },
          tabs: tabsArray,
        },
        [
          div(
            {
              style: {
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingTop: '0.5rem',
              },
            },
            [
              span({}, [
                span({ style: { paddingRight: '0.5rem', fontWeight: 'bold', fontSize: 16 } }, ['File:']),
                span({ style: { fontSize: 16 } }, [currentlyActiveLog?.logFilename]),
              ]),
              !_.isEmpty(activeDownloadUri) &&
                h(
                  ButtonOutline,
                  {
                    'aria-label': 'Download log',
                    disabled: _.isEmpty(currentlyActiveLog?.logUri),
                    href: activeDownloadUri,
                    download: activeDownloadUri,
                    ...newTabLinkProps,
                  },
                  [span([icon('download', { style: { marginRight: '1ch' } }), 'Download'])]
                ),
            ]
          ),
          div(
            {
              'aria-label': 'Log file content',
              style: {
                fontFamily: 'Menlo, monospace',
                overflowY: 'auto',
                whiteSpace: 'pre-line',
                maxHeight: window.innerHeight * 0.6,
                marginTop: '0.5rem',
                padding: '0.5rem',
                paddingRight: '10px', // reserve space for scrollbar
              },
            },
            [renderActiveTextContent()]
          ),
        ]
      ),
    ]
  );
};
//
