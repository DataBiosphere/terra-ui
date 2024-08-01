import { TooltipTrigger, useUniqueId } from '@terra-ui-packages/components';
import * as clipboard from 'clipboard-polyfill/text';
import FileSaver from 'file-saver';
import _ from 'lodash/fp';
import { Fragment, useEffect, useRef, useState } from 'react';
import { div, h, h2, label } from 'react-hyperscript-helpers';
import { AutoSizer } from 'react-virtualized';
import * as breadcrumbs from 'src/components/breadcrumbs';
import { ButtonSecondary, Link, Select } from 'src/components/common';
import FooterWrapper from 'src/components/FooterWrapper';
import { centeredSpinner, icon } from 'src/components/icons';
import { DelayedSearchInput } from 'src/components/input';
import { MarkdownViewer, newWindowLinkRenderer } from 'src/components/markdown';
import { TabBar } from 'src/components/tabBars';
import { GridTable, HeaderCell, Resizable } from 'src/components/table';
import TopBar from 'src/components/TopBar';
import WDLViewer from 'src/components/WDLViewer';
import { Ajax } from 'src/libs/ajax';
import colors from 'src/libs/colors';
import { getConfig } from 'src/libs/config';
import { withErrorReporting } from 'src/libs/error';
import * as Nav from 'src/libs/nav';
import { useCancellation, useOnMount, useStore } from 'src/libs/react-utils';
import { snapshotsListStore, snapshotStore } from 'src/libs/state';
import * as Style from 'src/libs/style';
import * as Utils from 'src/libs/utils';

// TODO: add error handling, dedupe
const InfoTile = ({ title, children }) => {
  return div({ style: Style.dashboard.infoTile }, [div({ style: Style.dashboard.tinyCaps }, [title]), div({ style: { fontSize: 12 } }, [children])]);
};

const WorkflowWrapper = ({ namespace, name, children }) => {
  const signal = useCancellation();
  const cachedSnapshotsList = useStore(snapshotsListStore);

  const snapshotsList =
    cachedSnapshotsList && _.isEqual({ namespace, name }, _.pick(['namespace', 'name'], cachedSnapshotsList[0])) ? cachedSnapshotsList : undefined;

  useOnMount(() => {
    const loadSnapshots = async () => {
      snapshotsListStore.set(snapshotsList || (await Ajax(signal).Methods.list({ namespace, name })));
    };

    if (!snapshotsList) {
      loadSnapshots();
    }
  });

  return h(FooterWrapper, [
    h(TopBar, { title: 'Workflows', href: Nav.getLink('workflows') }, [
      div({ style: Style.breadcrumb.breadcrumb }, [
        div(breadcrumbs.commonPaths.workflowList()),
        div({ style: Style.breadcrumb.textUnderBreadcrumb }, [`${namespace}/${name}`]),
      ]),
    ]),
    div({ role: 'main', style: { flex: 1, display: 'flex', flexFlow: 'column nowrap' } }, [snapshotsList ? children : centeredSpinner()]),
  ]);
};

const SnapshotWrapper = ({ namespace, name, snapshotId, tabName, children }) => {
  const signal = useCancellation();
  const cachedSnapshotsList = useStore(snapshotsListStore);
  const cachedSnapshot = useStore(snapshotStore);
  const selectedSnapshot = snapshotId * 1 || _.last(cachedSnapshotsList).snapshotId;
  const snapshotLabelId = useUniqueId();

  const snapshot =
    cachedSnapshot && _.isEqual({ namespace, name, snapshotId: selectedSnapshot }, _.pick(['namespace', 'name', 'snapshotId'], cachedSnapshot))
      ? cachedSnapshot
      : undefined;

  useOnMount(() => {
    const loadSnapshot = async () => {
      snapshotStore.set(await Ajax(signal).Methods.method(namespace, name, selectedSnapshot).get());
    };

    if (!snapshot) {
      loadSnapshot();
    }

    if (!snapshotId) {
      window.history.replaceState({}, '', Nav.getLink('workflow-dashboard', { namespace, name, snapshotId: selectedSnapshot }));
    }
  });

  return h(Fragment, [
    h(
      TabBar,
      {
        'aria-label': 'workflow menu',
        activeTab: tabName,
        tabNames: ['dashboard', 'wdl', 'configs'],
        displayNames: { configs: 'configurations' },
        getHref: (currentTab) => Nav.getLink(`workflow-${currentTab}`, { namespace, name, snapshotId: selectedSnapshot }),
      },
      [
        label({ htmlFor: snapshotLabelId, style: { marginRight: '1rem' } }, ['Snapshot:']),
        div({ style: { width: 100 } }, [
          h(Select, {
            id: snapshotLabelId,
            value: selectedSnapshot,
            isSearchable: false,
            options: _.map('snapshotId', cachedSnapshotsList),
            onChange: ({ value }) => Nav.goToPath(`workflow-${tabName}`, { namespace, name, snapshotId: value }),
          }),
        ]),
      ]
    ),
    snapshot ? children : centeredSpinner(),
  ]);
};

const WorkflowSummary = () => {
  const { namespace, name, snapshotId, createDate, managers, synopsis, documentation, public: isPublic } = useStore(snapshotStore);
  const [importUrlCopied, setImportUrlCopied] = useState();
  const importUrl = `${getConfig().orchestrationUrlRoot}/ga4gh/v1/tools/${namespace}:${name}/versions/${snapshotId}/plain-WDL/descriptor`;

  return div({ style: { flex: 1, display: 'flex' }, role: 'tabpanel' }, [
    div({ style: Style.dashboard.leftBox }, [
      synopsis && h(Fragment, [h2({ style: Style.dashboard.header }, ['Synopsis']), div({ style: { fontSize: 16 } }, [synopsis])]),
      h2({ style: Style.dashboard.header }, ['Documentation']),
      documentation
        ? h(MarkdownViewer, { renderers: { link: newWindowLinkRenderer } }, [documentation])
        : div({ style: { fontStyle: 'italic' } }, ['No documentation provided']),
    ]),
    div({ style: Style.dashboard.rightBox }, [
      h2({ style: Style.dashboard.header }, ['Snapshot information']),
      div({ style: { display: 'flex', flexWrap: 'wrap', margin: -4 } }, [
        h(InfoTile, { title: 'Creation date' }, [new Date(createDate).toLocaleDateString()]),
        h(InfoTile, { title: 'Public' }, [_.startCase(isPublic)]),
      ]),
      h2({ style: Style.dashboard.header }, ['Owners']),
      _.map((email) => {
        return div({ key: email, style: { overflow: 'hidden', textOverflow: 'ellipsis' } }, [h(Link, { href: `mailto:${email}` }, [email])]);
      }, managers),
      div({ style: { margin: '1.5rem 0 1rem 0', borderBottom: `1px solid ${colors.dark(0.55)}` } }),
      h2({ style: { fontSize: '1rem', fontWeight: 500, marginBottom: '0.5rem' } }, ['Import URL']),
      div({ style: { display: 'flex' } }, [
        div({ style: Style.noWrapEllipsis }, [importUrl]),
        h(
          Link,
          {
            style: { margin: '0 0.5rem', flexShrink: 0 },
            tooltip: 'Copy import URL',
            onClick: withErrorReporting('Error copying to clipboard')(async () => {
              await clipboard.writeText(importUrl);
              setImportUrlCopied(true);
              setTimeout(() => setImportUrlCopied(), 1500);
            }),
          },
          [icon(importUrlCopied ? 'check' : 'copy-to-clipboard')]
        ),
      ]),
    ]),
  ]);
};

const WorkflowWdl = () => {
  const { name, snapshotId, payload } = useStore(snapshotStore);

  return div({ style: { margin: '1rem 1.5rem 2rem', display: 'flex', flexDirection: 'column', flex: 1 }, role: 'tabpanel' }, [
    div({ style: { marginBottom: '1rem', alignSelf: 'flex-end' } }, [
      h(
        ButtonSecondary,
        {
          onClick: () => {
            const blob = new Blob([payload], { type: 'application/wdl' });
            FileSaver.saveAs(blob, `${name}.${snapshotId}.wdl`);
          },
        },
        [icon('download', { style: { marginRight: '0.5rem' } }), 'Download .wdl']
      ),
    ]),
    div({ style: { flex: 1 } }, [h(AutoSizer, [({ height, width }) => h(WDLViewer, { wdl: payload, style: { maxHeight: height, width } })])]),
  ]);
};

const getFilteredConfigs = ({ allConfigs, filterWord }) => {
  const lowerCaseFilter = filterWord.toLocaleLowerCase();
  const keys = ['name', 'namespace', 'snapshotId'];
  return allConfigs?.filter((config) => keys.some((key) => config[key].toString().toLowerCase().includes(lowerCaseFilter)));
};

export const WorkflowConfigs = ({ searchFilter }) => {
  const signal = useCancellation();
  const { namespace, name, snapshotId } = useStore(snapshotStore);
  const [allConfigs, setAllConfigs] = useState();
  const [snapshotConfigs, setSnapshotConfigs] = useState();
  const [configTableColumnWidths, setConfigTableColumnWidths] = useState({});
  const resizeColumn = (currentWidth, delta, columnKey) => {
    setConfigTableColumnWidths(_.set(columnKey, currentWidth + delta));
  };
  const withConfigTableName = (columnName) => `${columnName}`;
  const configTableRef = useRef(null);

  useOnMount(() => {
    const loadConfigs = async () => {
      const [allConfigs, snapshotConfigs] = await Promise.all([
        Ajax(signal).Methods.method(namespace, name, snapshotId).allConfigs(),
        Ajax(signal).Methods.method(namespace, name, snapshotId).configs(),
      ]);

      setAllConfigs(allConfigs);
      setSnapshotConfigs(snapshotConfigs);
    };

    loadConfigs();
  });

  const filteredConfigs = getFilteredConfigs({ allConfigs, filterWord: searchFilter });

  useEffect(() => {
    configTableRef.current?.recomputeColumnSizes();
  }, [configTableColumnWidths]);

  return div({ style: { flex: 1, padding: '1rem' }, role: 'tabpanel' }, [
    !allConfigs
      ? centeredSpinner()
      : h(AutoSizer, { disableHeight: true }, [
          ({ width }) =>
            h(GridTable, {
              ref: configTableRef,
              width,
              height: (1 + allConfigs.length) * 48,
              'aria-label': 'workflow configuration',
              rowCount: filteredConfigs.length,
              numFixedColumns: 1,
              columns: [
                {
                  width: 50,
                  headerRenderer: () => div({ className: 'sr-only' }, ['Warnings']),
                  cellRenderer: ({ rowIndex }) => {
                    const config = allConfigs[rowIndex];

                    return (
                      !_.find(_.isEqual(config), snapshotConfigs) &&
                      h(
                        TooltipTrigger,
                        {
                          content: `This configuration is not fully compatible with snapshot ${snapshotId}`,
                        },
                        [icon('warning-standard', { style: { color: colors.warning() } })]
                      )
                    );
                  },
                  size: { basis: 45, grow: 0, shrink: 0 },
                },
                {
                  field: 'configurations',
                  width: configTableColumnWidths[withConfigTableName('configurations')] || 500,
                  headerRenderer: () => {
                    const columnWidth = configTableColumnWidths[withConfigTableName('configurations')] || 500;
                    return h(
                      Resizable,
                      {
                        width: columnWidth,
                        onWidthChange: (delta) => resizeColumn(columnWidth, delta, withConfigTableName('configurations')),
                      },
                      [h(HeaderCell, ['Configuration'])]
                    );
                  },
                  cellRenderer: ({ rowIndex }) => {
                    const { namespace, name, snapshotId } = filteredConfigs[rowIndex];
                    return h(Link, [`${namespace}/${name} Snapshot ID: ${snapshotId}`]);
                  },
                },
                {
                  field: 'workflow_snapshot',
                  width: configTableColumnWidths[withConfigTableName('workflow_snapshot')] || 300,
                  headerRenderer: () => {
                    const columnWidth = configTableColumnWidths[withConfigTableName('workflow_snapshot')] || 300;
                    return h(
                      Resizable,
                      {
                        width: columnWidth,
                        onWidthChange: (delta) => resizeColumn(columnWidth, delta, withConfigTableName('workflow_snapshot')),
                      },
                      [h(HeaderCell, ['Workflow Snapshot'])]
                    );
                  },
                  cellRenderer: ({ rowIndex }) => {
                    const {
                      payloadObject: {
                        methodRepoMethod: { methodVersion },
                      },
                    } = allConfigs[rowIndex];

                    return methodVersion;
                  },
                },
                {
                  field: 'synopsis',
                  width: configTableColumnWidths[withConfigTableName('synopsis')] || 500,
                  headerRenderer: () => {
                    const columnWidth = configTableColumnWidths[withConfigTableName('synopsis')] || 500;
                    return h(
                      Resizable,
                      {
                        width: columnWidth,
                        onWidthChange: (delta) => resizeColumn(columnWidth, delta, 'synopsis'),
                      },
                      [h(HeaderCell, ['Synopsis'])]
                    );
                  },
                  cellRenderer: ({ rowIndex }) => {
                    const { synopsis } = allConfigs[rowIndex];

                    return synopsis;
                  },
                  size: { grow: 2 },
                },
              ],
            }),
        ]),
  ]);
};

export const WorkflowDetails = (props) => {
  const [searchFilter, setSearchFilter] = useState('');
  return h(WorkflowWrapper, props, [
    h(SnapshotWrapper, props, [
      Utils.switchCase(
        props.tabName,
        ['dashboard', () => h(WorkflowSummary)],
        ['wdl', () => h(WorkflowWdl)],
        ['configs', () => h(Fragment, [h(Filter, { searchFilter, setSearchFilter }), h(WorkflowConfigs, { searchFilter })])]
      ),
    ]),
  ]);
};

const Filter = ({ searchFilter, setSearchFilter }) => {
  return h(DelayedSearchInput, {
    style: { marginLeft: '1rem', marginTop: '1rem', width: 205 },
    value: searchFilter,
    onChange: setSearchFilter,
    'aria-label': 'Search configurations',
    placeholder: 'Search Configurations',
  });
};

export const navPaths = [
  {
    name: 'workflow-dashboard',
    path: '/workflows/:namespace/:name/:snapshotId?',
    component: (props) => h(WorkflowDetails, { ...props, tabName: 'dashboard' }),
    title: ({ name }) => `${name} - Dashboard`,
  },
  {
    name: 'workflow-wdl',
    path: '/workflows/:namespace/:name/:snapshotId/wdl',
    component: (props) => h(WorkflowDetails, { ...props, tabName: 'wdl' }),
    title: ({ name }) => `${name} - WDL`,
  },
  {
    name: 'workflow-configs',
    path: '/workflows/:namespace/:name/:snapshotId/configs',
    component: (props) => h(WorkflowDetails, { ...props, tabName: 'configs' }),
    title: ({ name }) => `${name} - Configurations`,
  },
];
