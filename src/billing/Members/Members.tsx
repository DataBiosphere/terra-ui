import _ from 'lodash/fp';
import React, { ReactNode, useState } from 'react';
import { billingRoles } from 'src/billing/utils';
import { DeleteMemberModal } from 'src/groups/Members/DeleteMemberModal';
import { EditMemberModal } from 'src/groups/Members/EditMemberModal';
import { Member, MemberTable } from 'src/groups/Members/MemberTable';
import { NewMemberModal } from 'src/groups/Members/NewMemberModal';
import { Ajax } from 'src/libs/ajax';
import { BillingRole } from 'src/libs/ajax/Billing';

interface MembersProps {
  billingProjectName: string;
  isOwner: boolean;
  projectUsers: Member[];
  userAdded: () => void;
  userEdited: () => void;
  deleteUser: (arg: Member) => void;
}

export const Members = (props: MembersProps): ReactNode => {
  const { billingProjectName, isOwner, projectUsers, userEdited, deleteUser, userAdded } = props;
  const [addingUser, setAddingUser] = useState(false);
  const [editingUser, setEditingUser] = useState<Member | false>(false);
  const [deletingUser, setDeletingUser] = useState<Member | false>(false);

  const projectHasMultipleOwners =
    _.filter(({ roles }) => _.includes(billingRoles.owner, roles), projectUsers).length > 1;

  return (
    <>
      <MemberTable
        adminLabel={billingRoles.owner}
        userLabel={billingRoles.user}
        members={projectUsers}
        adminCanEdit={projectHasMultipleOwners && isOwner}
        onEdit={setEditingUser}
        onDelete={setDeletingUser}
        onAddUser={() => setAddingUser(true)}
        tableAriaLabel={`users in billing project ${billingProjectName}`}
        isOwner={isOwner}
      />
      {addingUser && (
        <NewMemberModal
          adminLabel={billingRoles.owner}
          userLabel={billingRoles.user}
          title='Add user to Billing Project'
          footer={[
            'Warning: Adding any user to this project will mean they can incur costs to the billing associated with this project.',
          ]}
          addFunction={(roles: string[], email: string) =>
            Ajax().Billing.addProjectUser(billingProjectName, roles as BillingRole[], email)
          }
          onDismiss={() => setAddingUser(false)}
          onSuccess={() => {
            setAddingUser(false);
            userAdded();
          }}
        />
      )}
      {!!editingUser && (
        <EditMemberModal
          adminLabel={billingRoles.owner}
          userLabel={billingRoles.user}
          user={editingUser}
          saveFunction={(email: string, roles: string[], newRoles: string[]) =>
            Ajax().Billing.changeUserRoles(billingProjectName, email, roles as BillingRole[], newRoles as BillingRole[])
          }
          onDismiss={() => setEditingUser(false)}
          onSuccess={() => {
            setEditingUser(false);
            userEdited();
          }}
        />
      )}
      {!!deletingUser && (
        <DeleteMemberModal
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
