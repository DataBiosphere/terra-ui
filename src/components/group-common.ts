import { Modal, TooltipTrigger } from '@terra-ui-packages/components';
import _ from 'lodash/fp';
import React, { Fragment, useState } from 'react';
import { b, div, h, label } from 'react-hyperscript-helpers';
import { ButtonPrimary, IdContainer, LabeledCheckbox, Link, spinnerOverlay } from 'src/components/common';
import { icon } from 'src/components/icons';
import { InfoBox } from 'src/components/InfoBox';
import { AutocompleteTextInput } from 'src/components/input';
import { MenuButton } from 'src/components/MenuButton';
import { makeMenuIcon, MenuTrigger } from 'src/components/PopupTrigger';
import { ariaSort, HeaderRenderer } from 'src/components/table';
import { Ajax } from 'src/libs/ajax';
import colors from 'src/libs/colors';
import { withErrorReporting } from 'src/libs/error';
import { FormLabel } from 'src/libs/forms';
import { memoWithName, useCancellation, useOnMount } from 'src/libs/react-utils';
import * as Style from 'src/libs/style';
import * as Utils from 'src/libs/utils';
import validate from 'validate.js';

const styles = {
  suggestionContainer: {
    display: 'flex',
    alignItems: 'center',
    padding: '0.5rem 1rem',
    margin: '0 -1rem',
    borderBottom: `1px solid ${colors.dark(0.4)}`,
  },
};

interface AdminNotifierCheckboxProps {
  checked: boolean;
  onChange: (v: boolean) => void;
}
export const AdminNotifierCheckbox = (props: AdminNotifierCheckboxProps) => {
  const { checked, onChange } = props;
  return div({ style: { marginTop: '0.5rem', display: 'flex', alignItems: 'center' } }, [
    h(
      LabeledCheckbox,
      {
        style: { marginRight: '0.25rem' },
        checked,
        onChange,
      },
      ['Allow anyone to request access']
    ),
    h(InfoBox, { style: { marginLeft: '0.3rem' } }, [
      'Any user will be able to request to become a member of this group. This will send an email to the group admins.',
    ]),
  ]);
};

interface NewUserCardProps {
  onClick: () => void;
}
export const NewUserCard = (props: NewUserCardProps) => {
  return h(
    ButtonPrimary,
    {
      style: { textTransform: 'none' },
      onClick: props.onClick,
    },
    [icon('plus', { size: 14 }), div({ style: { marginLeft: '0.5rem' } }, ['Add User'])]
  );
};

interface UserMenuContentProps {
  onEdit: () => void;
  onDelete: () => void;
}

const UserMenuContent = (props: UserMenuContentProps) => {
  return h(Fragment, [
    h(
      MenuButton,
      {
        onClick: props.onEdit,
      },
      [makeMenuIcon('edit'), 'Edit Role']
    ),
    h(
      MenuButton,
      {
        onClick: props.onDelete,
      },
      [makeMenuIcon('trash'), 'Remove User']
    ),
  ]);
};

const menuCardSize = 20;

export interface Sort {
  field: string;
  direction: string;
}

interface MemberCardHeadersProps {
  sort: Sort;
  onSort: (v: Sort) => void;
}

export const MemberCardHeaders: React.FC<MemberCardHeadersProps> = memoWithName(
  'MemberCardHeaders',
  (props: MemberCardHeadersProps) => {
    const { sort, onSort } = props;
    return div(
      {
        role: 'row',
        style: { display: 'flex', justifyContent: 'space-between', marginTop: '1.5rem', padding: '0 1rem' },
      },
      [
        div({ role: 'columnheader', 'aria-sort': ariaSort(sort, 'email'), style: { flex: 1 } }, [
          h(HeaderRenderer, { sort, onSort, name: 'email' }),
        ]),
        div({ role: 'columnheader', 'aria-sort': ariaSort(sort, 'roles'), style: { flex: 1 } }, [
          h(HeaderRenderer, { sort, onSort, name: 'roles' }),
        ]),
        // Width is the same as the menu icon.
        div({ role: 'columnheader', style: { width: menuCardSize } }, [div({ className: 'sr-only' }, ['Actions'])]),
      ]
    );
  }
);

export interface User {
  email: string;
  roles: string[]; // In practice will be BillingRole or GroupRole
}

interface MemberCardProps {
  member: User;
  adminCanEdit: boolean;
  onEdit: () => void;
  onDelete: () => void;
  adminLabel: string;
  userLabel: string;
  isOwner: boolean;
}

export const MemberCard: React.FC<MemberCardProps> = memoWithName('MemberCard', (props: MemberCardProps) => {
  const {
    member: { email, roles },
    adminCanEdit,
    onEdit,
    onDelete,
    adminLabel,
    userLabel,
    isOwner,
  } = props;
  const canEdit = adminCanEdit || !_.includes(adminLabel, roles);
  const tooltip = !canEdit && `This user is the only ${adminLabel}`;

  return div(
    {
      role: 'row',
      style: Style.cardList.longCardShadowless,
    },
    [
      div(
        {
          role: 'rowheader',
          style: { flex: '1', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', height: '1rem' },
        },
        [email]
      ),
      div({ role: 'cell', style: { flex: '1', textTransform: 'capitalize', height: '1rem' } }, [
        _.includes(adminLabel, roles) ? adminLabel : userLabel,
      ]),
      isOwner &&
        div({ role: 'cell', style: { flex: 'none' } }, [
          h(
            MenuTrigger,
            {
              side: 'left',
              style: { height: menuCardSize, width: menuCardSize },
              closeOnClick: true,
              content: h(UserMenuContent, { onEdit, onDelete }),
            },
            [
              h(Link, { 'aria-label': `Menu for User: ${email}`, disabled: !canEdit, tooltip, tooltipSide: 'left' }, [
                icon('cardMenuIcon', { size: menuCardSize }),
              ]),
            ]
          ),
        ]),
    ]
  );
});

interface NewUserModalProps {
  addFunction: (roles: string[], email: string) => Promise<void>;
  addUnregisteredUser?: boolean;
  adminLabel: string;
  userLabel: string;
  title: string;
  onSuccess: () => void;
  onDismiss: () => void;
  footer?: React.ReactNode[];
}
export const NewUserModal = (props: NewUserModalProps) => {
  const {
    addFunction,
    addUnregisteredUser = false,
    adminLabel,
    userLabel,
    title,
    onSuccess,
    onDismiss,
    footer,
  } = props;
  const [userEmail, setUserEmail] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [confirmAddUser, setConfirmAddUser] = useState(false);
  const [roles, setRoles] = useState<string[]>([userLabel]);
  const [submitError, setSubmitError] = useState(undefined);
  const [busy, setBusy] = useState(false);

  const signal = useCancellation();

  useOnMount(() => {
    const loadData = withErrorReporting('Error looking up collaborators')(async () => {
      const [shareSuggestions, groups] = await Promise.all([
        Ajax(signal).Workspaces.getShareLog(),
        Ajax(signal).Groups.list(),
      ]);

      const suggestions = _.flow(_.map('groupEmail'), _.concat(shareSuggestions), _.uniq)(groups);

      setSuggestions(suggestions);
    });

    loadData();
  });

  const submit = async () => {
    // only called by invite and add, which set busy & catch errors
    try {
      await addFunction(roles, userEmail);
      onSuccess();
    } catch (error: any) {
      if ('status' in error && error.status >= 400 && error.status <= 499) {
        setSubmitError((await error.json()).message);
      } else {
        throw error;
      }
    }
  };

  const inviteUser = _.flow(
    withErrorReporting('Error adding user'),
    Utils.withBusyState(setBusy)
  )(async () => {
    await Ajax(signal).User.inviteUser(userEmail);
    await submit();
  });

  const addUser = _.flow(
    withErrorReporting('Error adding user'),
    Utils.withBusyState(setBusy)
  )(async () => {
    addUnregisteredUser && !(await Ajax(signal).User.isUserRegistered(userEmail))
      ? setConfirmAddUser(true)
      : await submit();
  });

  const errors = validate({ userEmail }, { userEmail: { email: true } });
  const isAdmin = _.includes(adminLabel, roles);

  const canAdd = (value) => value !== userEmail || !errors;

  return Utils.cond(
    [
      confirmAddUser,
      () =>
        h(
          Modal,
          {
            title: 'User is not registered',
            okButton: h(ButtonPrimary, { onClick: inviteUser }, ['Yes']),
            cancelText: 'No',
            onDismiss: () => setConfirmAddUser(false),
          },
          ['Add ', b([userEmail]), ' to the group anyway?', busy && spinnerOverlay]
        ),
    ],
    () =>
      h(
        Modal,
        {
          onDismiss,
          title,
          okButton: h(
            ButtonPrimary,
            {
              tooltip: Utils.summarizeErrors(errors),
              onClick: addUser,
              disabled: errors,
            },
            ['Add User']
          ),
        },
        [
          h(IdContainer, [
            (id) =>
              h(Fragment, [
                h(FormLabel, { id, required: true }, ['User email']),
                h(AutocompleteTextInput, {
                  labelId: id,
                  autoFocus: true,
                  openOnFocus: false,
                  value: userEmail,
                  onChange: setUserEmail,
                  renderSuggestion: (suggestion) =>
                    div({ style: styles.suggestionContainer }, [
                      div({ style: { flex: 1 } }, [
                        !canAdd(suggestion) &&
                          h(
                            TooltipTrigger,
                            {
                              content: 'Not a valid email address',
                            },
                            [icon('warning-standard', { style: { color: colors.danger(), marginRight: '0.5rem' } })]
                          ),
                        suggestion,
                      ]),
                    ]),
                  suggestions: [
                    ...(!!userEmail && !suggestions.includes(userEmail) ? [userEmail] : []),
                    ...suggestions,
                  ],
                  style: { fontSize: 16 },
                  type: undefined,
                }),
              ]),
          ]),
          h(FormLabel, ['Role']),
          h(
            LabeledCheckbox,
            {
              checked: isAdmin,
              onChange: () => setRoles([isAdmin ? userLabel : adminLabel]),
            },
            [label({ style: { margin: '0 2rem 0 0.25rem' } }, [`Can manage users (${adminLabel})`])]
          ),
          footer && div({ style: { marginTop: '1rem' } }, [footer]),
          submitError &&
            div({ style: { marginTop: '0.5rem', textAlign: 'right', color: colors.danger() } }, [submitError]),
          busy && spinnerOverlay,
        ]
      )
  );
};

interface EditUserModalProps {
  adminLabel: string;
  userLabel: string;
  user: User;
  onSuccess: () => void;
  onDismiss: () => void;
  saveFunction: (email: string, roles: string[], newRoles: string[]) => Promise<void | void[]>;
}
export const EditUserModal = (props: EditUserModalProps) => {
  const {
    adminLabel,
    userLabel,
    user: { email, roles },
    onSuccess,
    onDismiss,
    saveFunction,
  } = props;
  const [isAdmin, setIsAdmin] = useState(_.includes(adminLabel, roles));
  const [submitting, setSubmitting] = useState(false);

  const submit = _.flow(
    Utils.withBusyState(setSubmitting),
    withErrorReporting('Error updating user')
  )(async () => {
    const applyAdminChange = _.flow(
      _.without([isAdmin ? userLabel : adminLabel]),
      _.union([isAdmin ? adminLabel : userLabel])
    );

    await saveFunction(email, roles, applyAdminChange(roles));
    onSuccess();
  });

  return h(
    Modal,
    {
      onDismiss,
      title: 'Edit Roles',
      okButton: h(
        ButtonPrimary,
        {
          onClick: submit,
        },
        ['Change Role']
      ),
    },
    [
      div({ style: { marginBottom: '0.25rem' } }, ['Edit role for ', b([email])]),
      h(
        LabeledCheckbox,
        {
          checked: isAdmin,
          onChange: () => setIsAdmin(!isAdmin),
        },
        [label({ style: { margin: '0 2rem 0 0.25rem' } }, [`Can manage users (${adminLabel})`])]
      ),
      submitting && spinnerOverlay,
    ]
  );
};

interface DeleteUserModalProps {
  onDismiss: () => void;
  onSubmit: () => void;
  userEmail: string;
}
export const DeleteUserModal = (props: DeleteUserModalProps) => {
  const { onDismiss, onSubmit, userEmail } = props;
  return h(
    Modal,
    {
      onDismiss,
      title: 'Confirm',
      okButton: h(
        ButtonPrimary,
        {
          onClick: onSubmit,
        },
        ['Remove']
      ),
    },
    [div(['Are you sure you want to remove']), b([`${userEmail}?`])]
  );
};
