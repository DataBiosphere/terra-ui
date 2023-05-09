import filesize from 'filesize';
import _ from 'lodash/fp';
import { Fragment, useState } from 'react';
import { div, h, p, pre, span } from 'react-hyperscript-helpers';
import { requesterPaysWrapper, withRequesterPaysHandler } from 'src/components/bucket-utils';
import { ClipboardButton } from 'src/components/ClipboardButton';
import Collapse from 'src/components/Collapse';
import { Link } from 'src/components/common';
import { FileProvenance } from 'src/components/data/data-table-provenance';
import { getDownloadCommand, parseGsUri } from 'src/components/data/data-utils';
import { spinner } from 'src/components/icons';
import Modal from 'src/components/Modal';
import { Ajax } from 'src/libs/ajax';
import { bucketBrowserUrl } from 'src/libs/auth';
import colors from 'src/libs/colors';
import { isFeaturePreviewEnabled } from 'src/libs/feature-previews';
import { useCancellation, useOnMount, withDisplayName } from 'src/libs/react-utils';
import * as Utils from 'src/libs/utils';

import els from './uri-viewer-styles';
import { isAzureUri, isGsUri } from './uri-viewer-utils';
import { UriDownloadButton } from './UriDownloadButton';
import { UriPreview } from './UriPreview';

export const UriViewer = _.flow(
  withDisplayName('UriViewer'),
  requesterPaysWrapper({ onDismiss: ({ onDismiss }) => onDismiss() })
)(({ workspace, uri, onDismiss, onRequesterPaysError }) => {
  const {
    workspace: { googleProject },
  } = workspace;

  const signal = useCancellation();
  const [metadata, setMetadata] = useState();
  const [loadingError, setLoadingError] = useState();
  const [azureStorage, setAzureStorage] = useState();

  const loadMetadata = async () => {
    try {
      if (isGsUri(uri)) {
        const [bucket, name] = parseGsUri(uri);
        const loadObject = withRequesterPaysHandler(onRequesterPaysError, () => {
          return Ajax(signal).Buckets.getObject(googleProject, bucket, name);
        });
        const metadata = await loadObject(googleProject, bucket, name);
        setMetadata(metadata);
      } else if (isAzureUri(uri)) {
        const metadata = await Ajax(signal).AzureStorage.blobMetadata(uri).getData();
        setAzureStorage(metadata);
      } else {
        // TODO: change below comment after switch to DRSHub is complete, tracked in ticket [ID-170]
        // Fields are mapped from the drshub_v4 fields to those used by google
        // https://github.com/DataBiosphere/terra-drs-hub
        // https://cloud.google.com/storage/docs/json_api/v1/objects#resource-representations
        // The time formats returned are in ISO 8601 vs. RFC 3339 but should be ok for parsing by `new Date()`
        const {
          bucket,
          name,
          size,
          timeCreated,
          timeUpdated: updated,
          fileName,
          accessUrl,
        } = await Ajax(signal).DrsUriResolver.getDataObjectMetadata(uri, [
          'bucket',
          'name',
          'size',
          'timeCreated',
          'timeUpdated',
          'fileName',
          'accessUrl',
        ]);
        const metadata = { bucket, name, fileName, size, timeCreated, updated, accessUrl };
        setMetadata(metadata);
      }
    } catch (e) {
      // azure blob metadata storage api returns a response and it throws an error when tried to be parsed to json
      // for now just including the statusText as it appears to represent the error that the user should see
      if (isAzureUri(uri)) {
        setLoadingError(`${e.status} : ${e.statusText}`);
      } else {
        setLoadingError(await e.json());
      }
    }
  };

  useOnMount(() => {
    loadMetadata();
  });

  const renderTerminalCommand = (downloadCommand) =>
    h(Fragment, [
      p({ style: { marginBottom: '0.5rem', fontWeight: 500 } }, ['Terminal download command']),
      pre(
        {
          style: {
            display: 'flex',
            alignItems: 'center',
            margin: 0,
            padding: '0 0.5rem',
            background: colors.light(0.4),
          },
        },
        [
          span(
            {
              style: {
                overflowX: 'auto',
                flex: '1 1 0',
                padding: '1rem 0',
              },
              tabIndex: 0,
            },
            [downloadCommand || ' ']
          ),
          h(ClipboardButton, {
            'aria-label': 'Copy download URL to clipboard',
            disabled: !downloadCommand,
            style: { marginLeft: '1ch' },
            text: downloadCommand,
          }),
        ]
      ),
    ]);

  const renderFailureMessage = (loadingError) =>
    h(Fragment, [
      div({ style: { paddingBottom: '1rem' } }, ['Error loading data. This file does not exist or you do not have permission to view it.']),
      h(Collapse, { title: 'Details' }, [
        div({ style: { marginTop: '0.5rem', whiteSpace: 'pre-wrap', fontFamily: 'monospace', overflowWrap: 'break-word' } }, [
          JSON.stringify(loadingError, null, 2),
        ]),
      ]),
    ]);

  const renderLoadingSymbol = (uri) =>
    h(Fragment, [isGsUri(uri) || isAzureUri(uri) ? 'Loading metadata...' : 'Resolving DRS file...', spinner({ style: { marginLeft: 4 } })]);

  if (isAzureUri(uri)) {
    const { azureSasStorageUrl, fileName, lastModified, size } = azureStorage || {};
    uri = azureSasStorageUrl || uri;
    const downloadCommand = getDownloadCommand(fileName, uri);
    const metadata = { fileName, size };
    return h(
      Modal,
      {
        onDismiss,
        title: fileName,
        showCancel: false,
        showX: true,
        okButton: 'Done',
      },
      [
        Utils.cond(
          [loadingError, () => renderFailureMessage(loadingError)],
          [
            azureStorage,
            () =>
              h(Fragment, [
                lastModified && els.cell([els.label('Last Modified'), els.data(new Date(lastModified).toLocaleString())]),
                els.cell([els.label('File size'), els.data(filesize(size))]),
                h(UriDownloadButton, { uri, metadata, accessUrl, workspace }),
                renderTerminalCommand(downloadCommand),
              ]),
          ],
          () => renderLoadingSymbol(uri)
        ),
      ]
    );
  }

  const { size, timeCreated, updated, bucket, name, fileName, accessUrl } = metadata || {};
  const gsUri = `gs://${bucket}/${name}`;
  const downloadCommand = getDownloadCommand(fileName, gsUri, accessUrl);
  return h(
    Modal,
    {
      onDismiss,
      title: 'File Details',
      showCancel: false,
      showX: true,
      okButton: 'Done',
    },
    [
      Utils.cond(
        [loadingError, () => renderFailureMessage(loadingError)],
        [
          metadata,
          () =>
            h(Fragment, [
              els.cell([
                els.label('Filename'),
                els.data((fileName || _.last(name.split('/'))).split('.').join('.\u200B')), // allow line break on periods
              ]),
              h(UriPreview, { metadata, googleProject }),
              els.cell([els.label('File size'), els.data(filesize(size))]),
              !accessUrl &&
                !!gsUri &&
                els.cell([
                  h(
                    Link,
                    {
                      ...Utils.newTabLinkProps,
                      href: bucketBrowserUrl(gsUri.match(/gs:\/\/(.+)\//)[1]),
                    },
                    ['View this file in the Google Cloud Storage Browser']
                  ),
                ]),
              h(UriDownloadButton, { uri, metadata, accessUrl, workspace }),
              renderTerminalCommand(downloadCommand),
              (timeCreated || updated) &&
                h(
                  Collapse,
                  {
                    title: 'More Information',
                    style: { marginTop: '2rem' },
                    summaryStyle: { marginBottom: '0.5rem' },
                  },
                  [
                    timeCreated && els.cell([els.label('Created'), els.data(new Date(timeCreated).toLocaleString())]),
                    updated && els.cell([els.label('Updated'), els.data(new Date(updated).toLocaleString())]),
                    isFeaturePreviewEnabled('data-table-provenance') &&
                      els.cell([els.label('Where did this file come from?'), els.data([h(FileProvenance, { workspace, fileUrl: uri })])]),
                  ]
                ),
              div({ style: { fontSize: 10 } }, ['* Estimated. Download cost may be higher in China or Australia.']),
            ]),
        ],
        () => renderLoadingSymbol(uri)
      ),
    ]
  );
});
