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
import { SubmissionHistory } from 'src/workflows-app/SubmissionHistory';

const subHeadersMap = {
  'workspace-workflows': 'Workflows in this workspace',
  'submission-history': 'Submission history',
} as const;

const findAndAddSubheadersMap = {
  'featured-workflows': 'Featured workflows', // Update in follow-up tickets
  'import-workflow': 'Import a workflow', // Update in follow-up tickets
};

export const LeftNavigationPanel = ({ name, namespace, workspace, loading }) => {
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
          padding: '0 1.5rem',
          color: colors.accent(1.1),
          ...props.style,
        },
      },
      [div({ style: { fontSize: 15, wordBreak: 'break-all' }, role: 'list' }, [title])]
    );

  return div({ role: 'main', style: { display: 'flex', flex: 1, height: 'calc(100% - 66px)' } }, [
    div({ style: { minWidth: 330, maxWidth: 330, boxShadow: '0 2px 5px 0 rgba(0,0,0,0.25)', overflowY: 'auto' } }, [
      _.map(([subHeaderKey, subHeaderName]) => {
        const isActive = isSubHeaderActive(subHeaderKey);
        return loading
          ? centeredSpinner()
          : h(
              Clickable,
              {
                'aria-label': `${subHeaderKey}-header-button`,
                style: { color: isActive ? colors.accent(1.1) : colors.accent(), fontSize: 16 },
                onClick: () => setSelectedSubHeader(subHeaderKey),
                hover: Style.navList.itemHover(isActive),
                'aria-current': isActive,
                key: subHeaderKey,
              },
              [
                h(ListItem, {
                  title: subHeaderName,
                  style: { borderBottom: `0.5px solid ${colors.dark(0.2)}` },
                }),
              ]
            );
      }, Object.entries(subHeadersMap)),
      h(Clickable, {}, [
        h(
          Collapse,
          {
            title: span({ style: { fontSize: 15, color: colors.accent() } }, ['Find & add workflows']),
            initialOpenState: true,
            titleFirst: true,
            summaryStyle: { padding: '1rem 1rem 1rem 1.5rem' },
          },
          [
            div(
              {
                style: { alignItems: 'center', flexDirection: 'column', paddingLeft: '2rem' },
                role: 'list',
              },
              [
                _.map(([subHeaderKey, subHeaderName]) => {
                  const isActive = isSubHeaderActive(subHeaderKey);
                  return h(
                    Clickable,
                    {
                      'aria-label': `${subHeaderKey}-header-button`,
                      style: { color: isActive ? colors.accent(1.1) : colors.accent(), fontSize: 16 },
                      onClick: () => setSelectedSubHeader(subHeaderKey),
                      hover: Style.navList.itemHover(isActive),
                      'aria-current': isActive,
                      key: subHeaderKey,
                    },
                    [
                      h(ListItem, {
                        title: subHeaderName,
                        style: { borderBottom: `0.5px solid ${colors.dark(0.2)}` },
                      }),
                    ]
                  );
                }, Object.entries(findAndAddSubheadersMap)),
                div(
                  {
                    style: {
                      marginRight: '3em',
                      marginTop: '1.5em',
                      display: 'flex',
                      alignItems: 'center',
                      flex: 'none',
                      backgroundColor: colors.accent(0.06),
                      boxShadow: '0 2px 5px 0 rgba(0,0,0,0.35), 0 3px 2px 0 rgba(0,0,0,0.12)',
                      paddingTop: '0.5em',
                      paddingBottom: '0.5em',
                      paddingLeft: '0.75em',
                      paddingRight: '0.75em',
                      borderRadius: '15px',
                    },
                  },
                  [
                    h(
                      Clickable,
                      {
                        role: 'list',
                        href: `${
                          getConfig().dockstoreUrlRoot
                        }/search?_type=workflow&descriptorType=WDL&searchMode=files`,
                      },
                      [
                        div({ style: { fontWeight: 'bold' } }, ['Dockstore  ', icon('export')]),
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
      ]),
      h(HelpfulLinksBox, {
        method: null,
        style: { borderRadius: '20px', margin: '1.35em', bottom: '0', position: 'fixed' },
      }),
    ]),
    isSubHeaderActive('workspace-workflows') && div(['TODO']),
    isSubHeaderActive('submission-history') && h(SubmissionHistory, { name, namespace, workspace }),
    isSubHeaderActive('featured-workflows') && div(['TODO']),
    isSubHeaderActive('import-workflow') && div(['TODO']),
  ]);
};
