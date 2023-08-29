import _ from 'lodash/fp';
import { useCallback, useEffect, useState } from 'react';
import { div, h, span } from 'react-hyperscript-helpers';
import { SimpleTabBar } from 'src/components/tabBars';
import { isAzureUri } from 'src/components/UriViewer/uri-viewer-utils';
import { Ajax } from 'src/libs/ajax';
import { useCancellation, useOnMount, withDisplayName } from 'src/libs/react-utils';

import { ButtonOutline } from '../common';
import { centeredSpinner, icon } from '../icons';
import Modal from '../Modal';
import { InfoBox } from '../PopupTrigger';

/**
 * Information needed to preview a log file.
 * @member logUri - The URI of the log file. Must be a valid Azure blob URI.
 * @member logTitle - The title of the log. Displayed to the user as a tab title.
 * @member logKey - A unique key for this particular log.
 */
type LogInfo = {
  logUri: string;
  logTitle: string; // Displayed to the user as the tab title
  logKey: string; // Unique key for this particular log.
};

/**
 * Props for the LogViewer component.
 * @member logs - An array of LogInfo objects.
 */
type LogViewerProps = {
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

export const LogViewer = _.flow(withDisplayName('LogViewer'))(({ logs, onDismiss }: LogViewerProps) => {
  const [currentlyActiveLog, setCurrentlyActiveLog] = _.isEmpty(logs)
    ? useState<LogInfo | undefined>(undefined)
    : useState<LogInfo | undefined>(logs[0]);

  // string = fetched log content, undefined = loading, null = error.
  const [activeTextContent, setActiveTextContent] = useState<string | undefined | null>(undefined);
  const signal = useCancellation();
  const fetchLogContent = useCallback(
    async (azureBlobUri: string): Promise<string | null> => {
      if (!isAzureUri(azureBlobUri)) {
        console.error('Only Azure Blob URIs are supported for previewing log conent.');
        console.error(azureBlobUri);
        return null;
      }
      try {
        const response = await Ajax(signal).AzureStorage.blobMetadata(azureBlobUri).getData();
        return response.textContent;
      } catch (e) {
        console.error('Error fetching or parsing log content', e);
        return null;
      }
    },
    [signal]
  );

  useOnMount(() => {
    fetchLogContent(logs[0].logUri).then((content) => {
      setActiveTextContent(content);
    });
  });

  useEffect(() => {
    const fetch = async (logUri: string) => {
      const res = await fetchLogContent(logUri);
      if (_.isEmpty(res)) {
        setActiveTextContent(null);
      } else {
        setActiveTextContent(res);
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
      return div(['Error loading log content.']);
    }
    return div([activeTextContent]);
  };

  const tabsArray: SimpleTabProps[] = logs.map((log) => {
    return { key: log.logKey, title: log.logTitle, width: 200 } as SimpleTabProps;
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
      width: 1050,
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
          span({ style: { paddingRight: '0.5rem', fontWeight: 'bold', fontSize: 16 } }, ['Filename:']),
          span({ style: { fontSize: 16 } }, ['stdout.txt']),
          h(
            ButtonOutline,
            {
              disabled: false,
              tooltip: 'Download this log file to your computer.',
              style: { marginLeft: 'auto' },
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
