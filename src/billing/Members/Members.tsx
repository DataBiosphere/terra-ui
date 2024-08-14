import _ from 'lodash/fp';
import React, { ReactNode, useState } from 'react';
import { billingRoles } from 'src/billing/utils';
import {
  DeleteUserModal,
  EditUserModal,
  MemberCard,
  MemberCardHeaders,
  NewUserCard,
  NewUserModal,
  Sort,
  User,
} from 'src/components/group-common';
import { Ajax } from 'src/libs/ajax';
import { BillingRole } from 'src/libs/ajax/Billing';

interface MembersProps {
  billingProjectName: string;
  isOwner: boolean;
  projectUsers: User[];
  userAdded: () => void;
  userEdited: () => void;
  deleteUser: (arg: User) => void;
}

export const Members = (props: MembersProps): ReactNode => {
  const { billingProjectName, isOwner, projectUsers, userEdited, deleteUser, userAdded } = props;
  const [sort, setSort] = useState<Sort>({ field: 'email', direction: 'asc' });
  const [addingUser, setAddingUser] = useState(false);
  const [editingUser, setEditingUser] = useState<User | false>(false);
  const [deletingUser, setDeletingUser] = useState<User | false>(false);

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
      {addingUser && (
        <NewUserModal
          adminLabel={billingRoles.owner}
          userLabel={billingRoles.user}
          title='Add user to Billing Project'
          footer={[
            'Warning: Adding any user to this project will mean they can incur costs to the billing associated with this project.',
          ]}
          addFunction={(roles: BillingRole[], email: string) =>
            Ajax().Billing.addProjectUser(billingProjectName, roles, email)
          }
          onDismiss={() => setAddingUser(false)}
          onSuccess={() => {
            setAddingUser(false);
            userAdded();
          }}
        />
      )}
      {!!editingUser && (
        <EditUserModal
          adminLabel={billingRoles.owner}
          userLabel={billingRoles.user}
          user={editingUser}
          saveFunction={(email: string, roles: BillingRole[], newRoles: BillingRole[]) =>
            Ajax().Billing.changeUserRoles(billingProjectName, email, roles, newRoles)
          }
          onDismiss={() => setEditingUser(false)}
          onSuccess={() => {
            setEditingUser(false);
            userEdited();
          }}
        />
      )}
      {!!deletingUser && (
        <DeleteUserModal
          userEmail={deletingUser.email}
          onDismiss={() => setDeletingUser(false)}
          onSubmit={() => {
            deleteUser(deletingUser);
            setDeletingUser(false);
          }}
        />
      )}
    </>
  );
};
