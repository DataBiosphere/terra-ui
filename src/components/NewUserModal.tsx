import { ButtonPrimary, Icon, Modal, SpinnerOverlay, TooltipTrigger, useUniqueId } from '@terra-ui-packages/components';
import _ from 'lodash/fp';
import React, { useState } from 'react';
import { LabeledCheckbox } from 'src/components/common';
import { AutocompleteTextInput } from 'src/components/input';
import { Ajax } from 'src/libs/ajax';
import colors from 'src/libs/colors';
import { withErrorReporting } from 'src/libs/error';
import { FormLabel } from 'src/libs/forms';
import { useCancellation, useOnMount } from 'src/libs/react-utils';
import { cond, summarizeErrors, withBusyState } from 'src/libs/utils';
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
    withBusyState(setBusy)
  )(async () => {
    await Ajax(signal).User.inviteUser(userEmail);
    await submit();
  });

  const addUser = _.flow(
    withErrorReporting('Error adding user'),
    withBusyState(setBusy)
  )(async () => {
    addUnregisteredUser && !(await Ajax(signal).User.isUserRegistered(userEmail))
      ? setConfirmAddUser(true)
      : await submit();
  });

  const errors = validate({ userEmail }, { userEmail: { email: true } });
  const isAdmin = _.includes(adminLabel, roles);

  const canAdd = (value) => value !== userEmail || !errors;

  const emailInputId = useUniqueId();

  return cond(
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
          {busy && <SpinnerOverlay />}
        </Modal>
      ),
    ],
    () => (
      <Modal
        onDismiss={onDismiss}
        title={title}
        okButton={
          <ButtonPrimary tooltip={summarizeErrors(errors)} onClick={addUser} disabled={!!errors}>
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
          <label style={{ margin: '0 2rem 0 0.25rem' }}>Can manage users ({adminLabel})</label>
        </LabeledCheckbox>
        {footer && <div style={{ marginTop: '1rem' }}>{footer}</div>}
        {submitError && (
          <div style={{ marginTop: '0.5rem', textAlign: 'right', color: colors.danger() }}>{submitError}</div>
        )}
        {busy && <SpinnerOverlay />}
      </Modal>
    )
  );
};
