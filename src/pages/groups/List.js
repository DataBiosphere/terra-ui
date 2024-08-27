import { Modal } from '@terra-ui-packages/components';
import _ from 'lodash/fp';
import { Fragment, useState } from 'react';
import { a, div, h } from 'react-hyperscript-helpers';
import { ClipboardButton } from 'src/components/ClipboardButton';
import { ButtonPrimary, IdContainer, Link, spinnerOverlay } from 'src/components/common';
import { AdminNotifierCheckbox } from 'src/components/group-common';
import { icon } from 'src/components/icons';
import { ValidatedInput } from 'src/components/input';
import { ariaSort, HeaderRenderer } from 'src/components/table';
import GroupMenu from 'src/groups/GroupMenu';
import { Ajax } from 'src/libs/ajax';
import colors from 'src/libs/colors';
import { withErrorReporting } from 'src/libs/error';
import { formHint, FormLabel } from 'src/libs/forms';
import * as Nav from 'src/libs/nav';
import { memoWithName } from 'src/libs/react-utils';
import * as Style from 'src/libs/style';
import * as Utils from 'src/libs/utils';
import { validate } from 'validate.js';

const groupNameValidator = (existing) => ({
  presence: { allowEmpty: false },
  length: { maximum: 60 },
  format: {
    pattern: /[A-Za-z0-9_-]*$/,
    message: 'can only contain letters, numbers, underscores, and dashes',
  },
  exclusion: {
    within: existing,
    message: 'already exists',
  },
});

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

const columnWidths = '1fr 30% 6rem 20px';

export const GroupCardHeaders = memoWithName('GroupCardHeaders', ({ sort, onSort }) => {
  return div(
    {
      role: 'row',
      style: { display: 'grid', gridTemplateColumns: columnWidths, justifyContent: 'space-between', marginTop: '1.5rem', padding: '0 1rem' },
    },
    [
      div({ role: 'columnheader', 'aria-sort': ariaSort(sort, 'groupName'), style: { marginRight: '1rem' } }, [
        h(HeaderRenderer, { sort, onSort, name: 'groupName' }),
      ]),
      div({ role: 'columnheader', 'aria-sort': ariaSort(sort, 'groupEmail') }, [h(HeaderRenderer, { sort, onSort, name: 'groupEmail' })]),
      div({ role: 'columnheader', 'aria-sort': ariaSort(sort, 'role') }, [
        // This behaves strangely due to the fact that role is an array. If you have multiple roles it can do strange things.
        h(HeaderRenderer, { sort, onSort, name: 'role' }),
      ]),
      div({ role: 'columnheader' }, [div({ className: 'sr-only' }, ['Actions'])]),
    ]
  );
});

export const GroupCard = memoWithName('GroupCard', ({ group: { groupName, groupEmail, role }, onDelete, onLeave }) => {
  const isAdmin = !!_.includes('admin', role);

  return div(
    {
      role: 'row',
      className: 'table-row',
      style: { ...Style.cardList.longCardShadowless, margin: 0, display: 'grid', gridTemplateColumns: columnWidths },
    },
    [
      div({ role: 'rowheader', style: { marginRight: '1rem', ...Style.noWrapEllipsis } }, [
        a(
          {
            href: isAdmin ? Nav.getLink('group', { groupName }) : undefined,
            'aria-disabled': !isAdmin,
            style: {
              ...Style.cardList.longTitle,
              color: isAdmin ? colors.accent() : undefined,
            },
          },
          [groupName]
        ),
      ]),
      div({ role: 'cell', style: { display: 'flex', overflow: 'hidden', alignItems: 'center' } }, [
        div({ style: { ...Style.noWrapEllipsis, marginRight: '0.5rem' } }, [groupEmail]),
        h(ClipboardButton, {
          'aria-label': 'Copy group email to clipboard',
          text: groupEmail,
          className: 'hover-only',
          style: { marginRight: '1rem' },
        }),
      ]),
      div({ role: 'cell' }, [isAdmin ? 'Admin' : 'Member']),
      div({ role: 'cell', style: { display: 'flex', alignItems: 'center' } }, [
        h(GroupMenu, {
          iconSize: 20,
          popupLocation: 'left',
          groupName,
          isAdmin,
          callbacks: { onDelete, onLeave },
        }),
      ]),
    ]
  );
});

export const NewGroupCard = ({ onClick }) => {
  return h(
    ButtonPrimary,
    {
      style: { textTransform: 'none' },
      onClick,
    },
    [icon('plus', { size: 14 }), div({ style: { marginLeft: '0.5rem' } }, ['Create a New Group'])]
  );
};

export const NoGroupsMessage = div({ style: { fontSize: 20, margin: '1rem 1rem 0' } }, [
  div(['Create a group to share your workspaces with others.']),
  div({ style: { marginTop: '1rem', fontSize: 16 } }, [
    h(
      Link,
      {
        ...Utils.newTabLinkProps,
        href: 'https://support.terra.bio/hc/en-us/articles/360026775691',
      },
      ['How do I use groups to manage authorization?']
    ),
  ]),
]);
