import _ from 'lodash/fp';
import { useCallback, useEffect, useState } from 'react';
import { div, h, span } from 'react-hyperscript-helpers';
import { SimpleTabBar } from 'src/components/tabBars';
import { isAzureUri } from 'src/components/UriViewer/uri-viewer-utils';
import { Ajax } from 'src/libs/ajax';
import { useCancellation, useOnMount, withDisplayName } from 'src/libs/react-utils';
import { newTabLinkProps } from 'src/libs/utils';

import { ButtonOutline } from '../common';
import { centeredSpinner, icon } from '../icons';
import Modal from '../Modal';
import { InfoBox } from '../PopupTrigger';
/**
 * Information needed to preview a log file.
 * @member logUri - The URI of the log file. Must be a valid Azure blob URI. No SaS token should be appended: a fresh one will be obtained.
 * @member logTitle - The title of the log. Displayed to the user as a tab title.
 * @member logKey - A unique key for this particular log.
 */
export type LogInfo = {
  logUri: string;
  logTitle: string;
  logKey: string;
};

/**
 * Props for the LogViewer component.
 * @member logs - An array of LogInfo objects.
 */
export type LogViewerProps = {
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

type FetchedLogData = {
  textContent: string | undefined;
  downloadUri: string | undefined; // The URI to use for downloading the log file. May or may not have SaS token appended, depending on if the file is public or private.
};

const modalMaxWidth = 1100;
const tabMaxWidth = modalMaxWidth / 4 - 20;

export const LogViewer = _.flow(withDisplayName('LogViewer'))(({ logs, onDismiss }: LogViewerProps) => {
  const [currentlyActiveLog, setCurrentlyActiveLog] = _.isEmpty(logs)
    ? useState<LogInfo | undefined>(undefined)
    : useState<LogInfo | undefined>(logs[0]);

  // string = fetched log content, undefined = loading, null = error.
  const [activeTextContent, setActiveTextContent] = useState<string | undefined | null>(undefined);
  const [activeDownloadUri, setActiveDownloadUri] = useState<string | undefined>(undefined);
  const signal = useCancellation();
  const fetchLogContent = useCallback(
    async (azureBlobUri: string): Promise<FetchedLogData | null> => {
      if (!isAzureUri(azureBlobUri)) {
        console.error('Only Azure Blob URIs are supported for previewing log conent.');
        console.error(azureBlobUri);
        return null;
      }
      try {
        const response = await Ajax(signal).AzureStorage.blobMetadata(azureBlobUri).getData();
        const uri = _.isEmpty(response.azureSasStorageUrl) ? response.azureStorageUrl : response.azureSasStorageUrl;
        return { textContent: response.textContent, downloadUri: uri };
      } catch (e) {
        console.error('Error fetching or parsing log content', e);
        return null;
      }
    },
    [signal]
  );

  useOnMount(() => {
    fetchLogContent(logs[0].logUri).then((content) => {
      setActiveTextContent(content?.textContent);
      setActiveDownloadUri(content?.downloadUri);
    });
  });

  useEffect(() => {
    const fetch = async (logUri: string) => {
      const res = await fetchLogContent(logUri);
      if (_.isEmpty(res)) {
        setActiveTextContent(null);
        setActiveDownloadUri(undefined);
      } else {
        setActiveTextContent(res?.textContent);
        setActiveDownloadUri(res?.downloadUri);
      }
    };
    setActiveTextContent(undefined);
    const uri = logs.find((log) => log.logKey === currentlyActiveLog?.logKey)?.logUri;
    if (!_.isEmpty(uri)) {
      fetch(uri);
    }
  }, [logs, currentlyActiveLog, fetchLogContent]);

  const renderActiveTextContent = () => {
    if (activeTextContent === undefined) {
      return div([centeredSpinner()]);
    }
    if (activeTextContent === null) {
      return div([
        'Log file could not be loaded. Log files are only available after a task finishes, and some logs may not be available if the task failed before they were generated.',
      ]);
    }
    return div([activeTextContent]);
  };

  const tabsArray: SimpleTabProps[] = logs.map((log) => {
    return { key: log.logKey, title: log.logTitle, width: tabMaxWidth } as SimpleTabProps;
  });

  return h(
    Modal,
    {
      onDismiss,
      title: 'Task Log Files',
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
          div({ style: { fontWeight: 'bold' } }, ['Task Standard Out/Error:']),
          div({ style: { marginLeft: '1rem' } }, [
            'Task logs are from user-defined commands in your WDL. You might see an error in these logs if there was a logic or syntax error in a command, or something went wrong while running it.',
          ]),
          div({ style: { marginTop: '1rem', fontWeight: 'bold' } }, ['Backend Standard Out/Error:']),
          div({ style: { marginLeft: '1rem' } }, [
            "Backend logs are from the Azure Cloud compute job executing your task. You might see errors in these logs if the there was a problem downloading the task's input files or container, or if something went wrong while the task was running.",
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
          onChange: (key: string) => {
            const newLog = logs.find((log) => log.logKey === key);
            setCurrentlyActiveLog(newLog);
          },
          tabs: tabsArray,
        },
        []
      ),
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
            span({ style: { fontSize: 16 } }, [currentlyActiveLog?.logKey]),
          ]),
          h(
            ButtonOutline,
            {
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
  );
});
//
