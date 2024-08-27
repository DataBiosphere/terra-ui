import { Modal } from '@terra-ui-packages/components';
import _ from 'lodash/fp';
import { Fragment, useState } from 'react';
import { h } from 'react-hyperscript-helpers';
import { ButtonPrimary, IdContainer, spinnerOverlay } from 'src/components/common';
import { AdminNotifierCheckbox } from 'src/components/group-common';
import { ValidatedInput } from 'src/components/input';
import { groupNameValidator } from 'src/groups/List';
import { Ajax } from 'src/libs/ajax';
import { withErrorReporting } from 'src/libs/error';
import { formHint, FormLabel } from 'src/libs/forms';
import * as Utils from 'src/libs/utils';
import { validate } from 'validate.js';

export const NewGroupModal = ({ onSuccess, onDismiss, existingGroups }) => {
  const [groupName, setGroupName] = useState('');
  const [groupNameTouched, setGroupNameTouched] = useState(false);
  const [allowAccessRequests, setAllowAccessRequests] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const submit = _.flow(
    Utils.withBusyState(setSubmitting),
    withErrorReporting('Error creating group')
  )(async () => {
    const groupAjax = Ajax().Groups.group(groupName);
    await groupAjax.create();
    await groupAjax.setPolicy('admin-notifier', allowAccessRequests);
    onSuccess();
  });

  const errors = validate({ groupName }, { groupName: groupNameValidator(existingGroups) });

  return h(
    Modal,
    {
      onDismiss,
      title: 'Create New Group',
      okButton: h(
        ButtonPrimary,
        {
          disabled: errors,
          onClick: submit,
        },
        ['Create Group']
      ),
    },
    [
      h(IdContainer, [
        (id) =>
          h(Fragment, [
            h(FormLabel, { required: true, htmlFor: id }, ['Enter a unique name']),
            h(ValidatedInput, {
              inputProps: {
                id,
                autoFocus: true,
                value: groupName,
                onChange: (v) => {
                  setGroupName(v);
                  setGroupNameTouched(true);
                },
              },
              error: groupNameTouched && Utils.summarizeErrors(errors?.groupName),
            }),
          ]),
      ]),
      !(groupNameTouched && errors) && formHint('Only letters, numbers, underscores, and dashes allowed'),
      h(AdminNotifierCheckbox, {
        checked: allowAccessRequests,
        onChange: setAllowAccessRequests,
      }),
      submitting && spinnerOverlay,
    ]
  );
};
