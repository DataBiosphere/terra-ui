import { ButtonPrimary, Modal, SpinnerOverlay, useUniqueId } from '@terra-ui-packages/components';
import _ from 'lodash/fp';
import React, { useState } from 'react';
import { AdminNotifierCheckbox } from 'src/components/group-common';
import { ValidatedInput } from 'src/components/input';
import { groupNameValidator } from 'src/groups/List';
import { Ajax } from 'src/libs/ajax';
import { withErrorReporting } from 'src/libs/error';
import { formHint, FormLabel } from 'src/libs/forms';
import { summarizeErrors, withBusyState } from 'src/libs/utils';
import { validate } from 'validate.js';

export const NewGroupModal = ({ onSuccess, onDismiss, existingGroups }) => {
  const [groupName, setGroupName] = useState('');
  const [groupNameTouched, setGroupNameTouched] = useState(false);
  const [allowAccessRequests, setAllowAccessRequests] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const submit = _.flow(
    withBusyState(setSubmitting),
    withErrorReporting('Error creating group')
  )(async () => {
    const groupAjax = Ajax().Groups.group(groupName);
    await groupAjax.create();
    await groupAjax.setPolicy('admin-notifier', allowAccessRequests);
    onSuccess();
  });

  const errors = validate({ groupName }, { groupName: groupNameValidator(existingGroups) });

  const nameInputId = useUniqueId();
  return (
    <Modal
      onDismiss={onDismiss}
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
