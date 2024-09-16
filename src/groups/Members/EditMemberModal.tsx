import { ButtonPrimary, Modal, SpinnerOverlay } from '@terra-ui-packages/components';
import _ from 'lodash/fp';
import React, { ReactNode, useState } from 'react';
import { LabeledCheckbox } from 'src/components/common';
import { Member } from 'src/groups/Members/MemberTable';
import { withErrorReporting } from 'src/libs/error';
import { withBusyState } from 'src/libs/utils';

interface EditMemberModalProps {
  adminLabel: string;
  memberLabel: string;
  member: Member;
  onSuccess: () => void;
  onDismiss: () => void;
  saveFunction: (email: string, roles: string[], newRoles: string[]) => Promise<void | void[]>;
}

export const EditMemberModal = (props: EditMemberModalProps): ReactNode => {
  const {
    adminLabel,
    memberLabel,
    member: { email, roles },
    onSuccess,
    onDismiss,
    saveFunction,
  } = props;
  const [isAdmin, setIsAdmin] = useState(_.includes(adminLabel, roles));
  const [submitting, setSubmitting] = useState(false);

  const submit = _.flow(
    withBusyState(setSubmitting),
    withErrorReporting('Error updating user')
  )(async () => {
    const applyAdminChange = _.flow(
      _.without([isAdmin ? memberLabel : adminLabel]),
      _.union([isAdmin ? adminLabel : memberLabel])
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
        <label style={{ margin: '0 2rem 0 0.25rem' }}>Can manage users ({adminLabel})</label>
      </LabeledCheckbox>
      {submitting && <SpinnerOverlay />}
    </Modal>
  );
};
