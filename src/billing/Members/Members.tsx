import _ from 'lodash/fp';
import React, { ReactNode, useState } from 'react';
import { billingRoles } from 'src/billing/utils';
import { MemberCard, MemberCardHeaders, NewUserCard, Sort, User } from 'src/components/group-common';

interface MembersProps {
  billingProjectName: string;
  isOwner: boolean;
  projectUsers: User[];
  setAddingUser: (arg: boolean) => void;
  setEditingUser: (arg: User) => void;
  setDeletingUser: (arg: User) => void;
}

export const Members = (props: MembersProps): ReactNode => {
  const { billingProjectName, isOwner, projectUsers, setAddingUser, setEditingUser, setDeletingUser } = props;
  const [sort, setSort] = useState<Sort>({ field: 'email', direction: 'asc' });
  const projectHasMultipleOwners =
    _.filter(({ roles }) => _.includes(billingRoles.owner, roles), projectUsers).length > 1;

  return (
    <>
      {isOwner && <NewUserCard onClick={() => setAddingUser(true)} />}
      <div role='table' aria-label={`users in billing project ${billingProjectName}`}>
        <MemberCardHeaders sort={sort} onSort={setSort} />
        <div>
          {_.map(
            (member: User) => (
              <MemberCard
                key={member.email}
                adminLabel={billingRoles.owner}
                userLabel={billingRoles.user}
                member={member}
                adminCanEdit={projectHasMultipleOwners && isOwner}
                onEdit={() => setEditingUser(member)}
                onDelete={() => setDeletingUser(member)}
                isOwner={isOwner}
              />
            ),
            // Lodash does not have a well-typed return on this function and there are not any nice alternatives, so expect error for now
            // @ts-expect-error
            _.orderBy([sort.field], [sort.direction], projectUsers)
          )}
        </div>
      </div>
    </>
  );
};
