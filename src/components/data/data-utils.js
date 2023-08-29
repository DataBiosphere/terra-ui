import _ from 'lodash/fp';
import { Fragment, useRef, useState } from 'react';
import { b, div, h, img, label } from 'react-hyperscript-helpers';
import {
  absoluteSpinnerOverlay,
  ButtonPrimary,
  Clickable,
  DeleteConfirmationModal,
  IdContainer,
  Link,
  Select,
  spinnerOverlay,
} from 'src/components/common';
import { icon } from 'src/components/icons';
import { ConfirmedSearchInput, TextInput } from 'src/components/input';
import { MenuButton } from 'src/components/MenuButton';
import Modal from 'src/components/Modal';
import PopupTrigger, { MenuDivider } from 'src/components/PopupTrigger';
import { Sortable } from 'src/components/table';
import { isAzureUri, isGsUri } from 'src/components/UriViewer/uri-viewer-utils';
import ReferenceData from 'src/data/reference-data';
import { Ajax } from 'src/libs/ajax';
import { canUseWorkspaceProject } from 'src/libs/ajax/Billing';
import colors from 'src/libs/colors';
import { reportError } from 'src/libs/error';
import { notify } from 'src/libs/notifications';
import { requesterPaysProjectStore } from 'src/libs/state';
import * as Style from 'src/libs/style';
import * as Utils from 'src/libs/utils';

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

export const getRootTypeForSetTable = (tableName) => _.replace(/(_set)+$/, '', tableName);

export const EditDataLink = (props) =>
  h(
    Link,
    {
      className: 'cell-hover-only',
      style: { marginLeft: '1ch' },
      tooltip: 'Edit value',
      ...props,
    },
    [icon('edit')]
  );

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

export const notifyDataImportProgress = (jobId, message) => {
  notify('info', 'Data import in progress.', {
    id: jobId,
    message,
  });
};

export const CreateEntitySetModal = ({ entityType, entityNames, workspaceId: { namespace, name: workspaceName }, onDismiss, onSuccess }) => {
  const [name, setName] = useState('');
  const [nameInputTouched, setNameInputTouched] = useState(false);
  const nameError =
    nameInputTouched &&
    Utils.cond(
      [!name, () => 'A name for the set is required.'],
      [!/^[A-Za-z0-9_-]+$/.test(name), () => 'Set name may only contain alphanumeric characters, underscores, dashes, and periods.']
    );

  const [isBusy, setIsBusy] = useState();

  const createSet = async () => {
    setIsBusy(true);
    try {
      await Ajax()
        .Workspaces.workspace(namespace, workspaceName)
        .createEntity({
          name,
          entityType: `${entityType}_set`,
          attributes: {
            [`${entityType}s`]: {
              itemsType: 'EntityReference',
              items: _.map((entityName) => ({ entityType, entityName }), entityNames),
            },
          },
        });
      onSuccess();
    } catch (e) {
      onDismiss();
      reportError('Unable to create set.', e);
    }
  };

  return h(
    Modal,
    {
      title: `Create a ${entityType} set`,
      onDismiss,
      okButton: h(
        ButtonPrimary,
        {
          disabled: !name || nameError,
          tooltip: nameError,
          onClick: createSet,
        },
        ['Save']
      ),
    },
    [
      div({ style: { display: 'flex', flexDirection: 'column', marginBottom: '1rem' } }, [
        h(IdContainer, [
          (id) =>
            h(Fragment, [
              label({ htmlFor: id, style: { fontWeight: 'bold', marginBottom: '0.5rem' } }, 'Set name (required)'),
              div({ style: { position: 'relative', display: 'flex', alignItems: 'center' } }, [
                h(TextInput, {
                  id,
                  value: name,
                  placeholder: 'Enter a name for the set',
                  style: nameError
                    ? {
                        paddingRight: '2.25rem',
                        border: `1px solid ${colors.danger()}`,
                      }
                    : undefined,
                  onChange: (value) => {
                    setName(value);
                    setNameInputTouched(true);
                  },
                }),
                nameError &&
                  icon('error-standard', {
                    size: 24,
                    style: {
                      position: 'absolute',
                      right: '0.5rem',
                      color: colors.danger(),
                    },
                  }),
              ]),
              nameError &&
                div(
                  {
                    'aria-live': 'assertive',
                    'aria-relevant': 'all',
                    style: {
                      marginTop: '0.5rem',
                      color: colors.danger(),
                    },
                  },
                  nameError
                ),
            ]),
        ]),
      ]),
      isBusy && spinnerOverlay,
    ]
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

export const HeaderOptions = ({ sort, field, onSort, extraActions, renderSearch, searchByColumn, children }) => {
  const popup = useRef();
  const columnMenu = h(
    PopupTrigger,
    {
      ref: popup,
      closeOnClick: true,
      side: 'bottom',
      content: h(Fragment, [
        h(MenuButton, { onClick: () => onSort({ field, direction: 'asc' }) }, ['Sort Ascending']),
        h(MenuButton, { onClick: () => onSort({ field, direction: 'desc' }) }, ['Sort Descending']),
        renderSearch &&
          h(div, { style: { width: '98%' } }, [
            h(ConfirmedSearchInput, {
              'aria-label': 'Exact match filter',
              placeholder: 'Exact match filter',
              style: { marginLeft: '0.25rem' },
              onChange: (e) => {
                if (e) {
                  searchByColumn(e);
                  popup.current.close();
                }
              },
              onClick: (e) => {
                e.stopPropagation();
              },
            }),
          ]),
        !_.isEmpty(extraActions) &&
          h(Fragment, [
            h(MenuDivider),
            _.map(({ label, disabled, tooltip, onClick }) => h(MenuButton, { key: label, disabled, tooltip, onClick }, [label]), extraActions),
          ]),
      ]),
    },
    [h(Link, { 'aria-label': 'Column menu' }, [icon('cardMenuIcon', { size: 16 })])]
  );

  return h(Fragment, [
    h(
      Sortable,
      {
        sort,
        field,
        onSort,
      },
      [children, div({ style: { marginRight: '0.5rem', marginLeft: 'auto' } })]
    ),
    columnMenu,
  ]);
};
