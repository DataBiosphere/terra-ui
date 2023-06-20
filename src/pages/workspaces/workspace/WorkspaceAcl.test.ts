import { workspaceAccessLevels } from 'src/libs/utils';
import {
  aclEntryIsTerraSupport,
  RawWorkspaceAcl,
  transformAcl,
  WorkspaceAcl,
} from 'src/pages/workspaces/workspace/WorkspaceAcl';

describe('utility functions for the workspace acl', () => {
  describe('transforming the raw acl with transformAcl', () => {
    it('moves the email from a map key to an object property', () => {
      const rawAcl: RawWorkspaceAcl = {
        'email1@test.com': {
          canCompute: true,
          canShare: true,
          pending: false,
          accessLevel: 'PROJECT_OWNER',
        },
      };
      const expectedTransformedAcl: WorkspaceAcl = [
        {
          email: 'email1@test.com',
          canCompute: true,
          canShare: true,
          pending: false,
          accessLevel: 'PROJECT_OWNER',
        },
      ];
      expect(transformAcl(rawAcl)).toEqual(expectedTransformedAcl);
    });

    it('sorts the ACL entries by access level', () => {
      const rawAcl: RawWorkspaceAcl = {
        'email1@test.com': {
          canCompute: false,
          canShare: false,
          pending: false,
          accessLevel: 'READER',
        },
        'emai21@test.com': {
          canCompute: true,
          canShare: true,
          pending: false,
          accessLevel: 'PROJECT_OWNER',
        },
        'email3@test.com': {
          canCompute: true,
          canShare: true,
          pending: false,
          accessLevel: 'OWNER',
        },
        'email4@test.com': {
          canCompute: true,
          canShare: true,
          pending: false,
          accessLevel: 'WRITER',
        },
        'email5@test.com': {
          canCompute: false,
          canShare: false,
          pending: false,
          accessLevel: 'NO ACCESS',
        },
      };

      const transformedAcl = transformAcl(rawAcl);
      transformedAcl.forEach((entry, index) => {
        expect(entry.accessLevel).toEqual(workspaceAccessLevels[index]);
      });
    });
  });

  describe('aclEntry terraSupport functions', () => {
    it('aclEntryIsTerraSupport identifies the terra support email when in different cases', () => {
      const aclEntry = {
        accessLevel: 'WRITER',
        canCompute: true,
        canShare: true,
        pending: false,
      };
      expect(aclEntryIsTerraSupport({ ...aclEntry, email: 'Terra-Support@firecloud.org' })).toBe(true);
      expect(aclEntryIsTerraSupport({ ...aclEntry, email: 'terra-support@firecloud.org' })).toBe(true);
      expect(aclEntryIsTerraSupport({ ...aclEntry, email: 'TERRA-SUPPORT@firecloud.org' })).toBe(true);
    });
  });
});
