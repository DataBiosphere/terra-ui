import _ from 'lodash/fp';
import { div, h } from 'react-hyperscript-helpers';
import { AutoSizer } from 'react-virtualized';
import { Link } from 'src/components/common';
import { icon } from 'src/components/icons';
import Modal from 'src/components/Modal';
import { FlexTable, HeaderCell, tableHeight } from 'src/components/table';
import { isAzureUri } from 'src/components/UriViewer/uri-viewer-utils';
import { getConfig } from 'src/libs/config';
import { newTabLinkProps } from 'src/libs/utils';

// Only append sas tokens for files in the workspace container. Otherwise, assume they are public and don't append the token.
// Public files can't be downloaded if a sas token is appended, since sas tokens limit access to your own container + storage account.
// Exported for  testing.
export const appendSASTokenIfNecessary = (blobPath, sasToken) => {
  const shouldAppendSASToken = blobPath.includes(getConfig().workspaceId);
  return shouldAppendSASToken ? `${blobPath}?${sasToken}` : blobPath;
};

// Whatever is after the last slash is the filename.
export const getFilenameFromAzureBlobPath = (blobPath) => {
  return _.isString(blobPath) ? blobPath.substring(blobPath.lastIndexOf('/') + 1) : '';
};

const InputOutputModal = ({ title, jsonData, onDismiss, sasToken }) => {
  // Link to download the blob file
  const renderBlobLink = (blobPath) => {
    const downloadUrl = appendSASTokenIfNecessary(blobPath, sasToken);
    const fileName = getFilenameFromAzureBlobPath(blobPath);
    return h(
      Link,
      {
        disabled: !downloadUrl,
        isRendered: !_.isEmpty(fileName),
        href: downloadUrl,
        download: fileName,
        style: {},
        ...newTabLinkProps,
      },
      [fileName, icon('pop-out', { size: 12, style: { marginLeft: '0.25rem' } })]
    );
  };

  const dataArray = jsonData ? Object.keys(jsonData).map((key) => [key, jsonData[key]]) : [];

  return h(
    Modal,
    {
      title,
      onDismiss,
      showCancel: false,
      showX: true,
      okButton: 'Done',
      width: 900,
      height: 500, // specify height to prevent the modal from being too tall
    },
    [
      div({ style: { margin: '1rem 0', display: 'flex', alignItems: 'center' } }, [
        h(AutoSizer, { disableHeight: true }, [
          ({ width }) =>
            h(
              FlexTable,
              {
                'aria-label': 'call table',
                height: tableHeight({ actualRows: dataArray.length, maxRows: 10.5 }), // The half-row here hints at there being extra rows if scrolled
                width,
                rowCount: dataArray.length,
                noContentMessage: 'No Inputs',
                columns: [
                  {
                    size: { basis: 100, grow: 30 },
                    field: 'key',
                    headerRenderer: () => h(HeaderCell, ['Key']),
                    cellRenderer: ({ rowIndex }) => {
                      return div({}, dataArray[rowIndex][0]);
                    },
                  },
                  {
                    size: { basis: 100, grow: 70 },
                    field: 'value',
                    headerRenderer: () => h(HeaderCell, ['Value']),
                    cellRenderer: ({ rowIndex }) => {
                      return isAzureUri(dataArray[rowIndex][1]) ? renderBlobLink(dataArray[rowIndex][1]) : div({}, dataArray[rowIndex][1]);
                    },
                  },
                ],
              },
              []
            ),
        ]),
      ]),
    ]
  );
};

export default InputOutputModal;
