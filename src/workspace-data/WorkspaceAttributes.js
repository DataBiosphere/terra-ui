import { ButtonSecondary, Icon } from '@terra-ui-packages/components';
import FileSaver from 'file-saver';
import _ from 'lodash/fp';
import { Fragment, useEffect, useRef, useState } from 'react';
import { div, h } from 'react-hyperscript-helpers';
import { AutoSizer } from 'react-virtualized';
import { DeleteConfirmationModal, Link, Select, spinnerOverlay } from 'src/components/common';
import Dropzone from 'src/components/Dropzone';
import { icon } from 'src/components/icons';
import { DelayedSearchInput, TextInput } from 'src/components/input';
import { MenuButton } from 'src/components/MenuButton';
import { MenuTrigger } from 'src/components/PopupTrigger';
import { FlexTable, HeaderCell } from 'src/components/table';
import { Ajax } from 'src/libs/ajax';
import colors from 'src/libs/colors';
import { withErrorReporting } from 'src/libs/error';
import * as Utils from 'src/libs/utils';
import { renderDataCell } from 'src/workspace-data/data-table/entity-service/renderDataCell';
import * as WorkspaceUtils from 'src/workspaces/utils';

import { useWorkspaceDataAttributes } from './useWorkspaceDataAttributes';

const DESCRIPTION_PREFIX = '__DESCRIPTION__';
const isDescriptionKey = _.startsWith(DESCRIPTION_PREFIX);

export const WorkspaceAttributes = ({
  workspace,
  workspace: {
    workspace: { namespace, name },
  },
  refreshKey,
}) => {
  const [editIndex, setEditIndex] = useState();
  const [deleteIndex, setDeleteIndex] = useState();
  const [editKey, setEditKey] = useState();
  const [editValue, setEditValue] = useState();
  const [editDescription, setEditDescription] = useState();
  const [editType, setEditType] = useState();
  const [textFilter, setTextFilter] = useState('');

  const [busy, setBusy] = useState();
  const [attributes, refreshAttributes] = useWorkspaceDataAttributes(namespace, name);

  const isFirstRender = useRef(true);
  useEffect(() => {
    if (!isFirstRender.current) {
      refreshAttributes();
    }
    isFirstRender.current = false;
  }, [refreshAttributes, refreshKey]);

  const stopEditing = () => {
    setEditIndex();
    setEditKey();
    setEditValue();
    setEditDescription();
    setEditType();
  };

  const toDescriptionKey = (k) => DESCRIPTION_PREFIX + k;

  const initialAttributes = attributes.state || [];
  const creatingNewVariable = editIndex === initialAttributes.length;
  const amendedAttributes = _.flow(
    _.filter(([key, value, description]) => Utils.textMatch(textFilter, `${key} ${value} ${description}`)),
    creatingNewVariable ? Utils.append(['', '', '']) : _.identity
  )(initialAttributes);

  const DESCRIPTION_MAX_LENGTH = 200;
  const inputErrors = editIndex !== undefined && [
    ...(_.keys(_.unset(amendedAttributes[editIndex][0], attributes)).includes(editKey) ? ['Key must be unique'] : []),
    ...(!/^[\w-]*$/.test(editKey) ? ['Key can only contain letters, numbers, underscores, and dashes'] : []),
    ...(editKey === 'description' ? ["Key cannot be 'description'"] : []),
    ...(isDescriptionKey(editKey) ? [`Key cannot start with '${DESCRIPTION_PREFIX}'`] : []),
    ...(editDescription?.length > DESCRIPTION_MAX_LENGTH ? [`Description cannot be longer than ${DESCRIPTION_MAX_LENGTH} characters`] : []),
    ...(editKey.startsWith('referenceData_') ? ["Key cannot start with 'referenceData_'"] : []),
    ...(!editKey ? ['Key is required'] : []),
    ...(!editValue ? ['Value is required'] : []),
    ...(editValue && editType === 'number' && Utils.cantBeNumber(editValue) ? ['Value is not a number'] : []),
    ...(editValue && editType === 'number list' && _.some(Utils.cantBeNumber, editValue.split(','))
      ? ['Value is not a comma-separated list of numbers']
      : []),
  ];

  const saveAttribute = _.flow(
    withErrorReporting('Error saving change to workspace variables'),
    Utils.withBusyState(setBusy)
  )(async (originalKey) => {
    const isList = editType.includes('list');
    const newBaseType = isList ? editType.slice(0, -5) : editType;
    const parsedValue = isList ? _.map(Utils.convertValue(newBaseType), editValue.split(/,\s*/)) : Utils.convertValue(newBaseType, editValue);

    const editDescriptionKey = toDescriptionKey(editKey);

    const attributesToMerge = {
      [editKey]: parsedValue,
      ...(!!editDescription && { [editDescriptionKey]: editDescription }),
    };

    const attributesToDelete = [
      ...(editKey !== originalKey ? [originalKey, toDescriptionKey(originalKey)] : []),
      ...(!editDescription ? [editDescriptionKey] : []),
    ];

    await Ajax().Workspaces.workspace(namespace, name).shallowMergeNewAttributes(attributesToMerge);
    await Ajax().Workspaces.workspace(namespace, name).deleteAttributes(attributesToDelete);

    await refreshAttributes();

    stopEditing();
    setTextFilter('');
  });

  const upload = _.flow(
    withErrorReporting('Error uploading file'),
    Utils.withBusyState(setBusy)
  )(async ([file]) => {
    await Ajax().Workspaces.workspace(namespace, name).importAttributes(file);
    await refreshAttributes();
  });

  const download = _.flow(
    withErrorReporting('Error downloading attributes'),
    Utils.withBusyState(setBusy)
  )(async () => {
    const blob = await Ajax().Workspaces.workspace(namespace, name).exportAttributes();
    FileSaver.saveAs(blob, `${name}-workspace-attributes.tsv`);
  });

  return h(
    Dropzone,
    {
      disabled: !WorkspaceUtils.canEditWorkspace(workspace).value,
      style: { flex: 1, display: 'flex', flexDirection: 'column' },
      activeStyle: { backgroundColor: colors.accent(0.2), cursor: 'copy' },
      onDropAccepted: upload,
    },
    [
      ({ openUploader }) =>
        h(Fragment, [
          div(
            {
              style: {
                flex: 'none',
                display: 'flex',
                alignItems: 'center',
                padding: '1rem',
                background: colors.light(0.5),
                borderBottom: `1px solid ${colors.grey(0.4)}`,
              },
            },
            [
              h(
                MenuTrigger,
                {
                  side: 'bottom',
                  closeOnClick: true,
                  content: h(Fragment, [
                    h(
                      MenuButton,
                      {
                        disabled: editIndex !== undefined,
                        onClick: () => {
                          setEditIndex(amendedAttributes.length);
                          setEditValue('');
                          setEditKey('');
                          setEditType('string');
                          setEditDescription('');
                        },
                      },
                      ['Add variable']
                    ),
                    h(
                      MenuButton,
                      {
                        onClick: openUploader,
                      },
                      ['Upload TSV']
                    ),
                  ]),
                },
                [
                  h(
                    ButtonSecondary,
                    {
                      tooltip: 'Edit data',
                      ...WorkspaceUtils.getWorkspaceEditControlProps(workspace),
                      style: { marginRight: '1.5rem' },
                    },
                    [h(Icon, { icon: 'edit', style: { marginRight: '0.5rem' } }), 'Edit']
                  ),
                ]
              ),
              h(
                ButtonSecondary,
                {
                  style: { marginRight: '1.5rem' },
                  onClick: download,
                },
                [h(Icon, { icon: 'download', style: { marginRight: '0.5rem' } }), 'Download TSV']
              ),
              h(DelayedSearchInput, {
                'aria-label': 'Search',
                style: { width: 300, marginLeft: 'auto' },
                placeholder: 'Search',
                onChange: setTextFilter,
                value: textFilter,
              }),
            ]
          ),
          div({ style: { flex: 1, margin: '0 0 1rem' } }, [
            h(AutoSizer, [
              ({ width, height }) =>
                h(FlexTable, {
                  'aria-label': 'workspace data local variables table',
                  width,
                  height,
                  rowCount: amendedAttributes.length,
                  hoverHighlight: true,
                  noContentMessage: _.isEmpty(initialAttributes) ? 'No Workspace Data defined' : 'No matching data',
                  border: false,
                  columns: [
                    {
                      size: { basis: 400, grow: 0 },
                      headerRenderer: () => h(HeaderCell, ['Key']),
                      cellRenderer: ({ rowIndex }) =>
                        editIndex === rowIndex
                          ? h(TextInput, {
                              'aria-label': 'Workspace data key',
                              autoFocus: true,
                              value: editKey,
                              onChange: setEditKey,
                            })
                          : renderDataCell(amendedAttributes[rowIndex][0], workspace),
                    },
                    {
                      size: { grow: 1 },
                      headerRenderer: () => h(HeaderCell, ['Value']),
                      cellRenderer: ({ rowIndex }) => {
                        const originalValue = amendedAttributes[rowIndex][1];

                        return h(Fragment, [
                          div({ style: { flex: 1, minWidth: 0, display: 'flex' } }, [
                            editIndex === rowIndex
                              ? h(TextInput, {
                                  'aria-label': 'Workspace data value',
                                  value: editValue,
                                  onChange: setEditValue,
                                })
                              : renderDataCell(originalValue, workspace),
                          ]),
                          editIndex === rowIndex &&
                            h(Fragment, [
                              h(Select, {
                                'aria-label': 'data type',
                                styles: { container: (base) => ({ ...base, marginLeft: '1rem', width: 150 }) },
                                isSearchable: false,
                                isClearable: false,
                                menuPortalTarget: document.getElementById('root'),
                                getOptionLabel: ({ value }) => _.startCase(value),
                                value: editType,
                                onChange: ({ value }) => setEditType(value),
                                options: ['string', 'number', 'boolean', 'string list', 'number list', 'boolean list'],
                              }),
                            ]),
                        ]);
                      },
                    },
                    {
                      size: { grow: 1 },
                      headerRenderer: () => h(HeaderCell, ['Description']),
                      cellRenderer: ({ rowIndex }) => {
                        const [originalKey, originalValue, originalDescription] = amendedAttributes[rowIndex];

                        return h(Fragment, [
                          div({ style: { flex: 1, minWidth: 0, display: 'flex' } }, [
                            editIndex === rowIndex
                              ? h(TextInput, {
                                  'aria-label': 'Workspace data description',
                                  value: editDescription,
                                  onChange: setEditDescription,
                                })
                              : renderDataCell(originalDescription, workspace),
                          ]),
                          editIndex === rowIndex
                            ? h(Fragment, [
                                h(
                                  Link,
                                  {
                                    tooltip: Utils.summarizeErrors(inputErrors) || 'Save changes',
                                    disabled: !!inputErrors.length,
                                    style: { marginLeft: '1rem' },
                                    onClick: () => saveAttribute(originalKey),
                                  },
                                  [icon('success-standard', { size: 23 })]
                                ),
                                h(
                                  Link,
                                  {
                                    tooltip: 'Cancel editing',
                                    style: { marginLeft: '1rem' },
                                    onClick: stopEditing,
                                  },
                                  [icon('times-circle', { size: 23 })]
                                ),
                              ])
                            : div({ className: 'hover-only' }, [
                                h(
                                  Link,
                                  {
                                    tooltip: 'Edit variable',
                                    ...WorkspaceUtils.getWorkspaceEditControlProps(workspace),
                                    style: { marginLeft: '1rem' },
                                    onClick: () => {
                                      setEditIndex(rowIndex);
                                      setEditValue(_.isObject(originalValue) ? originalValue.items.join(', ') : originalValue);
                                      setEditKey(originalKey);
                                      setEditType(_.isObject(originalValue) ? `${typeof originalValue.items[0]} list` : typeof originalValue);
                                      setEditDescription(originalDescription);
                                    },
                                  },
                                  [icon('edit', { size: 19 })]
                                ),
                                h(
                                  Link,
                                  {
                                    tooltip: 'Delete variable',
                                    ...WorkspaceUtils.getWorkspaceEditControlProps(workspace),
                                    style: { marginLeft: '1rem' },
                                    onClick: () => setDeleteIndex(rowIndex),
                                    'aria-haspopup': 'dialog',
                                  },
                                  [icon('trash', { size: 19 })]
                                ),
                              ]),
                        ]);
                      },
                    },
                  ],
                }),
            ]),
          ]),
          deleteIndex !== undefined &&
            h(DeleteConfirmationModal, {
              objectType: 'variable',
              objectName: amendedAttributes[deleteIndex][0],
              onConfirm: _.flow(
                Utils.withBusyState(setBusy),
                withErrorReporting('Error deleting workspace variable')
              )(async () => {
                setDeleteIndex(undefined);
                await Ajax()
                  .Workspaces.workspace(namespace, name)
                  .deleteAttributes([amendedAttributes[deleteIndex][0], toDescriptionKey(amendedAttributes[deleteIndex][0])]);
                refreshAttributes();
              }),
              onDismiss: () => setDeleteIndex(undefined),
            }),
          (attributes.status === 'Loading' || busy) && spinnerOverlay,
        ]),
    ]
  );
};
