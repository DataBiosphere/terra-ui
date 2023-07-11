import _ from 'lodash/fp';
import React, { Fragment, useLayoutEffect, useRef, useState } from 'react';
import { div, h, label, p, span } from 'react-hyperscript-helpers';
import { ButtonPrimary, ButtonSecondary, IdContainer, spinnerOverlay, Switch } from 'src/components/common';
import { icon } from 'src/components/icons';
import { AutocompleteTextInput } from 'src/components/input';
import Modal, { styles as modalStyles } from 'src/components/Modal';
import TooltipTrigger from 'src/components/TooltipTrigger';
import { Ajax } from 'src/libs/ajax';
import colors from 'src/libs/colors';
import { reportError } from 'src/libs/error';
import Events, { extractWorkspaceDetails } from 'src/libs/events';
import { FormLabel } from 'src/libs/forms';
import { useCancellation, useOnMount } from 'src/libs/react-utils';
import { append, cond, withBusyState } from 'src/libs/utils';
import { hasProtectedData, isAzureWorkspace, WorkspaceWrapper } from 'src/libs/workspace-utils';
import { CurrentCollaborators } from 'src/pages/workspaces/workspace/ShareWorkspaceModal/CurrentCollaborators';
import {
  aclEntryIsTerraSupport,
  terraSupportAccessLevel,
  terraSupportEmail,
  transformAcl,
  WorkspaceAcl,
} from 'src/pages/workspaces/workspace/WorkspaceAcl';
import validate from 'validate.js';

interface ShareWorkspaceModalProps {
  workspace: WorkspaceWrapper;
  onDismiss: () => void;
}

const ShareWorkspaceModal: React.FC<ShareWorkspaceModalProps> = (props: ShareWorkspaceModalProps) => {
  const { onDismiss, workspace } = props;
  const { namespace, name } = workspace.workspace;

  // State
  const [shareSuggestions, setShareSuggestions] = useState<string[]>([]);
  const [groups, setGroups] = useState([]);
  const [originalAcl, setOriginalAcl] = useState<WorkspaceAcl>([]);
  const [searchValue, setSearchValue] = useState('');
  const [acl, setAcl] = useState<WorkspaceAcl>([]);
  const [loaded, setLoaded] = useState(false);
  const [working, setWorking] = useState(false);
  const [updateError, setUpdateError] = useState(undefined);
  const [lastAddedEmail, setLastAddedEmail] = useState(undefined);
  const [searchHasFocus, setSearchHasFocus] = useState(true);
  const list = useRef<HTMLDivElement>(null);

  const signal = useCancellation();

  // Lifecycle
  useOnMount(() => {
    const load = async () => {
      try {
        const [{ acl }, shareSuggestions, groups] = await Promise.all([
          Ajax(signal).Workspaces.workspace(namespace, name).getAcl(),
          Ajax(signal).Workspaces.getShareLog(),
          Ajax(signal).Groups.list(),
        ]);

        const fixedAcl: WorkspaceAcl = transformAcl(acl);
        setAcl(fixedAcl);
        setOriginalAcl(fixedAcl);
        setGroups(groups);
        setShareSuggestions(shareSuggestions);
        setLoaded(true);
      } catch (error) {
        onDismiss();
        reportError('Error looking up collaborators', error);
      }
    };

    load();
  });

  useLayoutEffect(() => {
    !!lastAddedEmail && list?.current?.scrollTo({ top: list?.current?.scrollHeight, behavior: 'smooth' });
  }, [lastAddedEmail]);

  // Render
  const searchValueValid = !validate({ searchValue }, { searchValue: { email: true } });
  const aclEmails = _.map('email', acl);

  const suggestions = _.flow(
    _.map('groupEmail'),
    _.concat(shareSuggestions),
    (list) => _.difference(list, aclEmails),
    _.uniq
  )(groups);

  const remainingSuggestions = _.difference(suggestions, _.map('email', acl));

  const addUserReminder = `Did you mean to add ${searchValue} as a collaborator? Add them or clear the "User email" field to save changes.`;

  const addCollaborator = (collaboratorEmail) => {
    if (!validate.single(collaboratorEmail, { email: true, exclusion: aclEmails })) {
      setSearchValue('');
      setAcl(append({ email: collaboratorEmail, accessLevel: 'READER' }));
      setLastAddedEmail(collaboratorEmail);
    }
  };

  const currentTerraSupportAccessLevel = terraSupportAccessLevel(originalAcl);
  const newTerraSupportAccessLevel = terraSupportAccessLevel(acl);
  const addTerraSupportToAcl = () => addCollaborator(terraSupportEmail);
  const removeTerraSupportFromAcl = () => setAcl(_.remove(aclEntryIsTerraSupport));

  const save = withBusyState(setWorking, async () => {
    const aclEmails = _.map('email', acl);
    const needsDelete = _.remove((entry) => aclEmails.includes(entry.email), originalAcl);
    const numAdditions = _.filter(({ email }) => !_.some({ email }, originalAcl), acl).length;
    const eventData = { numAdditions, ...extractWorkspaceDetails(workspace.workspace) };

    const aclUpdates = [
      ..._.flow(
        _.remove({ accessLevel: 'PROJECT_OWNER' }),
        _.map(_.pick(['email', 'accessLevel', 'canShare', 'canCompute']))
      )(acl),
      ..._.map(({ email }) => ({ email, accessLevel: 'NO ACCESS' }), needsDelete),
    ];

    try {
      await Ajax().Workspaces.workspace(namespace, name).updateAcl(aclUpdates);
      !!numAdditions && Ajax().Metrics.captureEvent(Events.workspaceShare, { ...eventData, success: true });
      if (!currentTerraSupportAccessLevel && newTerraSupportAccessLevel) {
        Ajax().Metrics.captureEvent(Events.workspaceShareWithSupport, extractWorkspaceDetails(workspace.workspace));
      }
      onDismiss();
    } catch (error: any) {
      !!numAdditions && Ajax().Metrics.captureEvent(Events.workspaceShare, { ...eventData, success: false });
      setUpdateError(await error.text());
    }
  });

  return h(
    Modal,
    {
      title: 'Share Workspace',
      width: 550,
      showButtons: false,
      onDismiss,
    },
    [
      isAzureWorkspace(workspace) && hasProtectedData(workspace) ? h(ProtectedDataWarning) : h(Fragment),
      div({ style: { display: 'flex', alignItems: 'flex-end' } }, [
        h(IdContainer, [
          (id) =>
            div({ style: { flexGrow: 1, marginRight: '1rem' } }, [
              h(FormLabel, { id }, ['User email']),
              h(AutocompleteTextInput, {
                labelId: id,
                openOnFocus: true,
                placeholderText: _.includes(searchValue, aclEmails)
                  ? 'This email has already been added to the list'
                  : 'Type an email address and press "Enter" or "Return"',
                onPick: addCollaborator,
                placeholder: 'Add people or groups',
                value: searchValue,
                onFocus: () => {
                  setSearchHasFocus(true);
                },
                onBlur: () => {
                  setSearchHasFocus(false);
                },
                onChange: setSearchValue,
                suggestions: cond(
                  [searchValueValid && !_.includes(searchValue, aclEmails), () => [searchValue]],
                  [remainingSuggestions.length, () => remainingSuggestions],
                  () => []
                ),
                style: { fontSize: 16 },
              }),
            ]),
        ]),
        h(
          ButtonPrimary,
          {
            disabled: !searchValueValid,
            tooltip: !searchValueValid && 'Enter an email address to add a collaborator',
            onClick: () => {
              addCollaborator(searchValue);
            },
          },
          ['Add']
        ),
      ]),
      searchValueValid && !searchHasFocus && p([addUserReminder]),
      h(CurrentCollaborators, { acl, setAcl, originalAcl, lastAddedEmail, workspace, loaded }),
      updateError && div({ style: { marginTop: '1rem' } }, [div(['An error occurred:']), updateError]),
      div({ style: { ...modalStyles.buttonRow, justifyContent: 'space-between' } }, [
        h(IdContainer, [
          (id) =>
            h(
              TooltipTrigger,
              {
                content: cond(
                  [
                    !currentTerraSupportAccessLevel && !newTerraSupportAccessLevel,
                    () => 'Allow Terra Support to view this workspace',
                  ],
                  [
                    !currentTerraSupportAccessLevel && newTerraSupportAccessLevel,
                    () =>
                      `Saving will grant Terra Support ${_.toLower(
                        newTerraSupportAccessLevel!
                      )} access to this workspace`,
                  ],
                  [
                    currentTerraSupportAccessLevel && !newTerraSupportAccessLevel,
                    () => "Saving will remove Terra Support's access to this workspace",
                  ],
                  [
                    currentTerraSupportAccessLevel !== newTerraSupportAccessLevel,
                    () =>
                      `Saving will change Terra Support's level of access to this workspace from ${_.toLower(
                        currentTerraSupportAccessLevel!
                      )} to ${_.toLower(newTerraSupportAccessLevel!)}`,
                  ],
                  [
                    currentTerraSupportAccessLevel === newTerraSupportAccessLevel,
                    () => `Terra Support has ${_.toLower(newTerraSupportAccessLevel!)} access to this workspace`,
                  ]
                ),
              },
              [
                label({ htmlFor: id }, [
                  span({ style: { marginRight: '1ch' } }, ['Share with Support']),
                  h(Switch, {
                    id,
                    checked: !!newTerraSupportAccessLevel,
                    onLabel: 'Yes',
                    offLabel: 'No',
                    width: 70,
                    onChange: (checked) => {
                      if (checked) {
                        addTerraSupportToAcl();
                      } else {
                        removeTerraSupportFromAcl();
                      }
                    },
                  }),
                ]),
              ]
            ),
        ]),
        span([
          h(
            ButtonSecondary,
            {
              style: { marginRight: '1rem' },
              onClick: onDismiss,
            },
            ['Cancel']
          ),
          h(
            ButtonPrimary,
            {
              disabled: searchValueValid,
              tooltip: searchValueValid && addUserReminder,
              onClick: save,
            },
            ['Save']
          ),
        ]),
      ]),
      working && spinnerOverlay,
    ]
  );
};

const ProtectedDataWarning: React.FC = () => {
  const msg =
    'Do not share Unclassified Confidential Information with anyone unauthorized to access such information, ' +
    'as it violates US Federal Policy (ie FISMA, FIPS-199, etc) ' +
    'unless explicitly authorized by the dataset manager or governed by your own agreements';

  return div(
    {
      role: 'textbox',
      style: {
        display: 'flex',
        flexDirection: 'row',
        padding: '0.5rem',
        fontWeight: 'bold',
        backgroundColor: colors.dark(0.25),
      },
    },
    [
      icon('warning-standard', {
        size: 26,
        style: { color: colors.danger(1), flexShrink: 0, margin: '0.5rem' },
      }),
      msg,
    ]
  );
};

export default ShareWorkspaceModal;
