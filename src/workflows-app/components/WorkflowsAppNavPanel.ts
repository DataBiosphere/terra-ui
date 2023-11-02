import _ from 'lodash/fp';
import { CSSProperties, useEffect } from 'react';
import { div, h, span } from 'react-hyperscript-helpers';
import { AnalysesData } from 'src/analysis/Analyses';
import Collapse from 'src/components/Collapse';
import { Clickable } from 'src/components/common';
import { centeredSpinner, icon } from 'src/components/icons';
import colors from 'src/libs/colors';
import { getConfig } from 'src/libs/config';
import { useQueryParameter } from 'src/libs/nav';
import * as Style from 'src/libs/style';
import * as Utils from 'src/libs/utils';
import { WorkspaceWrapper } from 'src/libs/workspace-utils';
import HelpfulLinksBox from 'src/workflows-app/components/HelpfulLinksBox';
import ImportGithub from 'src/workflows-app/components/ImportGithub';
import { WorkflowsAppLauncherCard } from 'src/workflows-app/components/WorkflowsAppLauncherCard';
import { FeaturedWorkflows } from 'src/workflows-app/FeaturedWorkflows';
import { BaseSubmissionHistory } from 'src/workflows-app/SubmissionHistory';
import { WorkflowsInWorkspace } from 'src/workflows-app/WorkflowsInWorkspace';

const subHeadersMap = {
  'workspace-workflows': 'Workflows in this workspace',
  'submission-history': 'Submission history',
};

const findAndAddSubheadersMap = {
  'featured-workflows': 'Featured workflows',
  'import-workflow': 'Import a workflow',
};

const styles = {
  subHeaders: (selected) => {
    return {
      ...Style.navList.itemContainer(selected),
      ...Style.navList.item(selected),
      ...(selected ? { backgroundColor: colors.accent(0.2) } : {}),
    };
  },
};

type ListItemProps = {
  title: string;
  pageReady: boolean;
  style?: CSSProperties;
};

const ListItem = ({ title, pageReady, ...props }: ListItemProps) =>
  div(
    {
      style: {
        display: 'flex',
        alignItems: 'center',
        flex: 'none',
        width: '100%',
        height: 50,
        color: !pageReady ? colors.disabled() : colors.accent(1.1),
      },
    },
    [div({ style: { fontSize: 15, ...props.style } }, [title])]
  );

type WorkflowsAppNavPanelProps = {
  loading: boolean;
  name: string;
  namespace: string;
  workspace: WorkspaceWrapper;
  analysesData: AnalysesData;
  launcherDisabled: boolean;
  launching: boolean;
  createWorkflowsApp: Function;
  pageReady: boolean;
  setLoading: Function;
  signal: Function;
};

export const WorkflowsAppNavPanel = ({
  pageReady,
  launcherDisabled,
  launching,
  loading,
  name,
  namespace,
  workspace,
  analysesData,
  createWorkflowsApp,
  setLoading,
  signal,
}: WorkflowsAppNavPanelProps) => {
  const [selectedSubHeader, setSelectedSubHeader] = useQueryParameter('tab');

  useEffect(() => {
    if (
      !(selectedSubHeader in subHeadersMap || (workspace.canCompute && selectedSubHeader in findAndAddSubheadersMap))
    ) {
      setSelectedSubHeader('workspace-workflows');
    }
  }, [workspace, selectedSubHeader, setSelectedSubHeader]);

  const isSubHeaderActive = (subHeader: string) => pageReady && selectedSubHeader === subHeader;

  return div({ style: { display: 'flex', flex: 1, height: 'calc(100% - 66px)', position: 'relative' } }, [
    div(
      {
        style: {
          minWidth: 330,
          maxWidth: 330,
          boxShadow: '0 2px 5px 0 rgba(0,0,0,0.25)',
          overflowY: 'auto',
        },
      },
      [
        _.map(([subHeaderKey, subHeaderName]) => {
          const isActive = isSubHeaderActive(subHeaderKey);
          return loading
            ? centeredSpinner()
            : h(
                Clickable,
                {
                  'aria-label': `${subHeaderKey}-header-button`,
                  style: {
                    ...styles.subHeaders(isActive),
                    color: isActive ? colors.accent(1.1) : colors.accent(),
                    fontSize: 16,
                  },
                  onClick: () => setSelectedSubHeader(subHeaderKey),
                  hover: Style.navList.itemHover(isActive),
                  'aria-current': isActive,
                  key: subHeaderKey,
                  disabled: !pageReady,
                },
                [
                  h(ListItem, {
                    title: subHeaderName,
                    pageReady,
                  }),
                ]
              );
        }, Object.entries(subHeadersMap)),
        h(
          Collapse,
          {
            style: { borderBottom: `1px solid ${colors.dark(0.2)}` },
            title: span(
              {
                style: {
                  color: !pageReady || !workspace.canCompute ? colors.disabled() : colors.accent(),
                  fontSize: 15,
                },
              },
              ['Find & add workflows']
            ),
            tooltip: !workspace.canCompute
              ? 'You must be a workspace writer/owner to add workflows to this workspace.'
              : undefined,
            initialOpenState: pageReady && workspace.canCompute,
            titleFirst: true,
            summaryStyle: { padding: '1rem 1rem 1rem 1.5rem' },
            disabled: !pageReady || !workspace.canCompute,
          },
          [
            div(
              {
                style: { flexDirection: 'column' },
              },
              [
                _.map(([subHeaderKey, subHeaderName]) => {
                  const isActive = isSubHeaderActive(subHeaderKey);
                  return h(
                    Clickable,
                    {
                      'aria-label': `${subHeaderKey}-header-button`,
                      style: {
                        ...styles.subHeaders(isActive),
                        color: isActive ? colors.accent(1.1) : colors.accent(),
                        fontSize: 16,
                      },
                      onClick: () => setSelectedSubHeader(subHeaderKey),
                      hover: Style.navList.itemHover(isActive),
                      'aria-current': isActive,
                      key: subHeaderKey,
                      disabled: !pageReady,
                    },
                    [
                      h(ListItem, {
                        title: subHeaderName,
                        pageReady,
                        style: { paddingLeft: '2em' },
                      }),
                    ]
                  );
                }, Object.entries(findAndAddSubheadersMap)),
                div(
                  {
                    style: {
                      marginRight: '3em',
                      marginTop: '1.5em',
                      marginBottom: '2.75rem',
                      marginLeft: '2rem',
                      display: 'flex',
                      alignItems: 'center',
                      flex: 'none',
                      backgroundColor: colors.accent(0.1),
                      padding: '1em',
                      borderRadius: '8px',
                      lineHeight: '22px',
                    },
                  },
                  [
                    h(
                      Clickable,
                      {
                        href: `${
                          getConfig().dockstoreUrlRoot
                        }/search?_type=workflow&descriptorType=WDL&searchMode=files`,
                      },
                      [
                        div({ style: { fontWeight: 'bold' } }, ['Dockstore  ', icon('pop-out')]),
                        div([
                          'Browse WDL workflows in Dockstore, an open platform used by the GA4GH for sharing Docker-based workflows.',
                        ]),
                      ]
                    ),
                  ]
                ),
              ]
            ),
          ]
        ),
        div(
          {
            style: { marginTop: '2rem' },
          },
          [
            h(HelpfulLinksBox, {
              method: null,
              style: {
                margin: '1.2em',
              },
            }),
          ]
        ),
      ]
    ),
    Utils.cond(
      [
        pageReady,
        Utils.switchCase(
          selectedSubHeader,
          ['workspace-workflows', () => h(WorkflowsInWorkspace, { name, namespace, workspace, analysesData })],
          [
            'featured-workflows',
            () => h(FeaturedWorkflows, { name, namespace, workspace, analysesData, setSelectedSubHeader }),
          ],
          ['submission-history', () => h(BaseSubmissionHistory, { name, namespace, workspace })],
          [
            'featured-workflows',
            () => h(FeaturedWorkflows, { name, namespace, workspace, analysesData, setSelectedSubHeader }),
          ],
          [
            'import-workflow',
            () =>
              h(ImportGithub, {
                setLoading,
                signal,
                onDismiss: null,
                workspace,
                name,
                namespace,
                setSelectedSubHeader,
              }),
          ]
        ),
      ],
      [
        !pageReady,
        () =>
          div([h(WorkflowsAppLauncherCard, { onClick: createWorkflowsApp, launching, disabled: launcherDisabled })]),
      ]
    ),
  ]);
};
