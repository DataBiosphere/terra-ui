import { DeepPartial } from '@terra-ui-packages/core-utils';
import { asMockedFn } from '@terra-ui-packages/test-utils';
import { act } from '@testing-library/react';
import { loadTerraUser } from 'src/auth/auth';
import { Ajax } from 'src/libs/ajax';
import { GroupRole } from 'src/libs/ajax/Groups';
import { SamUserTermsOfServiceDetails } from 'src/libs/ajax/TermsOfService';
import { SamUserCombinedStateResponse, SamUserResponse } from 'src/libs/ajax/User';
import { userStore } from 'src/libs/state';

jest.mock('src/libs/ajax');

type AjaxExports = typeof import('src/libs/ajax');
type AjaxContract = ReturnType<AjaxExports['Ajax']>;

jest.mock('react-notifications-component', () => {
  return {
    Store: {
      addNotification: jest.fn(),
      removeNotification: jest.fn(),
    },
  };
});

const samUserDate = new Date('1970-01-01');

const mockSamUserResponse: SamUserResponse = {
  id: 'testId',
  googleSubjectId: 'testGoogleSubjectId',
  email: 'testEmail',
  azureB2CId: 'testAzureB2CId',
  allowed: true,
  createdAt: samUserDate,
  registeredAt: samUserDate,
  updatedAt: samUserDate,
};

const mockSamUserTermsOfServiceDetails: SamUserTermsOfServiceDetails = {
  latestAcceptedVersion: '1234',
  acceptedOn: samUserDate,
  permitsSystemUsage: true,
  isCurrentVersion: true,
};

const mockTerraUserProfile = {
  firstName: 'testFirstName',
  lastName: 'testLastName',
  institute: 'testInstitute',
  contactEmail: 'testContactEmail',
  title: 'testTitle',
  department: 'testDepartment',
  interestInTerra: 'testInterestInTerra',
  programLocationCity: 'testProgramLocationCity',
  programLocationState: 'testProgramLocationState',
  programLocationCountry: 'testProgramLocationCountry',
  researchArea: 'testResearchArea',
  starredWorkspaces: 'testStarredWorkspaces',
};

const testSamUserAllowancesDetails = {
  enabled: true,
  termsOfService: true,
};

const testSamUserAllowances = {
  allowed: true,
  details: testSamUserAllowancesDetails,
};

const mockSamUserCombinedState: SamUserCombinedStateResponse = {
  samUser: mockSamUserResponse,
  terraUserAllowances: testSamUserAllowances,
  terraUserAttributes: { marketingConsent: false },
  termsOfService: mockSamUserTermsOfServiceDetails,
  enterpriseFeatures: [],
};

const mockNihDatasetPermission = {
  name: 'testNihDatasetPermissionName',
  authorized: true,
};

const mockOrchestrationNihStatusResponse = {
  linkedNihUsername: 'testLinkedNihUsername',
  datasetPermissions: mockNihDatasetPermission,
  linkExpireTime: 1234,
};

const mockCurrentUserGroupMembership = {
  groupEmail: 'testGroupEmail',
  groupName: 'testGroupName',
  role: 'member' as GroupRole,
};

// TODO centralize Ajax mock setup so it can be reused across tests
describe('a request to load a terra user', () => {
  // reset userStore state before each test
  beforeEach(() => {
    userStore.reset;
  });
  describe('when successful', () => {
    // Arrange (shared between tests for the success case)
    const getSamUserCombinedStateMock = jest.fn().mockResolvedValue(mockSamUserCombinedState);
    const getNihStatusMock = jest.fn().mockResolvedValue(mockOrchestrationNihStatusResponse);
    const getFenceStatusMock = jest.fn().mockResolvedValue({});

    asMockedFn(Ajax).mockImplementation(
      () =>
        ({
          User: {
            getSamUserCombinedState: getSamUserCombinedStateMock,
            getNihStatus: getNihStatusMock,
            getFenceStatus: getFenceStatusMock,
            profile: {
              get: jest.fn().mockReturnValue(mockTerraUserProfile),
            },
          },
          TermsOfService: {
            getUserTermsOfServiceDetails: jest.fn().mockReturnValue({}),
          },
          Groups: {
            list: jest.fn().mockReturnValue([mockCurrentUserGroupMembership]),
          },
        } as DeepPartial<AjaxContract> as AjaxContract)
    );
    it('should include a samUserResponse', async () => {
      // Act
      await act(() => loadTerraUser());

      // Assert
      expect(getSamUserCombinedStateMock).toHaveBeenCalled();
    });
    it('should update the samUser in state', async () => {
      // Act
      await act(() => loadTerraUser());

      // Assert
      expect(getSamUserCombinedStateMock).toHaveBeenCalled();
      expect(userStore.get().samUser).toEqual(mockSamUserResponse);
    });
    describe('when not successful', () => {
      it('should fail with an error', async () => {
        // // Arrange
        // mock a failure to get samUserResponse
        const getSamUserCombinedStateMockFailure = jest.fn().mockRejectedValue(new Error('unknown'));

        asMockedFn(Ajax).mockImplementation(
          () =>
            ({
              User: {
                getSamUserCombinedState: getSamUserCombinedStateMockFailure,
                profile: {
                  get: jest.fn().mockReturnValue(mockTerraUserProfile),
                },
              },
              TermsOfService: {
                getUserTermsOfServiceDetails: jest.fn().mockReturnValue({}),
              },
            } as DeepPartial<AjaxContract> as AjaxContract)
        );
        // Act, Assert
        // this expect.assertions is here to prevent the test from passing if the error is not thrown
        expect.assertions(1);
        try {
          await act(() => loadTerraUser());
        } catch (error) {
          expect(error).toEqual(new Error('unknown'));
        }
      });
    });
  });
});
