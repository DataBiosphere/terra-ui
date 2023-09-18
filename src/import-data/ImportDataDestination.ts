import { IconId } from '@terra-ui-packages/components';
import _ from 'lodash/fp';
import { CSSProperties, Fragment, ReactNode, useState } from 'react';
import { div, h, h2, img, p, span } from 'react-hyperscript-helpers';
import Collapse from 'src/components/Collapse';
import {
  ButtonPrimary,
  ButtonSecondary,
  Clickable,
  IdContainer,
  RadioButton,
  spinnerOverlay,
} from 'src/components/common';
import { icon, wdlIcon } from 'src/components/icons';
import NewWorkspaceModal from 'src/components/NewWorkspaceModal';
import { useWorkspaces, WorkspaceSelector } from 'src/components/workspace-utils';
import jupyterLogo from 'src/images/jupyter-logo.svg';
import colors from 'src/libs/colors';
import { FormLabel } from 'src/libs/forms';
import * as Style from 'src/libs/style';
import * as Utils from 'src/libs/utils';
import { WorkspaceInfo } from 'src/libs/workspace-utils';

import { TemplateWorkspaceInfo } from './import-types';
import { isProtectedWorkspace } from './protected-data-utils';

const styles = {
  card: {
    borderRadius: 5,
    backgroundColor: 'white',
    padding: '2rem',
    flex: 1,
    minWidth: 0,
    boxShadow: Style.standardShadow,
  },
  title: {
    fontSize: 24,
    fontWeight: 600,
    color: colors.dark(),
    margin: '0 0 1rem 0',
  },
} as const satisfies Record<string, CSSProperties>;

interface ChoiceButtonProps {
  'aria-haspopup'?: string;
  detail: string;
  disabled?: boolean;
  iconName: IconId;
  style?: CSSProperties;
  title: string;
  onClick: () => void;
}

const ChoiceButton = (props: ChoiceButtonProps): ReactNode => {
  const { iconName, title, detail, style, onClick, disabled, ...otherProps } = props;
  const color = disabled ? colors.dark(0.25) : colors.accent(1);
  return h(
    Clickable,
    {
      style: {
        ...style,
        padding: '1rem',
        marginTop: '1rem',
        display: 'flex',
        alignItems: 'center',
        border: `1px solid ${color}`,
        borderRadius: 4,
        cursor: disabled ? 'not-allowed' : 'pointer',
      },
      hover: disabled ? undefined : { backgroundColor: colors.accent(0.1) },
      onClick: !disabled && onClick,
      ...otherProps,
    },
    [
      icon(iconName, { size: 29, style: { flex: 'none', marginRight: '1rem', color } }),
      div({ style: { flex: 1 } }, [
        div({ style: { fontWeight: 'bold', color } }, [title]),
        div({ style: disabled ? { color: colors.dark(0.25) } : undefined }, [detail]),
      ]),
      icon('angle-right', { size: 32, style: { flex: 'none', marginLeft: '1rem', color } }),
    ]
  );
};

interface ImportDataDestinationProps {
  authorizationDomain: string | undefined;
  importMayTakeTime: boolean;
  isImporting: boolean;
  isProtectedData: boolean;
  template: string | undefined;
  templateWorkspaces: { [key: string]: TemplateWorkspaceInfo[] } | undefined;
  userHasBillingProjects: boolean;
  workspaceId: string | undefined;
  onImport: (workspace: WorkspaceInfo) => void;
}

export const ImportDataDestination = (props: ImportDataDestinationProps): ReactNode => {
  const {
    workspaceId,
    templateWorkspaces,
    template,
    userHasBillingProjects,
    importMayTakeTime,
    authorizationDomain,
    onImport,
    isImporting,
    isProtectedData,
  } = props;
  const { workspaces, refresh: refreshWorkspaces, loading: loadingWorkspaces } = useWorkspaces();
  const [mode, setMode] = useState<'existing' | 'template' | undefined>(workspaceId ? 'existing' : undefined);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isCloneOpen, setIsCloneOpen] = useState(false);
  const [selectedTemplateWorkspaceKey, setSelectedTemplateWorkspaceKey] = useState<{
    namespace: string;
    name: string;
  }>();

  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState(workspaceId);

  const selectedWorkspace = _.find({ workspace: { workspaceId: selectedWorkspaceId } }, workspaces);

  const filteredTemplates = template
    ? _.flow(
        _.flatMap((id: string) => (templateWorkspaces && templateWorkspaces[id]) || []),
        _.filter(({ name, namespace }) => _.some({ workspace: { namespace, name } }, workspaces))
      )(_.castArray(template))
    : [];

  const importMayTakeTimeMessage =
    'Note that the import process may take some time after you are redirected into your destination workspace.';

  const linkAccountPrompt = () => {
    return div({}, [
      div({ style: { marginTop: '1.5rem' } }, [
        'But first, to use Terra, you need to link Terra to a cloud account for compute and storage costs',
      ]),
      h(ButtonPrimary, { style: { marginTop: '.5rem', padding: '.75rem 3.5rem' }, href: '/billing' }, ['Get Started']),
    ]);
  };

  const renderSelectExistingWorkspace = () =>
    h(Fragment, [
      h2({ style: styles.title }, ['Start with an existing workspace']),
      isProtectedData &&
        div({ style: { marginTop: '0.5rem', lineHeight: '1.5' } }, [
          icon('info-circle', { size: 15, style: { marginRight: '0.25rem' }, color: colors.accent() }),
          ' You may only import to workspaces with an Authorization Domain and/or protected data setting.',
        ]),
      h(IdContainer, [
        (id) =>
          h(Fragment, [
            h(FormLabel, { htmlFor: id, style: { marginBottom: '0.25rem' } }, ['Select one of your workspaces']),
            // @ts-expect-error
            h(WorkspaceSelector, {
              id,
              workspaces: _.filter((ws) => {
                return (
                  Utils.canWrite(ws.accessLevel) &&
                  (!authorizationDomain ||
                    _.some({ membersGroupName: authorizationDomain }, ws.workspace.authorizationDomain))
                );
              }, workspaces),
              value: selectedWorkspaceId,
              onChange: setSelectedWorkspaceId,
              isOptionDisabled: (workspace) => isProtectedData && !isProtectedWorkspace(workspace),
            }),
          ]),
      ]),
      importMayTakeTime && div({ style: { marginTop: '0.5rem', lineHeight: '1.5' } }, [importMayTakeTimeMessage]),
      div({ style: { display: 'flex', alignItems: 'center', marginTop: '1rem' } }, [
        h(ButtonSecondary, { onClick: setMode, style: { marginLeft: 'auto' } }, ['Back']),
        h(
          ButtonPrimary,
          {
            style: { marginLeft: '2rem' },
            disabled: !selectedWorkspace,
            // Since button is disabled when selectedWorkspace is falsy,
            // it can safely be asserted non-null in onClick.
            onClick: () => onImport(selectedWorkspace!.workspace),
          },
          ['Import']
        ),
      ]),
    ]);

  const renderSelectTemplateWorkspace = () =>
    h(Fragment, [
      h2({ style: styles.title }, ['Start with a template']),
      importMayTakeTime && div({ style: { marginBottom: '1rem', lineHeight: '1.5' } }, [importMayTakeTimeMessage]),
      div(
        {
          role: 'radiogroup',
          'aria-label': 'choose a template',
          style: { overflow: 'auto', maxHeight: '25rem' },
        },
        [
          _.map(([i, ws]) => {
            const { name, namespace, description, hasNotebooks, hasWorkflows } = ws;
            const isSelected = _.isEqual({ name, namespace }, selectedTemplateWorkspaceKey);

            return div(
              {
                key: `${name}/${namespace}`,
                style: {
                  display: 'flex',
                  alignItems: 'baseline',
                  marginBottom: '1rem',
                  paddingLeft: '0.25rem',
                  ...(i > 0 ? { borderTop: Style.standardLine, paddingTop: '1rem' } : {}),
                },
              },
              [
                // @ts-expect-error
                h(RadioButton, {
                  name: 'select-template',
                  checked: isSelected,
                  onChange: () => setSelectedTemplateWorkspaceKey({ namespace, name }),
                  text: h(
                    Collapse,
                    {
                      style: { fontSize: 14, marginLeft: '0.5rem' },
                      title: span({ style: { display: 'flex', alignItems: 'center' } }, [
                        span({ style: { fontWeight: 600 } }, [name]),
                        hasNotebooks &&
                          img({ src: jupyterLogo, style: { height: 23, width: 23, marginLeft: '0.5rem' } }),
                        hasWorkflows &&
                          wdlIcon({
                            style: {
                              height: 23,
                              width: 23,
                              marginLeft: '0.5rem',
                              borderRadius: 3,
                              padding: '8px 4px 7px 4px',
                            },
                          }),
                      ]),
                    },
                    [p({ style: { fontSize: 14, lineHeight: '1.5', marginRight: '1rem' } }, [description])]
                  ),
                }),
              ]
            );
          }, Utils.toIndexPairs(filteredTemplates)),
        ]
      ),
      div({ style: { display: 'flex', alignItems: 'center', marginTop: '1rem' } }, [
        h(ButtonSecondary, { style: { marginLeft: 'auto' }, onClick: setMode }, ['Back']),
        h(
          ButtonPrimary,
          {
            style: { marginLeft: '2rem' },
            disabled: !selectedTemplateWorkspaceKey,
            onClick: () => setIsCloneOpen(true),
          },
          ['Import']
        ),
      ]),
    ]);

  return div({ style: { ...styles.card, marginLeft: '2rem' } }, [
    Utils.switchCase(
      mode,
      ['existing', () => renderSelectExistingWorkspace()],
      ['template', () => renderSelectTemplateWorkspace()],
      [
        Utils.DEFAULT,
        () => {
          return h(Fragment, [
            h2({ style: styles.title }, ['Destination of the prepared data']),
            div({ style: { marginTop: '0.5rem' } }, ['Choose the option below that best suits your needs.']),
            !userHasBillingProjects && h(linkAccountPrompt),
            !!filteredTemplates.length &&
              h(ChoiceButton, {
                onClick: () => setMode('template'),
                iconName: 'copySolid',
                title: 'Start with a template',
                detail: 'Clone from one of our template workspaces that has analyses ready for use',
              }),
            h(ChoiceButton, {
              onClick: () => setMode('existing'),
              iconName: 'fileSearchSolid',
              title: 'Start with an existing workspace',
              detail: 'Select one of your workspaces',
              disabled: !userHasBillingProjects,
            }),
            h(ChoiceButton, {
              onClick: () => setIsCreateOpen(true),
              iconName: 'plus-circle',
              title: 'Start with a new workspace',
              detail: 'Set up an empty workspace that you will configure for analysis',
              'aria-haspopup': 'dialog',
              disabled: !userHasBillingProjects,
            }),
            isCreateOpen &&
              h(NewWorkspaceModal, {
                requiredAuthDomain: authorizationDomain,
                customMessage: importMayTakeTime && importMayTakeTimeMessage,
                requireEnhancedBucketLogging: isProtectedData,
                onDismiss: () => setIsCreateOpen(false),
                onSuccess: (w) => {
                  setMode('existing');
                  setIsCreateOpen(false);
                  setSelectedWorkspaceId(w.workspaceId);
                  refreshWorkspaces();
                  onImport(w);
                },
              }),
          ]);
        },
      ]
    ),
    isCloneOpen &&
      h(NewWorkspaceModal, {
        cloneWorkspace: _.find({ workspace: selectedTemplateWorkspaceKey }, workspaces),
        // This modal can only be opened if selectedTemplateWorkspaceKey is set.
        title: `Clone ${selectedTemplateWorkspaceKey!.name} and Import Data`,
        buttonText: 'Clone and Import',
        customMessage: importMayTakeTime && importMayTakeTimeMessage,
        onDismiss: () => setIsCloneOpen(false),
        onSuccess: (w) => {
          setMode('existing');
          setIsCloneOpen(false);
          setSelectedWorkspaceId(w.workspaceId);
          refreshWorkspaces();
          onImport(w);
        },
      }),
    (isImporting || loadingWorkspaces) && spinnerOverlay,
  ]);
};
