import _ from 'lodash/fp';
import { Fragment, useState } from 'react';
import { div, h } from 'react-hyperscript-helpers';
import { billingRoles } from 'src/billing/utils';
import { MemberCard, MemberCardHeaders, NewUserCard } from 'src/components/group-common';

export const Members = ({ billingProjectName, isOwner, projectUsers, setAddingUser, setEditingUser, setDeletingUser }) => {
  const [sort, setSort] = useState({ field: 'email', direction: 'asc' });
  const projectHasMultipleOwners = _.filter(({ roles }) => _.includes(billingRoles.owner, roles), projectUsers).length > 1;

  return h(Fragment, [
    isOwner &&
      h(NewUserCard, {
        onClick: () => setAddingUser(true),
      }),
    div({ role: 'table', 'aria-label': `users in billing project ${billingProjectName}` }, [
      h(MemberCardHeaders, { sort, onSort: setSort }),
      div(
        _.map((member) => {
          return h(MemberCard, {
            key: member.email,
            adminLabel: billingRoles.owner,
            userLabel: billingRoles.user,
            member,
            adminCanEdit: projectHasMultipleOwners && isOwner,
            onEdit: () => setEditingUser(member),
            onDelete: () => setDeletingUser(member),
            isOwner,
          });
        }, _.orderBy([sort.field], [sort.direction], projectUsers))
      ),
    ]),
  ]);
};
