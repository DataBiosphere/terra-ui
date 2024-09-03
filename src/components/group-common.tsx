import { Icon, Modal, TooltipTrigger, useUniqueId } from '@terra-ui-packages/components';
import _ from 'lodash/fp';
import React, { useState } from 'react';
import { ButtonPrimary, LabeledCheckbox, Link, spinnerOverlay } from 'src/components/common';
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
export const AdminNotifierCheckbox = (props: AdminNotifierCheckboxProps) => (
  <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center' }}>
    <LabeledCheckbox style={{ marginRight: '0.25rem' }} checked={props.checked} onChange={props.onChange}>
      Allow anyone to request access
    </LabeledCheckbox>
    ,
    <InfoBox style={{ marginLeft: '0.3rem' }}>
      Any user will be able to request to become a member of this group. This will send an email to the group admins.
    </InfoBox>
  </div>
);

interface NewUserCardProps {
  onClick: () => void;
}
export const NewUserCard = (props: NewUserCardProps) => (
  <ButtonPrimary style={{ textTransform: 'none' }} onClick={props.onClick}>
    <Icon icon='plus' size={14} />,<div style={{ marginLeft: '0.5rem' }}>Add User</div>
  </ButtonPrimary>
);

interface UserMenuContentProps {
  onEdit: () => void;
  onDelete: () => void;
}

const UserMenuContent = (props: UserMenuContentProps) => (
  <>
    <MenuButton onClick={props.onEdit}>
      {makeMenuIcon('edit')}
      Edit Role
    </MenuButton>
    ,
    <MenuButton onClick={props.onDelete}>
      {makeMenuIcon('trash')}
      Remove User
    </MenuButton>
  </>
);

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
  (props: MemberCardHeadersProps) => (
    <div
      role='row'
      style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1.5rem', padding: '0 1rem' }}
    >
      <div role='columnheader' aria-sort={ariaSort(props.sort, 'email')} style={{ flex: 1 }}>
        <HeaderRenderer sort={props.sort} onSort={props.onSort} name='email' />
      </div>
      <div role='columnheader' aria-sort={ariaSort(props.sort, 'roles')} style={{ flex: 1 }}>
        <HeaderRenderer sort={props.sort} onSort={props.onSort} name='roles' />
      </div>
      <div
        role='columnheader'
        // Width is the same as the menu icon.
        style={{ width: menuCardSize }}
      >
        <div className='sr-only'>Actions</div>
      </div>
    </div>
  )
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

  return (
    <div role='row' style={Style.cardList.longCardShadowless}>
      <div
        role='rowheader'
        style={{ flex: '1', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', height: '1rem' }}
      >
        {email}
      </div>
      <div role='cell' style={{ flex: '1', textTransform: 'capitalize', height: '1rem' }}>
        {_.includes(adminLabel, roles) ? adminLabel : userLabel}
      </div>
      {isOwner && (
        <div role='cell' style={{ flex: 'none' }}>
          <MenuTrigger
            side='left'
            style={{ height: menuCardSize, width: menuCardSize }}
            closeOnClick
            content={<UserMenuContent onEdit={onEdit} onDelete={onDelete} />}
          >
            {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
            <Link aria-label={`Menu for User: ${email}`} disabled={!canEdit} tooltip={tooltip} tooltipSide='left'>
              <Icon icon='cardMenuIcon' size={menuCardSize} />
            </Link>
          </MenuTrigger>
        </div>
      )}
    </div>
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

  const emailInputId = useUniqueId();

  return Utils.cond(
    [
      confirmAddUser,
      () => (
        <Modal
          title='User is not registered'
          okButton={<ButtonPrimary onClick={inviteUser}>Yes</ButtonPrimary>}
          cancelText='No'
          onDismiss={() => setConfirmAddUser(false)}
        >
          Add <b>{userEmail}</b> to the group anyway?
          {busy && spinnerOverlay}
        </Modal>
      ),
    ],
    () => (
      <Modal
        onDismiss={onDismiss}
        title={title}
        okButton={
          <ButtonPrimary tooltip={Utils.summarizeErrors(errors)} onClick={addUser} disabled={!!errors}>
            Add User
          </ButtonPrimary>
        }
      >
        <FormLabel id={emailInputId} required>
          User email
        </FormLabel>
        <AutocompleteTextInput
          labelId={emailInputId}
          autoFocus
          openOnFocus={false}
          value={userEmail}
          onChange={setUserEmail}
          renderSuggestion={(suggestion) => (
            <div style={styles.suggestionContainer}>
              <div style={{ flex: 1 }}>
                {!canAdd(suggestion) && (
                  <TooltipTrigger content='Not a valid email address'>
                    <Icon icon='warning-standard' style={{ color: colors.danger(), marginRight: '0.5rem' }} />
                  </TooltipTrigger>
                )}
                {suggestion}
              </div>
            </div>
          )}
          suggestions={[...(!!userEmail && !suggestions.includes(userEmail) ? [userEmail] : []), ...suggestions]}
          style={{ fontSize: 16 }}
          type={undefined}
        />
        <FormLabel>Role</FormLabel>
        <LabeledCheckbox checked={isAdmin} onChange={() => setRoles([isAdmin ? userLabel : adminLabel])}>
          {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
          <label style={{ margin: '0 2rem 0 0.25rem' }}>Can manage users {adminLabel}</label>
        </LabeledCheckbox>
        {footer && <div style={{ marginTop: '1rem' }}>{footer}</div>}
        {submitError && (
          <div style={{ marginTop: '0.5rem', textAlign: 'right', color: colors.danger() }}>{submitError}</div>
        )}
        {busy && spinnerOverlay}
      </Modal>
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

  return (
    <Modal
      onDismiss={onDismiss}
      title='Edit Roles'
      okButton={<ButtonPrimary onClick={submit}>Change Role</ButtonPrimary>}
    >
      <div style={{ marginBottom: '0.25rem' }}>
        Edit role for <b>{email}</b>
      </div>
      <LabeledCheckbox checked={isAdmin} onChange={() => setIsAdmin(!isAdmin)}>
        {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
        <label style={{ margin: '0 2rem 0 0.25rem' }}>Can manage users {adminLabel}</label>
      </LabeledCheckbox>
      {submitting && spinnerOverlay}
    </Modal>
  );
};

interface DeleteUserModalProps {
  onDismiss: () => void;
  onSubmit: () => void;
  userEmail: string;
}

export const DeleteUserModal = (props: DeleteUserModalProps) => (
  <Modal
    onDismiss={props.onDismiss}
    title='Confirm'
    okButton={<ButtonPrimary onClick={props.onSubmit}>Remove</ButtonPrimary>}
  >
    <div>
      Are you sure you want to remove , <b>{props.userEmail}</b>?
    </div>
  </Modal>
);
