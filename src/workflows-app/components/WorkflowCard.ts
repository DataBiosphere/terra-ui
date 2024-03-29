import { PropsWithChildren } from 'react';
import { div, h, h3 } from 'react-hyperscript-helpers';
import { icon } from 'src/components/icons';
import { TooltipCell } from 'src/components/table';
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
      timestamp: string;
    };

export type MethodVersion = {
  name: string;
  url: string;
  method_version_id?: string;
};

/** Represents a workflow method from CBAS */
export type WorkflowMethod = {
  method_id?: string; // No method ID before it comes from CBAS
  name: string;
  last_run: LastRun;
  description?: string;
  source: WorkflowSource;
  method_versions: MethodVersion[];
  isPrivate?: boolean | null;
};

/** Represents a set of workflows grouped together */
export type WorkflowMethodSet = {
  name: string;
  description: string;
  methods: WorkflowMethod[];
};

export type WorkflowCardMethod = WorkflowMethod | WorkflowMethodSet;

export type WorkflowCardProps = {
  method: WorkflowCardMethod;
  subCard?: boolean;
};

export const WorkflowCard = ({ method, subCard, children }: PropsWithChildren<WorkflowCardProps>) => {
  const isWorkflowSet = 'methods' in method; // Used to narrow type
  let isPrivate;
  if (isWorkflowSet || method.isPrivate == null) {
    isPrivate = false;
  } else {
    isPrivate = method.isPrivate;
  }
  const showLock = isPrivate
    ? h(TooltipCell, { tooltip: 'This is a private workflow', style: { marginLeft: '0.5em' } }, [icon('lock')])
    : undefined;

  return div(
    {
      style: {
        display: 'flex',
        width: '100%',
        flexDirection: 'column',
        justifyContent: 'space-between',
        borderRadius: 5,
        margin: '1rem 0',
        padding: '1rem',
        wordWrap: 'break-word',
        ...(subCard
          ? {
              backgroundColor: colors.accent(0.1),
            }
          : {
              backgroundColor: 'white',
              border: '1px solid rgba(0,0,0,0.15)',
              boxShadow: '0 2px 5px 0 rgba(0,0,0,0.35), 0 3px 2px 0 rgba(0,0,0,0.12)',
            }),
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
          div(
            {
              style: {
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                flex: 1,
              },
            },
            [
              h3({ style: { color: subCard ? 'black' : colors.accent(1.1), margin: '0 0 1rem' } }, [
                div({ style: { display: 'flex', alignItems: 'center' } }, [method.name, showLock]),
              ]),
              !isWorkflowSet &&
                div(
                  {
                    style: {
                      display: 'flex',
                      flexDirection: 'row',
                      alignItems: 'flex-center',
                      justifyContent: 'flex-start',
                      margin: '1rem 0',
                    },
                  },
                  [
                    div({ style: { ...Style.noWrapEllipsis, marginRight: '2rem', width: '15rem' } }, [
                      `Version ${method.method_versions[0].name}`,
                    ]),
                    div({ style: { ...Style.noWrapEllipsis, marginRight: '2rem', width: '15rem' } }, [
                      `Last run: ${
                        method.last_run.previously_run
                          ? Utils.makeCompleteDate(method.last_run.timestamp)
                          : '(Never run)'
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
                    margin: '1rem 0 0',
                  },
                },
                [method.description ?? 'No method description']
              ),
            ]
          ),
          div({ style: { marginLeft: '2rem', minWidth: '10rem' } }, [children]),
        ]
      ),
      isWorkflowSet &&
        div(
          { style: { marginTop: '1rem' } },
          method.methods.map((subMethod, idx) =>
            h(
              WorkflowCard,
              {
                method: subMethod,
                subCard: true,
              },
              [
                h3(
                  {
                    style: {
                      display: 'flex',
                      alignSelf: 'center',
                      color: 'black',
                      justifyContent: 'center',
                      margin: 'calc(50% - 1.5rem) 0',
                    },
                  },
                  [`Step ${idx + 1} of ${method.methods.length}`]
                ),
              ]
            )
          )
        ),
    ]
  );
};
