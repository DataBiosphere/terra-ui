import _ from 'lodash/fp';
import { Fragment, useRef, useState } from 'react';
import { b, div, h, img, label, p, span } from 'react-hyperscript-helpers';
import { cloudProviders } from 'src/analysis/utils/runtime-utils';
import {
  absoluteSpinnerOverlay,
  ButtonPrimary,
  Clickable,
  DeleteConfirmationModal,
  IdContainer,
  LabeledCheckbox,
  Link,
  RadioButton,
  Select,
  spinnerOverlay,
} from 'src/components/common';
import Dropzone from 'src/components/Dropzone';
import { icon } from 'src/components/icons';
import { ConfirmedSearchInput, PasteOnlyInput, TextInput, ValidatedInput } from 'src/components/input';
import { MenuButton } from 'src/components/MenuButton';
import Modal from 'src/components/Modal';
import PopupTrigger, { MenuDivider } from 'src/components/PopupTrigger';
import { SimpleTabBar } from 'src/components/tabBars';
import { Sortable } from 'src/components/table';
import TooltipTrigger from 'src/components/TooltipTrigger';
import { isAzureUri, isGsUri } from 'src/components/UriViewer/uri-viewer-utils';
import ReferenceData from 'src/data/reference-data';
import { Ajax } from 'src/libs/ajax';
import { canUseWorkspaceProject } from 'src/libs/ajax/Billing';
import { wdsProviderName } from 'src/libs/ajax/data-table-providers/WdsDataTableProvider';
import { getRegionFlag, getRegionLabel } from 'src/libs/azure-utils';
import colors from 'src/libs/colors';
import { reportError } from 'src/libs/error';
import Events from 'src/libs/events';
import { FormLabel } from 'src/libs/forms';
import { clearNotification, notify } from 'src/libs/notifications';
import { requesterPaysProjectStore } from 'src/libs/state';
import * as Style from 'src/libs/style';
import * as Utils from 'src/libs/utils';
import validate from 'validate.js';

export const warningBoxStyle = {
  backgroundColor: colors.warning(0.15),
  padding: '1rem 1.25rem',
  color: colors.dark(),
  fontWeight: 'bold',
  fontSize: 12,
};

const errorTextStyle = { color: colors.danger(), fontWeight: 'bold', fontSize: 12, marginTop: '0.5rem' };

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

const supportsFireCloudDataModel = (entityType) => _.includes(entityType, ['pair', 'participant', 'sample']);

export const notifyDataImportProgress = (jobId, message) => {
  notify('info', 'Data import in progress.', {
    id: jobId,
    message,
  });
};

/** Use the first column heading in the TSV as a suggested name for the table. */
export const getSuggestedTableName = (tsv) => {
  const indexOfFirstSpace = tsv.search(/\s/);
  if (indexOfFirstSpace === -1) {
    return undefined;
  }
  const firstColumnHeading = tsv.slice(0, indexOfFirstSpace);
  return firstColumnHeading.replace(/_id$/, '').replace(/^(membership|entity):/, '');
};

export const EntityUploader = ({ onSuccess, onDismiss, namespace, name, entityTypes, workspaceId, dataProvider, isGoogleWorkspace, region }) => {
  const [useFireCloudDataModel, setUseFireCloudDataModel] = useState(false);
  const [isFileImportCurrMode, setIsFileImportCurrMode] = useState(true);
  const [isFileImportLastUsedMode, setIsFileImportLastUsedMode] = useState(undefined);
  const [file, setFile] = useState(undefined);
  const [fileContents, setFileContents] = useState('');
  const [showInvalidEntryMethodWarning, setShowInvalidEntryMethodWarning] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleteEmptyValues, setDeleteEmptyValues] = useState(false);
  const [recordType, setRecordType] = useState('');
  const [recordTypeInputTouched, setRecordTypeInputTouched] = useState(false);

  // Google workspace regions are hardcoded for now, as GCP uploads to the Rawls service which is only on uscentral-1
  const regionLabelToDisplay = isGoogleWorkspace ? 'US' : getRegionLabel(region);
  const regionFlagToDisplay = isGoogleWorkspace ? '🇺🇸' : getRegionFlag(region);

  const doUpload = async () => {
    setUploading(true);
    try {
      await dataProvider.uploadTsv({ workspaceId, recordType, file, useFireCloudDataModel, deleteEmptyValues, namespace, name });
      onSuccess(recordType);
      clearNotification(recordType);
      Ajax().Metrics.captureEvent(Events.workspaceDataUpload, {
        workspaceNamespace: namespace,
        workspaceName: name,
        providerName: dataProvider.providerName,
        cloudPlatform: dataProvider.providerName === wdsProviderName ? cloudProviders.azure.label : cloudProviders.gcp.label,
      });
    } catch (error) {
      await reportError('Error uploading entities', error);
      onDismiss();
    }
  };

  const recordTypeNameErrors = validate.single(recordType, {
    presence: {
      allowEmpty: false,
      message: 'Table name is required',
    },
    format: {
      pattern: '^(?!sys_)[a-z0-9_.-]*',
      flags: 'i',
      message: "Table name may only contain alphanumeric characters, underscores, dashes, and periods and cannot start with 'sys_'.",
    },
  });

  const match = /(?:membership|entity):([^\s]+)_id/.exec(fileContents); // Specific to Google Workspaces -- Azure workspaces do not have this requirement for TSV headers
  const isInvalid = dataProvider.tsvFeatures.isInvalid({
    fileImportModeMatches: isFileImportCurrMode === isFileImportLastUsedMode,
    match: !match,
    filePresent: file,
  });
  const newEntityType = match?.[1];
  const entityTypeAlreadyExists = _.includes(_.toLower(newEntityType), entityTypes);
  const currentFile = isFileImportCurrMode === isFileImportLastUsedMode ? file : undefined;
  const containsNullValues = fileContents.match(/^\t|\t\t+|\t$|\n\n+/gm);

  return h(
    Dropzone,
    {
      multiple: false,
      style: { flexGrow: 1 },
      activeStyle: { cursor: 'copy' },
      onDropAccepted: async ([file]) => {
        setFile(file);
        const fileContentPreview = await Utils.readFileAsText(file.slice(0, 1000));
        setFileContents(fileContentPreview);
        if (!recordType) {
          setRecordType(getSuggestedTableName(fileContentPreview) || '');
        }
        setIsFileImportLastUsedMode(true);
      },
    },
    [
      ({ dragging, openUploader }) =>
        h(Fragment, [
          !uploading &&
            h(
              Modal,
              {
                onDismiss,
                title: 'Import Table Data',
                width: '35rem',
                okButton: h(
                  ButtonPrimary,
                  {
                    disabled: dataProvider.tsvFeatures.disabled({ filePresent: currentFile, isInvalid, uploading, recordTypePresent: recordType }),
                    tooltip: dataProvider.tsvFeatures.tooltip({ filePresent: currentFile, isInvalid, recordTypePresent: recordType }),
                    onClick: doUpload,
                  },
                  ['Start Import Job']
                ),
              },
              [
                div([
                  'Choose the data import option below. ',
                  dataProvider.tsvFeatures.dataTableSupportLink &&
                    h(
                      Link,
                      {
                        ...Utils.newTabLinkProps,
                        href: 'https://support.terra.bio/hc/en-us/articles/360025758392',
                      },
                      ['Click here for more info on the table.']
                    ),
                  p([
                    'Data will be saved in location:  ',
                    regionFlagToDisplay,
                    span({ style: { fontWeight: 'bold' } }, regionLabelToDisplay),
                    ' (Terra-managed).',
                  ]),
                ]),
                dataProvider.tsvFeatures.needsTypeInput &&
                  div({ style: { paddingTop: '0.1rem', paddingBottom: '2rem' } }, [
                    h(FormLabel, { htmlFor: 'add-table-name' }, ['Table name']),
                    h(ValidatedInput, {
                      inputProps: {
                        id: 'add-table-name',
                        autoFocus: true,
                        placeholder: 'Enter a table name',
                        value: recordType,
                        onChange: (value) => {
                          setRecordType(value);
                          setRecordTypeInputTouched(true);
                        },
                      },
                      error: recordTypeInputTouched && Utils.summarizeErrors(recordTypeNameErrors),
                    }),
                  ]),
                h(SimpleTabBar, {
                  'aria-label': 'import type',
                  tabs: [
                    { title: 'File Import', key: 'file', width: 127 },
                    { title: 'Text Import', key: 'text', width: 127 },
                  ],
                  value: isFileImportCurrMode ? 'file' : 'text',
                  onChange: (value) => {
                    setIsFileImportCurrMode(value === 'file');
                    setShowInvalidEntryMethodWarning(false);
                  },
                }),
                div(
                  {
                    style: {
                      padding: '1rem 0 0',
                      height: '3.25rem',
                    },
                  },
                  [
                    isFileImportCurrMode
                      ? div([
                          'Select the ',
                          h(TooltipTrigger, { content: 'Tab Separated Values', side: 'bottom' }, [
                            span({ style: { textDecoration: 'underline dashed' } }, 'TSV'),
                          ]),
                          ' file containing your data: ',
                        ])
                      : div(['Copy and paste tab separated data here:']),
                    currentFile &&
                      div({ style: { display: 'flex', justifyContent: 'flex-end' } }, [
                        h(
                          Link,
                          {
                            onClick: () => {
                              setFile(undefined);
                              setFileContents('');
                              setUseFireCloudDataModel(false);
                            },
                          },
                          ['Clear']
                        ),
                      ]),
                  ]
                ),
                isFileImportCurrMode
                  ? div([
                      h(
                        Clickable,
                        {
                          style: {
                            ...Style.elements.card.container,
                            flex: 1,
                            backgroundColor: dragging ? colors.accent(0.2) : colors.dark(0.1),
                            border: isInvalid ? `1px solid ${colors.danger()}` : `1px dashed ${colors.dark(0.7)}`,
                            boxShadow: 'none',
                          },
                          onClick: openUploader,
                        },
                        [div(['Drag or ', h(Link, ['Click']), ' to select a .tsv file'])]
                      ),
                      div({ style: { paddingTop: '0.5rem' } }, [
                        'Selected File: ',
                        span({ style: { color: colors.dark(1), fontWeight: 550 } }, [currentFile?.name || 'None']),
                      ]),
                    ])
                  : div([
                      h(PasteOnlyInput, {
                        'aria-label': 'Paste text data here',
                        readOnly: !!fileContents,
                        placeholder: dataProvider.tsvFeatures.textImportPlaceholder,
                        onPaste: (pastedText) => {
                          setFile(new File([pastedText], 'upload.tsv'));
                          setFileContents(pastedText);
                          setIsFileImportLastUsedMode(false);
                          setShowInvalidEntryMethodWarning(false);
                        },
                        onChange: () => setShowInvalidEntryMethodWarning(true),
                        value: !isFileImportLastUsedMode ? fileContents : '',
                        wrap: 'off',
                        style: {
                          fontFamily: 'monospace',
                          height: 100,
                          backgroundColor: isInvalid ? colors.danger(0.1) : colors.light(0.1),
                          border: isInvalid ? `1px solid ${colors.danger()}` : undefined,
                          boxShadow: 'none',
                        },
                      }),
                    ]),
                ((isGoogleWorkspace && currentFile && entityTypeAlreadyExists) || (!isGoogleWorkspace && _.includes(recordType, entityTypes))) &&
                  div(
                    {
                      style: { ...warningBoxStyle, margin: '1rem 0 0.5rem', display: 'flex', alignItems: 'center' },
                    },
                    [
                      icon('warning-standard', {
                        size: 19,
                        style: { color: colors.warning(), flex: 'none', marginRight: '0.5rem', marginLeft: '-0.5rem' },
                      }),
                      `Data with the type '${recordType || newEntityType}' already exists in this workspace. `,
                      'Uploading more data for the same type may overwrite some entries.',
                    ]
                  ),
                currentFile &&
                  containsNullValues &&
                  entityTypeAlreadyExists &&
                  div(
                    {
                      style: { ...warningBoxStyle, margin: '1rem 0 0.5rem' },
                    },
                    [
                      icon('warning-standard', {
                        size: 19,
                        style: { color: colors.warning(), flex: 'none', marginRight: '0.5rem', marginLeft: '-0.5rem' },
                      }),
                      'We have detected empty cells in your TSV. Please choose an option:',
                      div({ role: 'radiogroup', 'aria-label': 'we have detected empty cells in your tsv. please choose an option.' }, [
                        div({ style: { paddingTop: '0.5rem' } }, [
                          h(RadioButton, {
                            text: 'Ignore empty cells (default)',
                            name: 'ignore-empty-cells',
                            checked: !deleteEmptyValues,
                            onChange: () => setDeleteEmptyValues(false),
                            labelStyle: { padding: '0.5rem', fontWeight: 'normal' },
                          }),
                        ]),
                        div({ style: { paddingTop: '0.5rem' } }, [
                          h(RadioButton, {
                            text: 'Overwrite existing cells with empty cells',
                            name: 'ignore-empty-cells',
                            checked: deleteEmptyValues,
                            onChange: () => setDeleteEmptyValues(true),
                            labelStyle: { padding: '0.5rem', fontWeight: 'normal' },
                          }),
                        ]),
                      ]),
                    ]
                  ),
                currentFile &&
                  supportsFireCloudDataModel(newEntityType) &&
                  isGoogleWorkspace &&
                  div([
                    h(
                      LabeledCheckbox,
                      {
                        checked: useFireCloudDataModel,
                        onChange: setUseFireCloudDataModel,
                        style: { margin: '0.5rem' },
                      },
                      [' Create participant, sample, and pair associations']
                    ),
                    h(
                      Link,
                      {
                        style: { marginLeft: '1rem', verticalAlign: 'middle' },
                        href: 'https://support.terra.bio/hc/en-us/articles/360033913771-Understanding-entity-types-and-the-standard-genomic-data-model#h_01EN5PCAEDPX020T2EFGN8TJD6',
                        ...Utils.newTabLinkProps,
                      },
                      ['Learn more ', icon('pop-out', { size: 12 })]
                    ),
                  ]),
                div({ style: errorTextStyle }, [
                  Utils.cond(
                    [isInvalid, () => dataProvider.tsvFeatures.invalidFormatWarning],
                    [showInvalidEntryMethodWarning, () => 'Invalid Data Entry Method: Copy and paste only']
                  ),
                ]),
                div({ style: { borderTop: Style.standardLine, marginTop: '1rem' } }, [
                  div({ style: { marginTop: '1rem', fontWeight: 600 } }, ['TSV file templates']),
                  div({ style: { marginTop: '1rem' } }, [
                    icon('downloadRegular', { style: { size: 14, marginRight: '0.5rem' } }),
                    'Download ',
                    h(
                      Link,
                      {
                        href: dataProvider.tsvFeatures.sampleTSVLink,
                        ...Utils.newTabLinkProps,
                        onClick: () =>
                          Ajax().Metrics.captureEvent(Events.workspaceSampleTsvDownload, {
                            workspaceNamespace: namespace,
                            workspaceName: name,
                            providerName: dataProvider.providerName,
                            cloudPlatform: dataProvider.providerName === wdsProviderName ? cloudProviders.azure.label : cloudProviders.gcp.label,
                          }),
                      },
                      ['sample_template.tsv ']
                    ),
                  ]),
                  dataProvider.tsvFeatures.dataImportSupportLink &&
                    div({ style: { marginTop: '1rem' } }, [
                      icon('pop-out', { style: { size: 14, marginRight: '0.5rem' } }),
                      'Terra Support: ',
                      h(
                        Link,
                        {
                          href: 'https://support.terra.bio/hc/en-us/articles/360059242671',
                          ...Utils.newTabLinkProps,
                        },
                        [' Importing Data - Using a Template']
                      ),
                    ]),
                ]),
              ]
            ),
        ]),
    ]
  );
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
