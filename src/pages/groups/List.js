import _ from 'lodash/fp';
import { Fragment, useEffect, useState } from 'react';
import { a, div, h, h2 } from 'react-hyperscript-helpers';
import { ClipboardButton } from 'src/components/ClipboardButton';
import { ButtonPrimary, DeleteConfirmationModal, IdContainer, Link, spinnerOverlay } from 'src/components/common';
import FooterWrapper from 'src/components/FooterWrapper';
import { AdminNotifierCheckbox } from 'src/components/group-common';
import { icon } from 'src/components/icons';
import { DelayedSearchInput, ValidatedInput } from 'src/components/input';
import LeaveResourceModal from 'src/components/LeaveResourceModal';
import Modal from 'src/components/Modal';
import { PageBox, PageBoxVariants } from 'src/components/PageBox';
import { ariaSort, HeaderRenderer } from 'src/components/table';
import TopBar from 'src/components/TopBar';
import { Ajax } from 'src/libs/ajax';
import colors from 'src/libs/colors';
import { withErrorReporting } from 'src/libs/error';
import { formHint, FormLabel } from 'src/libs/forms';
import * as Nav from 'src/libs/nav';
import { memoWithName, useCancellation, useOnMount } from 'src/libs/react-utils';
import * as StateHistory from 'src/libs/state-history';
import * as Style from 'src/libs/style';
import * as Utils from 'src/libs/utils';
import GroupMenu from 'src/pages/groups/GroupMenu';
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

const NewGroupModal = ({ onSuccess, onDismiss, existingGroups }) => {
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

const GroupCardHeaders = memoWithName('GroupCardHeaders', ({ sort, onSort }) => {
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

const GroupCard = memoWithName('GroupCard', ({ group: { groupName, groupEmail, role }, onDelete, onLeave }) => {
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

const NewGroupCard = ({ onClick }) => {
  return h(
    ButtonPrimary,
    {
      style: { textTransform: 'none' },
      onClick,
    },
    [icon('plus', { size: 14 }), div({ style: { marginLeft: '0.5rem' } }, ['Create a New Group'])]
  );
};

const noGroupsMessage = div({ style: { fontSize: 20, margin: '1rem 1rem 0' } }, [
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

const GroupList = () => {
  // State
  const [filter, setFilter] = useState(() => StateHistory.get().filter || '');
  const [groups, setGroups] = useState(() => StateHistory.get().groups || null);
  const [creatingNewGroup, setCreatingNewGroup] = useState(false);
  const [deletingGroup, setDeletingGroup] = useState(false);
  const [leavingGroup, setLeavingGroup] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [busy, setBusy] = useState(false);
  const [sort, setSort] = useState({ field: 'groupName', direction: 'asc' });

  const signal = useCancellation();

  // Helpers
  const refresh = _.flow(
    Utils.withBusyState(setBusy),
    withErrorReporting('Error loading group list')
  )(async () => {
    setCreatingNewGroup(false);
    setDeletingGroup(false);
    setUpdating(false);

    const rawGroups = await Ajax(signal).Groups.list();
    const groups = _.flow(
      _.groupBy('groupName'),
      _.map((gs) => ({ ...gs[0], role: _.map('role', gs) })),
      _.sortBy('groupName')
    )(rawGroups);
    setGroups(groups);
  });

  // Lifecycle
  useOnMount(() => {
    refresh();
  });

  useEffect(() => {
    StateHistory.update({ filter, groups });
  }, [filter, groups]);

  // Render
  const filteredGroups = _.filter(({ groupName }) => Utils.textMatch(filter, groupName), groups);

  return h(FooterWrapper, [
    h(TopBar, { title: 'Groups' }, [
      h(DelayedSearchInput, {
        'aria-label': 'Search groups',
        style: { marginLeft: '2rem', width: 500 },
        placeholder: 'SEARCH GROUPS',
        onChange: setFilter,
        value: filter,
      }),
    ]),
    h(PageBox, { role: 'main', style: { flexGrow: 1 }, variant: PageBoxVariants.light }, [
      div({ style: Style.cardList.toolbarContainer }, [
        h2({ style: { ...Style.elements.sectionHeader, margin: 0, textTransform: 'uppercase' } }, ['Group Management']),
      ]),
      div({ style: { marginTop: '1rem' } }, [
        h(NewGroupCard, {
          onClick: () => setCreatingNewGroup(true),
        }),
        Utils.cond(
          [groups && _.isEmpty(groups), () => noGroupsMessage],
          [
            !_.isEmpty(groups) && _.isEmpty(filteredGroups),
            () => {
              return div({ style: { fontStyle: 'italic', marginTop: '1rem' } }, ['No matching groups']);
            },
          ],
          () => {
            return div({ role: 'table', 'aria-label': 'groups list' }, [
              h(GroupCardHeaders, { sort, onSort: setSort }),
              div({ style: { flexGrow: 1, marginTop: '1rem', display: 'grid', rowGap: '0.5rem' } }, [
                _.map((group) => {
                  return h(GroupCard, {
                    group,
                    key: `${group.groupName}`,
                    onDelete: () => setDeletingGroup(group),
                    onLeave: () => setLeavingGroup(group),
                  });
                }, _.orderBy([sort.field], [sort.direction], filteredGroups)),
              ]),
            ]);
          }
        ),
        busy && spinnerOverlay,
      ]),
      creatingNewGroup &&
        h(NewGroupModal, {
          existingGroups: _.map('groupName', groups),
          onDismiss: () => setCreatingNewGroup(false),
          onSuccess: refresh,
        }),
      deletingGroup &&
        h(DeleteConfirmationModal, {
          objectType: 'group',
          objectName: deletingGroup.groupName,
          onConfirm: _.flow(
            Utils.withBusyState(setBusy),
            withErrorReporting('Error deleting group.')
          )(async () => {
            setDeletingGroup(false);
            await Ajax().Groups.group(deletingGroup.groupName).delete();
            refresh();
          }),
          onDismiss: () => setDeletingGroup(false),
        }),
      leavingGroup &&
        h(LeaveResourceModal, {
          samResourceId: leavingGroup.groupName,
          samResourceType: 'managed-group',
          displayName: 'group',
          onDismiss: () => setLeavingGroup(false),
          onSuccess: () => refresh(),
        }),
      updating && spinnerOverlay,
    ]),
  ]);
};

export const navPaths = [
  {
    name: 'groups',
    path: '/groups',
    component: GroupList,
    title: 'Group Management',
  },
];
