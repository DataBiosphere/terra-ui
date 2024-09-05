import { ButtonPrimary, Modal, SpinnerOverlay, useUniqueId } from '@terra-ui-packages/components';
import React, { ReactNode, useState } from 'react';
import { AdminNotifierCheckbox } from 'src/components/group-common';
import { ValidatedInput } from 'src/components/input';
import { groupNameValidator } from 'src/groups/List';
import { Ajax } from 'src/libs/ajax';
import { reportError } from 'src/libs/error';
import { formHint, FormLabel } from 'src/libs/forms';
import { summarizeErrors } from 'src/libs/utils';
import { validate } from 'validate.js';

interface NewGroupModalProps {
  onSuccess: () => void;
  onDismiss: () => void;
  existingGroups: string[];
}
export const NewGroupModal = (props: NewGroupModalProps): ReactNode => {
  const [groupName, setGroupName] = useState('');
  const [groupNameTouched, setGroupNameTouched] = useState(false);
  const [allowAccessRequests, setAllowAccessRequests] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    setSubmitting(true);
    try {
      const groupAjax = Ajax().Groups.group(groupName);
      await groupAjax.create();
      await groupAjax.setPolicy('admin-notifier', allowAccessRequests);
      props.onSuccess();
    } catch (error) {
      reportError('Error creating group', error);
    } finally {
      setSubmitting(false);
    }
  };

  const errors = validate({ groupName }, { groupName: groupNameValidator(props.existingGroups) });

  const nameInputId = useUniqueId();
  return (
    <Modal
      onDismiss={props.onDismiss}
      title='Create New Group'
      okButton={
        <ButtonPrimary disabled={!!errors} onClick={submit}>
          Create Group
        </ButtonPrimary>
      }
    >
      <FormLabel required htmlFor={nameInputId}>
        Enter a unique name
      </FormLabel>
      <ValidatedInput
        inputProps={{
          id: nameInputId,
          autoFocus: true,
          value: groupName,
          onChange: (v) => {
            setGroupName(v);
            setGroupNameTouched(true);
          },
        }}
        error={groupNameTouched && summarizeErrors(errors?.groupName)}
      />
      {!(groupNameTouched && errors) && formHint('Only letters, numbers, underscores, and dashes allowed')}
      <AdminNotifierCheckbox checked={allowAccessRequests} onChange={setAllowAccessRequests} />
      {submitting && <SpinnerOverlay />}
    </Modal>
  );
};
