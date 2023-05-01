import _ from 'lodash/fp';
import { Fragment, useEffect, useRef, useState } from 'react';
import { b, div, h, span } from 'react-hyperscript-helpers';
import { AutoSizer } from 'react-virtualized';
import { ClipboardButton } from 'src/components/ClipboardButton';
import {
  ButtonPrimary,
  ButtonSecondary,
  Checkbox,
  Clickable,
  DeleteConfirmationModal,
  fixedSpinnerOverlay,
  Link,
  RadioButton,
} from 'src/components/common';
import { concatenateAttributeNames } from 'src/components/data/attribute-utils';
import { EditDataLink, entityAttributeText, EntityRenamer, HeaderOptions, renderDataCell, SingleEntityEditor } from 'src/components/data/data-utils';
import RenameColumnModal from 'src/components/data/RenameColumnModal';
import {
  allSavedColumnSettingsEntityTypeKey,
  allSavedColumnSettingsInWorkspace,
  ColumnSettingsWithSavedColumnSettings,
  decodeColumnSettings,
} from 'src/components/data/SavedColumnSettings';
import { icon } from 'src/components/icons';
import { ConfirmedSearchInput } from 'src/components/input';
import { MenuButton } from 'src/components/MenuButton';
import Modal from 'src/components/Modal';
import { MenuTrigger } from 'src/components/PopupTrigger';
import { GridTable, HeaderCell, paginator, Resizable, TooltipCell } from 'src/components/table';
import { Ajax } from 'src/libs/ajax';
import { wdsProviderName } from 'src/libs/ajax/data-table-providers/WdsDataTableProvider';
import colors from 'src/libs/colors';
import { withErrorReporting } from 'src/libs/error';
import Events, { extractWorkspaceDetails } from 'src/libs/events';
import { getLocalPref, setLocalPref } from 'src/libs/prefs';
import { useCancellation } from 'src/libs/react-utils';
import * as StateHistory from 'src/libs/state-history';
import * as Style from 'src/libs/style';
import * as Utils from 'src/libs/utils';
import { cloudProviders } from 'src/pages/workspaces/workspace/analysis/utils/runtime-utils';

const entityMap = (entities) => {
  return _.fromPairs(_.map((e) => [e.name, e], entities));
};

const applyColumnSettings = (columnSettings, columns) => {
  const lookup = _.flow(
    Utils.toIndexPairs,
    _.map(([i, v]) => ({ ...v, index: i })),
    _.keyBy('name')
  )(columnSettings);
  return _.flow(
    _.map((name) => lookup[name] || { name, visible: true, index: -1 }),
    _.sortBy('index'),
    _.map(_.omit('index'))
  )(columns);
};

const displayData = ({ itemsType, items }) => {
  return items.length
    ? h(
        Fragment,
        _.map(
          ([i, entity]) =>
            div(
              {
                style: { borderBottom: i !== items.length - 1 ? `1px solid ${colors.dark(0.7)}` : undefined, padding: '0.5rem' },
              },
              [itemsType === 'EntityReference' ? `${entity.entityName} (${entity.entityType})` : JSON.stringify(entity)]
            ),
          Utils.toIndexPairs(items)
        )
      )
    : div({ style: { padding: '0.5rem', fontStyle: 'italic' } }, ['No items']);
};

const DataTable = (props) => {
  const {
    entityType,
    entityMetadata,
    setEntityMetadata,
    workspaceId,
    workspace,
    googleProject,
    workspaceId: { namespace, name },
    onScroll,
    initialX,
    initialY,
    loadMetadata,
    selectionModel: { selected, setSelected },
    childrenBefore,
    editable,
    activeCrossTableTextFilter,
    persist,
    refreshKey,
    snapshotName,
    deleteColumnUpdateMetadata,
    controlPanelStyle,
    border = true,
    extraColumnActions,
    dataProvider,
  } = props;

  const persistenceId = `${namespace}/${name}/${entityType}`;

  // State
  const [loading, setLoading] = useState(false);

  const [viewData, setViewData] = useState();
  const [entities, setEntities] = useState();
  const [filteredCount, setFilteredCount] = useState(0);
  const [totalRowCount, setTotalRowCount] = useState(0);

  const [itemsPerPage, setItemsPerPage] = useState(100);
  const [pageNumber, setPageNumber] = useState(1);
  const [sort, setSort] = useState({ field: 'name', direction: 'asc' });
  const [activeTextFilter, setActiveTextFilter] = useState(activeCrossTableTextFilter || '');
  const [columnFilter, setColumnFilter] = useState({ filterColAttr: '', filterColTerm: '' });

  const [columnWidths, setColumnWidths] = useState(() => getLocalPref(persistenceId)?.columnWidths || {});
  const [columnState, setColumnState] = useState(() => {
    // Load initial column settings from:
    // 1. local storage (last settings for this table)
    // 2. workspace-column-defaults workspace attribute
    // 3. saved column settings named "Default" for this table

    const localColumnPref = getLocalPref(persistenceId)?.columnState;
    if (localColumnPref) {
      return localColumnPref;
    }

    const {
      workspace: {
        attributes: { 'workspace-column-defaults': columnDefaultsString },
      },
    } = workspace;
    const columnDefaults = Utils.maybeParseJSON(columnDefaultsString);
    if (columnDefaults?.[entityType]) {
      const convertColumnDefaults = ({ shown = [], hidden = [] }) => [
        ..._.map((name) => ({ name, visible: true }), shown),
        ..._.map((name) => ({ name, visible: false }), hidden),
        ..._.map((name) => ({ name, visible: true }), _.without([...shown, ...hidden], entityMetadata[entityType].attributeNames)),
      ];
      return convertColumnDefaults(columnDefaults[entityType]);
    }

    const savedColumnSettings = _.flow(
      allSavedColumnSettingsInWorkspace,
      _.getOr({}, allSavedColumnSettingsEntityTypeKey({ snapshotName, entityType }))
    )(workspace);
    const defaultColumnSettingsName = 'Default';
    if (savedColumnSettings[defaultColumnSettingsName]) {
      return decodeColumnSettings(savedColumnSettings[defaultColumnSettingsName]);
    }

    return [];
  });

  const [updatingColumnSettings, setUpdatingColumnSettings] = useState();
  const [renamingEntity, setRenamingEntity] = useState();
  const [updatingEntity, setUpdatingEntity] = useState();
  const [renamingColumn, setRenamingColumn] = useState();
  const [deletingColumn, setDeletingColumn] = useState();
  const [clearingColumn, setClearingColumn] = useState();

  const [filterOperator, setFilterOperator] = useState('AND');

  const noEdit = Utils.editWorkspaceError(workspace);

  const table = useRef();
  const signal = useCancellation();

  // Helpers
  const loadData =
    !!entityMetadata &&
    _.flow(
      Utils.withBusyState(setLoading),
      withErrorReporting('Error loading entities')
    )(async () => {
      const colFilt =
        !!columnFilter.filterColAttr && !!columnFilter.filterColTerm ? `${columnFilter.filterColAttr}=${columnFilter.filterColTerm}` : '';
      const queryOptions = {
        pageNumber,
        itemsPerPage,
        sortField: sort.field,
        sortDirection: sort.direction,
        snapshotName,
        googleProject,
        activeTextFilter,
        filterOperator,
        columnFilter: colFilt,
      };
      const {
        results,
        resultMetadata: { filteredCount, unfilteredCount },
      } = await dataProvider.getPage(signal, entityType, queryOptions, entityMetadata);

      // Find all the unique attribute names contained in the current page of results.
      const attrNamesFromResults = _.uniq(_.flatMap(_.keys, _.map('attributes', results)));
      // Add any attribute names from the current page of results to those found in metadata.
      // This allows for stale metadata (e.g. the metadata cache is out of date).
      // For the time being, the uniqueness check MUST be case-insensitive (e.g. { sensitivity: 'accent' })
      // in order to prevent case-divergent columns from being displayed, as that would expose some other bugs.
      const attrNamesFromMetadata = entityMetadata[entityType]?.attributeNames;
      const newAttrsForThisType = concatenateAttributeNames(attrNamesFromMetadata, attrNamesFromResults);
      if (!_.isEqual(newAttrsForThisType, attrNamesFromMetadata)) {
        setEntityMetadata(_.set([entityType, 'attributeNames'], newAttrsForThisType));
      }
      setEntities(results);
      setFilteredCount(filteredCount);
      setTotalRowCount(unfilteredCount);
    });

  const getAllEntities = async () => {
    const params = _.pickBy(_.trim, { pageSize: filteredCount, filterTerms: activeTextFilter, filterOperator });
    const queryResults = await Ajax(signal).Workspaces.workspace(namespace, name).paginatedEntitiesOfType(entityType, params);
    return queryResults.results;
  };

  const deleteColumn = _.flow(
    Utils.withBusyState(setLoading),
    withErrorReporting('Unable to delete column')
  )(async (attributeName) => {
    await Ajax(signal).Workspaces.workspace(namespace, name).deleteEntityColumn(entityType, attributeName);
    deleteColumnUpdateMetadata({ entityType, attributeName });

    const updatedEntities = _.map((entity) => {
      return { ...entity, attributes: _.omit([attributeName], entity.attributes) };
    }, entities);
    setEntities(updatedEntities);
  });

  const clearColumn = _.flow(
    Utils.withBusyState(setLoading),
    withErrorReporting('Unable to clear column.')
  )(async (attributeName) => {
    const allEntities = await getAllEntities();
    const entityUpdates = _.map(
      (entity) => ({
        name: entity.name,
        entityType: entity.entityType,
        operations: [{ op: 'AddUpdateAttribute', attributeName, addUpdateAttribute: '' }],
      }),
      allEntities
    );
    await Ajax(signal).Workspaces.workspace(namespace, name).upsertEntities(entityUpdates);

    const updatedEntities = _.map(_.update('attributes', _.set(attributeName, '')), entities);
    setEntities(updatedEntities);
  });

  const selectAll = _.flow(
    Utils.withBusyState(setLoading),
    withErrorReporting('Error loading entities')
  )(async () => {
    const allEntities = await getAllEntities();
    setSelected(entityMap(allEntities));
  });

  const selectPage = () => {
    setSelected(_.assign(selected, entityMap(entities)));
  };

  const deselectPage = () => {
    setSelected(
      _.omit(
        _.map(({ name }) => [name], entities),
        selected
      )
    );
  };

  const selectNone = () => {
    setSelected({});
  };

  const pageSelected = () => {
    const entityKeys = _.map('name', entities);
    const selectedKeys = _.keys(selected);
    return entities.length && _.every((k) => _.includes(k, selectedKeys), entityKeys);
  };

  const searchByColumn = (field, v) => {
    setActiveTextFilter('');
    setColumnFilter({ filterColAttr: field, filterColTerm: v.toString().trim() });
    setPageNumber(1);
    Ajax().Metrics.captureEvent(Events.workspaceDataFilteredSearch, {
      workspaceNamespace: namespace,
      workspaceName: name,
      providerName: dataProvider.providerName,
      cloudPlatform: dataProvider.providerName === wdsProviderName ? cloudProviders.azure.label : cloudProviders.gcp.label,
    });
  };

  // Lifecycle
  useEffect(() => {
    loadData();
    if (persist) {
      StateHistory.update({ itemsPerPage, pageNumber, sort, activeTextFilter, columnFilter });
    }
  }, [itemsPerPage, pageNumber, sort, activeTextFilter, filterOperator, columnFilter, refreshKey]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (persist) {
      setLocalPref(persistenceId, { columnWidths, columnState });
    }
  }, [columnWidths, columnState]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    table.current?.recomputeColumnSizes();
  }, [columnWidths, columnState]);
  useEffect(() => {
    table.current?.scrollToTop();
  }, [pageNumber, itemsPerPage]);

  // Render
  const columnSettings = applyColumnSettings(columnState || [], entityMetadata[entityType]?.attributeNames);
  const nameWidth = columnWidths.name || 150;

  const showColumnSettingsModal = () => setUpdatingColumnSettings(columnSettings);

  return h(Fragment, [
    !!entities &&
      h(Fragment, [
        div(
          {
            style: {
              display: 'flex',
              padding: '1rem',
              ...controlPanelStyle,
            },
          },
          [
            childrenBefore && childrenBefore({ entities, columnSettings, showColumnSettingsModal }),
            div({ style: { flexGrow: 1 } }),
            dataProvider.features.supportsFiltering &&
              h(
                MenuTrigger,
                {
                  side: 'bottom',
                  closeOnClick: false,
                  popupProps: { style: { width: 250 } },
                  content: h(Fragment, [
                    div({ style: { padding: '1rem' } }, [
                      div({ style: { fontWeight: 600 } }, ['Search logic']),
                      div({ role: 'radiogroup', 'aria-label': 'choose an operator to use for advanced search' }, [
                        div({ style: { paddingTop: '0.5rem' } }, [
                          h(RadioButton, {
                            text: 'AND (rows with all terms)',
                            name: 'advanced-search-operator',
                            checked: filterOperator === 'AND',
                            onChange: () => setFilterOperator('AND'),
                            labelStyle: { padding: '0.5rem', fontWeight: 'normal' },
                          }),
                        ]),
                        div({ style: { paddingTop: '0.5rem' } }, [
                          h(RadioButton, {
                            text: 'OR (rows with any term)',
                            name: 'advanced-search-operator',
                            checked: filterOperator === 'OR',
                            onChange: () => setFilterOperator('OR'),
                            labelStyle: { padding: '0.5rem', fontWeight: 'normal' },
                          }),
                        ]),
                      ]),
                    ]),
                  ]),
                },
                [
                  h(
                    ButtonSecondary,
                    {
                      style: { margin: '0rem 1.5rem' },
                    },
                    [icon('bars', { style: { marginRight: '0.5rem' } }), 'Advanced search']
                  ),
                ]
              ),
            dataProvider.features.supportsFiltering &&
              !snapshotName &&
              div({ style: { width: 300 } }, [
                h(ConfirmedSearchInput, {
                  'aria-label': 'Search',
                  placeholder: 'Search',
                  onChange: (v) => {
                    setColumnFilter({ filterColAttr: '', filterColTerm: '' });
                    setActiveTextFilter(v.toString().trim());
                    setPageNumber(1);
                  },
                  defaultValue: activeTextFilter,
                }),
              ]),
          ]
        ),
        div({ style: { flex: 1 } }, [
          h(AutoSizer, [
            ({ width, height }) => {
              const visibleColumns = _.filter('visible', columnSettings);

              const selectRowColumn = {
                width: 70,
                headerRenderer: () => {
                  return h(Fragment, [
                    h(Checkbox, {
                      checked: pageSelected(),
                      disabled: !entities.length,
                      onChange: pageSelected() ? deselectPage : selectPage,
                      'aria-label': 'Select all',
                    }),
                    h(
                      MenuTrigger,
                      {
                        closeOnClick: true,
                        content: h(Fragment, [
                          h(MenuButton, { onClick: selectPage }, ['Page']),
                          !!filteredCount &&
                            h(
                              MenuButton,
                              { onClick: selectAll },
                              totalRowCount === filteredCount ? [`All (${filteredCount})`] : [`Filtered (${filteredCount})`]
                            ),
                          h(MenuButton, { onClick: selectNone }, ['None']),
                        ]),
                        side: 'bottom',
                      },
                      [h(Clickable, { 'aria-label': '"Select All" options' }, [icon('caretDown')])]
                    ),
                  ]);
                },
                cellRenderer: ({ rowIndex }) => {
                  const thisEntity = entities[rowIndex];
                  const { name } = thisEntity;
                  const checked = _.has([name], selected);
                  return h(Checkbox, {
                    'aria-label': name,
                    checked,
                    onChange: () => setSelected((checked ? _.unset([name]) : _.set([name], thisEntity))(selected)),
                  });
                },
              };

              const filterBreadCrumb = h(div, { style: { display: 'flex', overflow: 'hidden' } }, [
                h(TooltipCell, { tooltip: `filtered by: ${columnFilter.filterColTerm}`, style: { fontWeight: 400, ...Style.noWrapEllipsis } }, [
                  `filtered by: ${columnFilter.filterColTerm}`,
                ]),
                h(
                  Clickable,
                  {
                    'aria-label': 'Clear filter',
                    tooltip: 'Clear filter',
                    style: { alignSelf: 'flex-start', marginLeft: '0.3rem' },
                    onClick: (e) => {
                      e.stopPropagation();
                      setColumnFilter({ filterColAttr: '', filterColTerm: '' });
                    },
                  },
                  [icon('times-circle', { color: colors.light(8), size: 16 })]
                ),
              ]);

              const defaultColumnsWithoutSelectRow = [
                {
                  field: 'name',
                  width: nameWidth,
                  headerRenderer: () =>
                    h(
                      Resizable,
                      {
                        width: nameWidth,
                        onWidthChange: (delta) => {
                          setColumnWidths(_.set('name', nameWidth + delta));
                        },
                      },
                      [
                        h(
                          HeaderOptions,
                          {
                            sort,
                            field: 'name',
                            onSort: setSort,
                            renderSearch: !!googleProject,
                            searchByColumn: (v) => searchByColumn(entityMetadata[entityType].idName, v),
                          },
                          [
                            h(HeaderCell, [
                              entityMetadata[entityType].idName,
                              columnFilter.filterColAttr === entityMetadata[entityType].idName && filterBreadCrumb,
                            ]),
                          ]
                        ),
                      ]
                    ),
                  cellRenderer: ({ rowIndex }) => {
                    const { name: entityName } = entities[rowIndex];
                    return h(Fragment, [
                      renderDataCell(entityName, workspace),
                      div({ style: { flexGrow: 1 } }),
                      h(ClipboardButton, {
                        'aria-label': `Copy ${entityName} to clipboard`,
                        className: 'cell-hover-only',
                        style: { marginLeft: '1rem' },
                        text: entityName,
                      }),
                      editable &&
                        h(EditDataLink, {
                          'aria-label': `Rename ${entityType} ${entityName}`,
                          onClick: () => setRenamingEntity(entityName),
                        }),
                    ]);
                  },
                },
                ..._.map(({ name: attributeName }) => {
                  const thisWidth = columnWidths[attributeName] || 300;
                  const [, columnNamespace, columnName] = /(.+:)?(.+)/.exec(attributeName);
                  return {
                    field: attributeName,
                    width: thisWidth,
                    headerRenderer: () =>
                      h(
                        Resizable,
                        {
                          width: thisWidth,
                          onWidthChange: (delta) => setColumnWidths(_.set(attributeName, thisWidth + delta)),
                        },
                        [
                          h(
                            HeaderOptions,
                            {
                              sort,
                              field: attributeName,
                              onSort: setSort,
                              renderSearch: !!googleProject,
                              searchByColumn: (v) => searchByColumn(attributeName, v),
                              extraActions: _.concat(
                                editable
                                  ? [
                                      // settimeout 0 is needed to delay opening the modaals until after the popup menu closes.
                                      // Without this, autofocus doesn't work in the modals.
                                      {
                                        label: 'Rename Column',
                                        disabled: !!noEdit,
                                        tooltip: noEdit || '',
                                        onClick: () => setTimeout(() => setRenamingColumn(attributeName), 0),
                                      },
                                      {
                                        label: 'Delete Column',
                                        disabled: !!noEdit,
                                        tooltip: noEdit || '',
                                        onClick: () => setTimeout(() => setDeletingColumn(attributeName), 0),
                                      },
                                      {
                                        label: 'Clear Column',
                                        disabled: !!noEdit,
                                        tooltip: noEdit || '',
                                        onClick: () => setTimeout(() => setClearingColumn(attributeName), 0),
                                      },
                                    ]
                                  : [],
                                extraColumnActions ? extraColumnActions(attributeName) : []
                              ),
                            },
                            [
                              h(HeaderCell, [
                                !!columnNamespace &&
                                  span({ style: { fontStyle: 'italic', color: colors.dark(0.75), paddingRight: '0.2rem' } }, [columnNamespace]),
                                columnName,
                                columnFilter.filterColAttr === attributeName && filterBreadCrumb,
                              ]),
                            ]
                          ),
                        ]
                      ),
                    cellRenderer: ({ rowIndex }) => {
                      const {
                        attributes: { [attributeName]: dataInfo },
                        name: entityName,
                      } = entities[rowIndex];
                      const dataCell = renderDataCell(dataInfo, workspace);
                      const divider = div({ style: { flexGrow: 1 } });
                      const copyButton = h(ClipboardButton, {
                        'aria-label': `Copy attribute ${attributeName} of ${entityType} ${entityName} to clipboard`,
                        className: 'cell-hover-only',
                        style: { marginLeft: '1rem' },
                        text: entityAttributeText(dataInfo),
                      });
                      const editLink =
                        editable &&
                        h(EditDataLink, {
                          'aria-label': `Edit attribute ${attributeName} of ${entityType} ${entityName}`,
                          'aria-haspopup': 'dialog',
                          'aria-expanded': !!updatingEntity,
                          onClick: () => setUpdatingEntity({ entityName, attributeName, attributeValue: dataInfo }),
                        });

                      if (!!dataInfo && _.isArray(dataInfo.items)) {
                        const isPlural = dataInfo.items.length !== 1;
                        const label = dataInfo?.itemsType === 'EntityReference' ? (isPlural ? 'entities' : 'entity') : isPlural ? 'items' : 'item';
                        const itemsLink = h(
                          Link,
                          {
                            style: { display: 'inline', whiteSpace: 'nowrap', marginLeft: '1rem' },
                            onClick: () => setViewData(dataInfo),
                          },
                          ` (${dataInfo.items.length} ${label})`
                        );
                        return h(Fragment, [dataCell, divider, copyButton, editLink, itemsLink]);
                      }
                      return h(Fragment, [dataCell, divider, copyButton, editLink]);
                    },
                  };
                }, visibleColumns),
              ];

              const defaultColumns = [...(dataProvider.features.supportsRowSelection ? [selectRowColumn] : []), ...defaultColumnsWithoutSelectRow];

              return h(GridTable, {
                ref: table,
                'aria-label': `${entityType} data table, page ${pageNumber} of ${Math.ceil(totalRowCount / itemsPerPage)}`,
                width,
                height,
                rowCount: entities.length,
                noContentMessage: `No ${entityType}s to display.`,
                onScroll,
                initialX,
                initialY,
                sort,
                numFixedColumns: visibleColumns.length > 0 ? (dataProvider.features.supportsRowSelection ? 2 : 1) : 0,
                columns: defaultColumns,
                styleCell: ({ rowIndex }) => {
                  return rowIndex % 2 && { backgroundColor: colors.light(0.2) };
                },
                border,
              });
            },
          ]),
        ]),
        !_.isEmpty(entities) &&
          div({ style: { flex: 'none', margin: '1rem' } }, [
            paginator({
              filteredDataLength: filteredCount,
              unfilteredDataLength: totalRowCount,
              pageNumber,
              setPageNumber,
              itemsPerPage,
              setItemsPerPage: (v) => {
                setPageNumber(1);
                setItemsPerPage(v);
              },
              itemsPerPageOptions: [10, 25, 50, 100, 250, 500, 1000],
            }),
          ]),
      ]),
    !!viewData &&
      h(
        Modal,
        {
          title: 'Contents',
          showButtons: false,
          showX: true,
          onDismiss: () => setViewData(undefined),
        },
        [div({ style: { maxHeight: '80vh', overflowY: 'auto' } }, [displayData(viewData)])]
      ),
    updatingColumnSettings &&
      h(
        Modal,
        {
          title: 'Select columns',
          width: 800,
          onDismiss: () => setUpdatingColumnSettings(undefined),
          okButton: h(
            ButtonPrimary,
            {
              onClick: () => {
                setColumnState(updatingColumnSettings);
                setUpdatingColumnSettings(undefined);
              },
            },
            ['Done']
          ),
        },
        [
          h(ColumnSettingsWithSavedColumnSettings, {
            entityMetadata,
            entityType,
            snapshotName,
            workspace,
            columnSettings: updatingColumnSettings,
            onChange: setUpdatingColumnSettings,
          }),
        ]
      ),
    renamingEntity !== undefined &&
      h(EntityRenamer, {
        entityType: _.find((entity) => entity.name === renamingEntity, entities).entityType,
        entityName: renamingEntity,
        workspaceId,
        onSuccess: () => {
          setRenamingEntity(undefined);
          Ajax().Metrics.captureEvent(Events.workspaceDataRenameEntity, extractWorkspaceDetails(workspace.workspace));
          loadData();
        },
        onDismiss: () => setRenamingEntity(undefined),
      }),
    !!updatingEntity &&
      h(SingleEntityEditor, {
        entityType: _.find((entity) => entity.name === updatingEntity.entityName, entities).entityType,
        ...updatingEntity,
        entityTypes: _.keys(entityMetadata),
        workspaceId,
        onSuccess: () => {
          setUpdatingEntity(undefined);
          Ajax().Metrics.captureEvent(Events.workspaceDataEditOne, extractWorkspaceDetails(workspace.workspace));
          loadData();
        },
        onDismiss: () => setUpdatingEntity(undefined),
      }),
    !!renamingColumn &&
      h(RenameColumnModal, {
        namespace,
        name,
        entityType,
        oldAttributeName: renamingColumn,
        onSuccess: () => {
          setRenamingColumn(undefined);
          Ajax().Metrics.captureEvent(Events.workspaceDataRenameColumn, extractWorkspaceDetails(workspace.workspace));
          loadMetadata();
        },
        onDismiss: () => setRenamingColumn(undefined),
      }),
    !!deletingColumn &&
      h(DeleteConfirmationModal, {
        objectType: 'column',
        objectName: deletingColumn,
        onConfirm: () => {
          setDeletingColumn(undefined);
          Ajax().Metrics.captureEvent(Events.workspaceDataDeleteColumn, extractWorkspaceDetails(workspace.workspace));
          deleteColumn(deletingColumn);
        },
        onDismiss: () => setDeletingColumn(undefined),
      }),
    !!clearingColumn &&
      h(
        DeleteConfirmationModal,
        {
          title: 'Clear Column',
          buttonText: 'Clear column',
          onConfirm: () => {
            setClearingColumn(undefined);
            Ajax().Metrics.captureEvent(Events.workspaceDataClearColumn, extractWorkspaceDetails(workspace.workspace));
            clearColumn(clearingColumn);
          },
          onDismiss: () => setClearingColumn(undefined),
        },
        [
          div([
            'Are you sure you want to permanently delete all data in the column ',
            b({ style: { wordBreak: 'break-word' } }, clearingColumn),
            '?',
          ]),
          b({ style: { display: 'block', marginTop: '1rem' } }, 'This cannot be undone.'),
        ]
      ),
    loading && fixedSpinnerOverlay,
  ]);
};

export default DataTable;
