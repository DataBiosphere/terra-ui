import _ from 'lodash/fp';
import { useState } from 'react';
import { b, div, h, img } from 'react-hyperscript-helpers';
import { absoluteSpinnerOverlay, ButtonPrimary, Clickable, DeleteConfirmationModal, Select, spinnerOverlay } from 'src/components/common';
import Modal from 'src/components/Modal';
import { isAzureUri, isGsUri } from 'src/data/data-table/uri-viewer/uri-viewer-utils';
import ReferenceData from 'src/data/reference-data';
import { Ajax } from 'src/libs/ajax';
import { canUseWorkspaceProject } from 'src/libs/ajax/Billing';
import colors from 'src/libs/colors';
import { reportError } from 'src/libs/error';
import { requesterPaysProjectStore } from 'src/libs/state';
import * as Style from 'src/libs/style';

export const warningBoxStyle = {
  backgroundColor: colors.warning(0.15),
  padding: '1rem 1.25rem',
  color: colors.dark(),
  fontWeight: 'bold',
  fontSize: 12,
};

export const parseGsUri = (uri) => _.drop(1, /gs:[/][/]([^/]+)[/](.+)/.exec(uri));

export const getDownloadCommand = (fileName, uri, accessUrl) => {
  const { url: httpUrl, headers: httpHeaders } = accessUrl || {};
  if (httpUrl) {
    const headers = _.flow(
      _.toPairs,
      _.reduce((acc, [header, value]) => `${acc}-H '${header}: ${value}' `, '')
    )(httpHeaders);
    const output = fileName ? `-o '${fileName}' ` : '-O ';
    return `curl ${headers}${output}'${httpUrl}'`;
  }

  if (isAzureUri(uri)) {
    return `azcopy copy '${uri}' ${fileName || '.'}`;
  }

  if (isGsUri(uri)) {
    return `gsutil cp '${uri}' ${fileName || '.'}`;
  }
};

export const getUserProjectForWorkspace = async (workspace) =>
  workspace && (await canUseWorkspaceProject(workspace)) ? workspace.workspace.googleProject : requesterPaysProjectStore.get();

export const ReferenceDataImporter = ({ onSuccess, onDismiss, namespace, name }) => {
  const [loading, setLoading] = useState(false);
  const [selectedReference, setSelectedReference] = useState(undefined);

  return h(
    Modal,
    {
      'aria-label': 'Add Reference Data',
      onDismiss,
      title: 'Add Reference Data',
      okButton: h(
        ButtonPrimary,
        {
          disabled: !selectedReference || loading,
          onClick: async () => {
            setLoading(true);
            try {
              await Ajax()
                .Workspaces.workspace(namespace, name)
                .shallowMergeNewAttributes(_.mapKeys((k) => `referenceData_${selectedReference}_${k}`, ReferenceData[selectedReference]));
              onSuccess();
            } catch (error) {
              await reportError('Error importing reference data', error);
              onDismiss();
            }
          },
        },
        'OK'
      ),
    },
    [
      h(Select, {
        'aria-label': 'Select data',
        autoFocus: true,
        isSearchable: false,
        placeholder: 'Select data',
        value: selectedReference,
        onChange: ({ value }) => setSelectedReference(value),
        options: _.keys(ReferenceData),
      }),
      loading && spinnerOverlay,
    ]
  );
};

export const ReferenceDataDeleter = ({ onSuccess, onDismiss, namespace, name, referenceDataType }) => {
  const [deleting, setDeleting] = useState(false);

  return h(
    DeleteConfirmationModal,
    {
      objectType: 'reference',
      objectName: referenceDataType,
      onConfirm: async () => {
        setDeleting(true);
        try {
          await Ajax()
            .Workspaces.workspace(namespace, name)
            .deleteAttributes(_.map((key) => `referenceData_${referenceDataType}_${key}`, _.keys(ReferenceData[referenceDataType])));
          onSuccess();
        } catch (error) {
          reportError('Error deleting reference data', error);
          onDismiss();
        }
      },
      onDismiss,
    },
    [div(['Are you sure you want to delete the ', b([referenceDataType]), ' reference data?']), deleting && absoluteSpinnerOverlay]
  );
};

export const ModalToolButton = ({ icon, text, disabled, ...props }) => {
  return h(
    Clickable,
    _.merge(
      {
        disabled,
        style: {
          color: disabled ? colors.secondary() : colors.accent(),
          opacity: disabled ? 0.5 : undefined,
          border: '1px solid transparent',
          padding: '0 0.875rem',
          marginBottom: '0.5rem',
          backgroundColor: 'white',
          display: 'flex',
          alignItems: 'center',
          height: '3rem',
          fontSize: 18,
          userSelect: 'none',
        },
        hover: {
          border: `1px solid ${colors.accent(0.8)}`,
          boxShadow: Style.standardShadow,
        },
      },
      props
    ),
    [
      !!icon &&
        div({ style: { display: 'flex', alignItems: 'center', width: 45, marginRight: '1rem' } }, [
          img({ src: icon, style: { opacity: disabled ? 0.5 : undefined, maxWidth: 45, maxHeight: 40 } }),
        ]),
      text,
    ]
  );
};
