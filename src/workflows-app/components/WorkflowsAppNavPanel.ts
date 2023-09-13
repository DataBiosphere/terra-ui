import _ from 'lodash/fp';
import { useState } from 'react';
import { div, h, span } from 'react-hyperscript-helpers';
import Collapse from 'src/components/Collapse';
import { Clickable } from 'src/components/common';
import { centeredSpinner, icon } from 'src/components/icons';
import colors from 'src/libs/colors';
import { getConfig } from 'src/libs/config';
import * as Style from 'src/libs/style';
import HelpfulLinksBox from 'src/workflows-app/components/HelpfulLinksBox';

const subHeadersMap = {
  'workspace-workflows': 'Workflows in this workspace',
  'submission-history': 'Submission history',
} as const;

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

export const WorkflowsAppNavPanel = ({ loading }) => {
  const [selectedSubHeader, setSelectedSubHeader] = useState<string>('workspace-workflows');

  const isSubHeaderActive = (subHeader) => selectedSubHeader === subHeader;

  const ListItem = ({ title, ...props }) =>
    h(
      Clickable,
      {
        style: {
          display: 'flex',
          alignItems: 'center',
          flex: 'none',
          width: '100%',
          height: 50,
          color: colors.accent(1.1),
        },
      },
      [div({ style: { fontSize: 15, ...props.style } }, [title])]
    );

  return div({ role: 'main', style: { display: 'flex', flex: 1, height: 'calc(100% - 66px)', position: 'relative' } }, [
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
                },
                [
                  h(ListItem, {
                    title: subHeaderName,
                  }),
                ]
              );
        }, Object.entries(subHeadersMap)),
        h(
          Collapse,
          {
            style: { borderBottom: `1px solid ${colors.dark(0.2)}` },
            title: span({ style: { fontSize: 15, color: colors.accent() } }, ['Find & add workflows']),
            initialOpenState: true,
            titleFirst: true,
            summaryStyle: { padding: '1rem 1rem 1rem 1.5rem' },
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
                    },
                    [
                      h(ListItem, {
                        title: subHeaderName,
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
    isSubHeaderActive('workspace-workflows') && div(['Workflows in this workspace TODO']),
    isSubHeaderActive('submission-history') && div(['Submission history TODO']),
    isSubHeaderActive('featured-workflows') && div(['Featured workflows TODO']),
    isSubHeaderActive('import-workflow') && div(['import workflow TODO']),
  ]);
};
