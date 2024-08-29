import { icon, IconId } from '@terra-ui-packages/components';
import { cond, switchCase } from '@terra-ui-packages/core-utils';
import _ from 'lodash/fp';
import { AriaAttributes, CSSProperties, Fragment, ReactNode, useState } from 'react';
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
import jupyterLogo from 'src/images/jupyter-logo.svg';
import colors from 'src/libs/colors';
import * as Style from 'src/libs/style';
import * as Utils from 'src/libs/utils';
import { useWorkspaces } from 'src/workspaces/common/state/useWorkspaces';
import { WorkspaceSelector } from 'src/workspaces/common/WorkspaceSelector';
import NewWorkspaceModal from 'src/workspaces/NewWorkspaceModal/NewWorkspaceModal';
import { canWrite, WorkspaceInfo } from 'src/workspaces/utils';
import { WorkspacePolicies } from 'src/workspaces/WorkspacePolicies/WorkspacePolicies';

import {
  getRequiredCloudPlatform,
  importWillUpdateAccessControl,
  requiresSecurityMonitoring,
  sourceHasAccessControl,
} from './import-requirements';
import { ImportRequest, TemplateWorkspaceInfo } from './import-types';
import { buildDestinationWorkspaceFilter } from './import-utils';

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
  'aria-haspopup'?: AriaAttributes['aria-haspopup'];
  detail: string;
  disabled?: boolean;
  iconName: IconId;
  style?: CSSProperties;
  title: string;
  onClick: () => void;
  tooltip?: string;
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
      onClick: disabled ? undefined : onClick,
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

export const selectExistingWorkspacePrompt = 'Select an existing workspace';

export interface ImportDataDestinationProps {
  importRequest: ImportRequest;
  initialSelectedWorkspaceId: string | undefined;
  requiredAuthorizationDomain: string | undefined;
  template: string | undefined;
  templateWorkspaces: { [key: string]: TemplateWorkspaceInfo[] } | undefined;
  userHasBillingProjects: boolean;
  onImport: (workspace: WorkspaceInfo) => void;
}

export const ImportDataDestination = (props: ImportDataDestinationProps): ReactNode => {
  const {
    importRequest,
    initialSelectedWorkspaceId,
    requiredAuthorizationDomain,
    templateWorkspaces,
    template,
    userHasBillingProjects,
    onImport,
  } = props;

  const requiredCloudPlatform = getRequiredCloudPlatform(importRequest);
  const importRequiresSecurityMonitoring = requiresSecurityMonitoring(importRequest);

  // Some import types are finished in a single request.
  // For most though, the import request starts a background task that takes time to complete.
  const immediateImportTypes: ImportRequest['type'][] = ['tdr-snapshot-reference'];
  const importMayTakeTime = !immediateImportTypes.includes(importRequest.type);

  const {
    workspaces,
    refresh: refreshWorkspaces,
    loading: loadingWorkspaces,
  } = useWorkspaces(
    [
      // The decision on whether or data can be imported into a workspace is based on the user's level of access
      // to the workspace and the workspace's authorization domain, protected status and cloud platform.
      // When using a template workspace, the NewWorkspaceModal reads the description attribute
      // from the template.

      // Load the same fields that are loaded by the workspaces list page so that a user can navigate to the
      // workspaces list without a render error. See AJ-1470 for details.
      'accessLevel',
      'public',
      'workspace.attributes.description',
      'workspace.attributes.tag:tags',
      'workspace.authorizationDomain',
      'workspace.cloudPlatform',
      'workspace.createdBy',
      'workspace.googleProject',
      'workspace.lastModified',
      'workspace.name',
      'workspace.namespace',
      'workspace.workspaceId',
      'workspace.state',
      'workspace.errorMessage',

      // Add policies field because we need it to decide if a workspace is suitable for importing protected data.
      'policies',
      // Add bucket name so we can determine if GCP workspaces have secure monitoring enabled.
      'workspace.bucketName',
    ],
    // Truncate description to save bytes.
    // This matches the limit used by the workspaces list.
    250
  );
  const [mode, setMode] = useState<'existing' | 'template' | undefined>(
    initialSelectedWorkspaceId ? 'existing' : undefined
  );
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isCloneOpen, setIsCloneOpen] = useState(false);
  const [selectedTemplateWorkspaceKey, setSelectedTemplateWorkspaceKey] = useState<{
    namespace: string;
    name: string;
  }>();

  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState(initialSelectedWorkspaceId);

  const selectedWorkspace = _.find({ workspace: { workspaceId: selectedWorkspaceId } }, workspaces);

  const filteredTemplates = template
    ? _.flow(
        _.flatMap((id: string) => (templateWorkspaces && templateWorkspaces[id]) || []),
        _.filter(({ name, namespace }) => _.some({ workspace: { namespace, name } }, workspaces))
      )(_.castArray(template))
    : [];
  const canUseTemplateWorkspace = filteredTemplates.length > 0;

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

  const numWritableWorkspaces = workspaces.filter((workspace) => canWrite(workspace.accessLevel)).length;

  const availableDestinationWorkspaces = workspaces.filter(
    buildDestinationWorkspaceFilter(importRequest, { requiredAuthorizationDomain })
  );

  // If some writable workspaces have been filtered by the destination filter,
  // it is because they did not meet the data selection requirements.
  const destinationWorkspaceLimitedByDataRequirements = availableDestinationWorkspaces.length < numWritableWorkspaces;

  // Disable the "Select an existing workspace" option if no suitable workspaces are available.
  const canImportIntoExistingWorkspace = availableDestinationWorkspaces.length > 0;

  const renderSelectExistingWorkspace = () =>
    h(Fragment, [
      h2({ style: styles.title }, [selectExistingWorkspacePrompt]),
      destinationWorkspaceLimitedByDataRequirements &&
        div({ style: { marginTop: '0.5rem', marginBottom: '0.5rem', lineHeight: '1.5' } }, [
          'Only workspaces that meet the data selection requirements are shown.',
        ]),
      h(IdContainer, [
        (id) =>
          h(Fragment, [
            h(WorkspaceSelector, {
              id,
              workspaces: availableDestinationWorkspaces,
              value: selectedWorkspaceId,
              onChange: setSelectedWorkspaceId,
            }),
          ]),
      ]),
      importMayTakeTime &&
        div({ style: { paddingLeft: '0.5rem', paddingRight: '0.5rem', paddingTop: '0.5rem', lineHeight: '1.5' } }, [
          importMayTakeTimeMessage,
        ]),
      !!selectedWorkspace &&
        h(WorkspacePolicies, {
          workspace: selectedWorkspace,
          noCheckboxes: true,
          endingNotice: switchCase(
            importWillUpdateAccessControl(importRequest, selectedWorkspace),
            [true, () => div(['Importing this data will add additional access controls'])],
            [undefined, () => div(['Importing this data may add additional access controls'])]
          ),
        }),
      div({ style: { display: 'flex', alignItems: 'center', marginTop: '1rem' } }, [
        h(ButtonSecondary, { onClick: () => setMode(undefined), style: { marginLeft: 'auto' } }, ['Back']),
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
      h2({ style: styles.title }, ['Select a template']),
      importMayTakeTime && div({ style: { marginBottom: '1rem', lineHeight: '1.5' } }, [p([importMayTakeTimeMessage])]),
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
                          icon('wdl', {
                            style: {
                              height: 23,
                              width: 23,
                              marginLeft: '0.5rem',
                              borderRadius: 3,
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
        h(ButtonSecondary, { style: { marginLeft: 'auto' }, onClick: () => setMode(undefined) }, ['Back']),
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
            !userHasBillingProjects && h(linkAccountPrompt),
            canUseTemplateWorkspace &&
              h(ChoiceButton, {
                onClick: () => setMode('template'),
                iconName: 'copySolid',
                title: 'Select a template',
                detail: 'Clone from one of our template workspaces that has analyses ready for use',
              }),
            h(ChoiceButton, {
              onClick: () => setMode('existing'),
              iconName: 'fileSearchSolid',
              title: selectExistingWorkspacePrompt,
              detail: 'Select one of your workspaces',
              disabled: !canImportIntoExistingWorkspace,
              tooltip: cond(
                [canImportIntoExistingWorkspace, () => undefined],
                [numWritableWorkspaces === 0, () => 'You do not have any writable workspaces.'],
                () => 'No existing workspace meets the data selection requirements.'
              ),
            }),
            h(ChoiceButton, {
              onClick: () => setIsCreateOpen(true),
              iconName: 'plus-circle',
              title: 'Create a new workspace',
              detail: 'Set up an empty workspace that you will configure for analysis',
              'aria-haspopup': 'dialog',
              disabled: !userHasBillingProjects,
            }),
            isCreateOpen &&
              h(NewWorkspaceModal, {
                requiredAuthDomain: requiredAuthorizationDomain,
                cloudPlatform: requiredCloudPlatform,
                renderNotice: () => {
                  const children: ReactNode[] = [];
                  const hasAccessControl = sourceHasAccessControl(importRequest);
                  if (hasAccessControl !== false) {
                    children.push(
                      div({ style: { paddingBottom: importMayTakeTime ? '1.0rem' : 0 } }, [
                        `Importing controlled access data ${
                          hasAccessControl ? 'will' : 'may'
                        } apply any additional access controls associated with the data to this workspace.`,
                      ])
                    );
                  }
                  if (importMayTakeTime) {
                    children.push(div([importMayTakeTimeMessage]));
                  }
                  return children.length > 0 ? h(Fragment, children) : undefined;
                },
                requireEnhancedBucketLogging: importRequiresSecurityMonitoring,
                waitForServices: {
                  wds: true,
                },
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
        renderNotice: () => importMayTakeTime && importMayTakeTimeMessage,
        onDismiss: () => setIsCloneOpen(false),
        onSuccess: (w) => {
          setMode('existing');
          setIsCloneOpen(false);
          setSelectedWorkspaceId(w.workspaceId);
          refreshWorkspaces();
          onImport(w);
        },
      }),
    loadingWorkspaces && spinnerOverlay,
  ]);
};
