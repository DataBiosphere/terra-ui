import { div, h, h3 } from 'react-hyperscript-helpers';
import { Clickable } from 'src/components/common';
import colors from 'src/libs/colors';
import * as Style from 'src/libs/style';
import * as Utils from 'src/libs/utils';

// Backwards compatibility
export type WorkflowSource = 'Github' | 'Dockstore' | 'GitHub';

export type LastRun =
  | {
      previously_run: false;
    }
  | {
      previously_run: true;
      method_version_id: string;
      method_version_name: string;
      run_set_id: string;
      timestamp: string;
    };

/** Represents a workflow method from CBAS */
export type WorkflowMethod = {
  name: string;
  last_run: LastRun;
  description: string;
  source: WorkflowSource;
  method_id: string;
  // This property has more info but is subject to change in future, and we only care about name for now
  method_versions: [
    {
      name: string;
    }
  ];
};

export type WorkflowCardProps = {
  method: WorkflowMethod;
  buttonText: string;
  onClick: () => void | Promise<void>;
};

export const WorkflowCard = ({ method, buttonText, onClick }: WorkflowCardProps) => {
  return div(
    {
      style: {
        display: 'flex',
        width: '100%',
        flexDirection: 'column',
        justifyContent: 'space-between',
        border: '1px solid rgba(0,0,0,0.15)',
        borderRadius: 5,
        margin: '1rem 0',
        padding: '1rem',
        wordWrap: 'break-word',
        backgroundColor: 'white',
        boxShadow: '0 2px 5px 0 rgba(0,0,0,0.35), 0 3px 2px 0 rgba(0,0,0,0.12)',
      },
    },
    [
      div(
        {
          style: {
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
          },
        },
        [
          div({ style: { display: 'flex', flexDirection: 'column', justifyContent: 'space-between' } }, [
            h3({ style: { color: colors.accent(1.1), margin: 0 } }, [method.name]),
            div(
              {
                style: {
                  display: 'flex',
                  flexDirection: 'row',
                  alignItems: 'flex-center',
                  justifyContent: 'flex-start',
                  margin: '2rem 0',
                },
              },
              [
                div({ style: { ...Style.noWrapEllipsis, marginRight: '2rem', width: '10rem' } }, [
                  `Version ${method.method_versions[0].name}`,
                ]),
                div({ style: { ...Style.noWrapEllipsis, marginRight: '2rem', width: '15rem' } }, [
                  `Last run: ${
                    method.last_run.previously_run ? Utils.makeCompleteDate(method.last_run.timestamp) : '(Never run)'
                  }`,
                ]),
                div({ style: { ...Style.noWrapEllipsis, width: '10rem' } }, [`Source: ${method.source}`]),
              ]
            ),
            div(
              {
                style: {
                  ...Style.noWrapEllipsis,
                  whiteSpace: 'normal',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  height: '2rem',
                },
              },
              [method.description || 'No method description']
            ),
          ]),
          h(Clickable, { style: { marginLeft: '2rem' }, onClick }, [
            div(
              {
                style: {
                  borderRadius: 2,
                  color: colors.light(0.5),
                  fontWeight: 500,
                  padding: '0.75rem 2.5rem',
                  backgroundColor: colors.accent(1),
                },
              },
              [buttonText]
            ),
          ]),
        ]
      ),
    ]
  );
};
