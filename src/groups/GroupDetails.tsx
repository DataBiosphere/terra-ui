import { SpinnerOverlay } from '@terra-ui-packages/components';
import _ from 'lodash/fp';
import React, { useEffect, useState } from 'react';
import { DeleteUserModal } from 'src/components/DeleteUserModal';
import { EditUserModal } from 'src/components/EditUserModal';
import FooterWrapper from 'src/components/FooterWrapper';
import {
  AdminNotifierCheckbox,
  MemberCard,
  MemberCardHeaders,
  NewUserCard,
  Sort,
  User,
} from 'src/components/group-common';
import { DelayedSearchInput } from 'src/components/input';
import { NewUserModal } from 'src/components/NewUserModal';
import { PageBox, PageBoxVariants } from 'src/components/PageBox';
import TopBar from 'src/components/TopBar';
import { Ajax } from 'src/libs/ajax';
import { GroupRole } from 'src/libs/ajax/Groups';
import { withErrorReporting } from 'src/libs/error';
import { getLink } from 'src/libs/nav';
import { useCancellation } from 'src/libs/react-utils';
import * as StateHistory from 'src/libs/state-history';
import * as Style from 'src/libs/style';
import { textMatch, withBusyState } from 'src/libs/utils';

interface GroupDetailsProps {
  groupName: string;
}

export const GroupDetails = (props: GroupDetailsProps) => {
  const { groupName } = props;
  // State
  const [filter, setFilter] = useState(() => StateHistory.get().filter || '');
  const [members, setMembers] = useState(() => StateHistory.get().members || undefined);
  const [creatingNewUser, setCreatingNewUser] = useState<boolean>(false);
  const [editingUser, setEditingUser] = useState<User>();
  const [deletingUser, setDeletingUser] = useState<User>();
  const [updating, setUpdating] = useState(false);
  const [loading, setLoading] = useState(false);
  const [adminCanEdit, setAdminCanEdit] = useState<boolean>(false);
  const [allowAccessRequests, setAllowAccessRequests] = useState<boolean>(false);
  const [sort, setSort] = useState<Sort>({ field: 'email', direction: 'asc' });

  const signal = useCancellation();

  // Helpers
  const refresh = _.flow(
    withErrorReporting('Error loading group list'),
    withBusyState(setLoading)
  )(async () => {
    setCreatingNewUser(false);
    setEditingUser(undefined);
    setDeletingUser(undefined);
    setUpdating(false);

    const groupAjax = Ajax(signal).Groups.group(groupName);
    const [membersEmails, adminsEmails, allowAccessRequests] = await Promise.all([
      groupAjax.listMembers(),
      groupAjax.listAdmins(),
      groupAjax.getPolicy('admin-notifier'),
    ]);

    const rolesByMember = _.mergeAllWith(
      (a, b) => {
        if (_.isArray(a)) return a.concat(b);
      },
      [
        _.fromPairs(_.map((email) => [email, ['admin']], adminsEmails)),
        _.fromPairs(_.map((email) => [email, ['member']], membersEmails)),
      ]
    );
    const members = _.flow(
      _.toPairs,
      _.map(([email, roles]) => ({ email, roles })),
      _.sortBy((member) => member.email.toUpperCase())
    )(rolesByMember);
    setMembers(members);
    setAdminCanEdit(adminsEmails.length > 1);
    setAllowAccessRequests(allowAccessRequests);
  });

  // Lifecycle
  useEffect(() => {
    refresh();
  });

  useEffect(() => {
    StateHistory.update({ filter, members });
  }, [filter, members]);

  // Render
  return (
    <FooterWrapper>
      <TopBar title='Groups' href={getLink('groups')}>
        <DelayedSearchInput
          aria-label='Search group'
          style={{ marginLeft: '2rem', width: 500 }}
          placeholder='SEARCH GROUP'
          onChange={setFilter}
          value={filter}
        />
      </TopBar>
      <PageBox role='main' style={{ flexGrow: 1 }} variant={PageBoxVariants.light}>
        <div style={Style.cardList.toolbarContainer}>
          <h2 style={{ ...Style.elements.sectionHeader, margin: 0, textTransform: 'uppercase' }}>
            Group Management: {groupName}
          </h2>
        </div>
        <AdminNotifierCheckbox
          checked={allowAccessRequests}
          onChange={_.flow(
            withErrorReporting('Error changing access request permission'),
            withBusyState(setUpdating)
          )(async () => {
            await Ajax().Groups.group(groupName).setPolicy('admin-notifier', !allowAccessRequests);
            return refresh();
          })}
        />
        <div style={{ marginTop: '1rem' }}>
          <NewUserCard onClick={() => setCreatingNewUser(true)} />
          <div role='table' aria-label={`users in group ${groupName}`}>
            <MemberCardHeaders sort={sort} onSort={setSort} />
            <div style={{ flexGrow: 1, marginTop: '1rem' }}>
              {_.map(
                (member: User) => {
                  return (
                    <MemberCard
                      adminLabel='admin'
                      userLabel='member'
                      member={member}
                      adminCanEdit={adminCanEdit}
                      onEdit={() => setEditingUser(member)}
                      onDelete={() => setDeletingUser(member)}
                      isOwner
                    />
                  );
                },
                _.orderBy(
                  [sort.field],
                  [sort.direction],
                  _.filter(({ email }) => textMatch(filter, email), members)
                )
              )}
            </div>
          </div>
          {loading && <SpinnerOverlay />}
        </div>
        {creatingNewUser && (
          <NewUserModal
            adminLabel='admin'
            userLabel='member'
            title='Add user to Terra Group'
            addUnregisteredUser
            addFunction={(roles: string[], email: string) =>
              Ajax()
                .Groups.group(groupName)
                .addUser(roles as GroupRole[], email)
                // convert void[] to void
                .then(() => {})
            }
            onDismiss={() => setCreatingNewUser(false)}
            onSuccess={refresh}
          />
        )}
        {editingUser && (
          <EditUserModal
            adminLabel='admin'
            userLabel='member'
            user={editingUser}
            saveFunction={(email: string, roles: string[], newRoles: string[]) =>
              Ajax()
                .Groups.group(groupName)
                .changeUserRoles(email, roles as GroupRole[], newRoles as GroupRole[])
            }
            onDismiss={() => setEditingUser(undefined)}
            onSuccess={refresh}
          />
        )}
        {deletingUser && (
          <DeleteUserModal
            userEmail={deletingUser.email}
            onDismiss={() => setDeletingUser(undefined)}
            onSubmit={_.flow(
              withErrorReporting('Error removing member from group'),
              withBusyState(setUpdating)
            )(async () => {
              setDeletingUser(undefined);
              await Ajax().Groups.group(groupName).removeUser(getGroupRoles(deletingUser), deletingUser.email);
              refresh();
            })}
          />
        )}
        {updating && <SpinnerOverlay />}
      </PageBox>
    </FooterWrapper>
  );
};

const groupRoleGuard = (value: string): value is GroupRole => {
  return value === 'admin' || value === 'member';
};
const getGroupRoles = (user: User): GroupRole[] => {
  return user.roles.filter(groupRoleGuard);
};

export const navPaths = [
  {
    name: 'group',
    path: '/groups/:groupName',
    component: GroupDetails,
    title: ({ groupName }) => `Group Management - ${groupName}`,
  },
];
