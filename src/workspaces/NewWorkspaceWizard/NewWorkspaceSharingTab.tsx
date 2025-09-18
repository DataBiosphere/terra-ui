import _ from 'lodash/fp';
import React, { ReactNode, useState } from 'react';
import { validateUserEmails } from 'src/billing/utils';
import { ButtonPrimary } from 'src/components/common';
import { EmailSelect } from 'src/groups/Members/EmailSelect';
import { FormLabel } from 'src/libs/forms';
import { append, summarizeErrors } from 'src/libs/utils';
import validate from 'validate.js';

import { AccessEntry } from '../acl-utils';
import { AclInput } from '../ShareWorkspaceModal/Collaborator';
import { CurrentCollaborators } from '../ShareWorkspaceModal/CurrentCollaborators';

const defaultAcl: AccessEntry = {
  email: '',
  accessLevel: 'READER',
  pending: false,
  canShare: false,
  canCompute: false,
};

export const NewWorkspaceSharingTab = ({ acl, setAcl }): ReactNode => {
  const [emailInputValues, setEmailInputValues] = useState<string[]>([]);
  const [newAcl, setNewAcl] = useState<AccessEntry>(defaultAcl);
  const [lastAddedEmail, setLastAddedEmail] = useState<string | undefined>(undefined);

  // // Render
  const sharingErrors = validateUserEmails(emailInputValues);
  const aclEmails = _.map('email', acl);

  const addCollaborators = (collaboratorEmails: string[], collaboratorAcl: AccessEntry) => {
    collaboratorEmails.forEach((collaboratorEmail: string) => {
      if (!validate.single(collaboratorEmail, { email: true, exclusion: aclEmails })) {
        setAcl(append({ ...collaboratorAcl, email: collaboratorEmail } as AccessEntry));
        setLastAddedEmail(collaboratorEmail);
      }
    });
    // Clear the email values and new acl after adding collaborators
    setEmailInputValues([]);
    setNewAcl(defaultAcl);
  };

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.5rem', marginTop: '1rem' }}>
        <div style={{ flexGrow: 100, alignSelf: 'flex-start' }}>
          <EmailSelect placeholder='Add people or groups' setEmails={setEmailInputValues} emails={emailInputValues} />
        </div>

        <div style={{ flexGrow: 1, alignSelf: 'flex-start' }}>
          <FormLabel id='aclInputId' style={{ marginTop: '0.25rem' }}>
            Permissions
          </FormLabel>
          <AclInput
            aria-label='permissions for new collaborator'
            value={newAcl}
            onChange={setNewAcl}
            disabled={false}
            maxAccessLevel='OWNER' // presumably since we're creating the workspace
            isAzureWorkspace={false}
            showRow={false}
          />
        </div>
        <div style={{ flexGrow: 1, alignSelf: 'flex-start', marginTop: '1.65rem' }}>
          <ButtonPrimary
            disabled={!!sharingErrors}
            tooltip={summarizeErrors(sharingErrors)}
            onClick={() => addCollaborators(emailInputValues, newAcl)}
          >
            Add
          </ButtonPrimary>
        </div>
      </div>
      <CurrentCollaborators
        acl={acl}
        setAcl={setAcl}
        originalAcl={acl}
        lastAddedEmail={lastAddedEmail}
        workspaceAccessLevel='OWNER'
        isAzureWorkspace={false}
        listStyles={{
          margin: '0.5rem -1.25rem 0',
          maxHeight: 'calc(400px - 1rem)',
          overflowY: 'auto',
          padding: '1rem 1.25rem',
        }}
      />
    </>
  );
};
