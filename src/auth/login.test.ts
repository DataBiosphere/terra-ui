import { DeepPartial } from '@terra-ui-packages/core-utils';
import { asMockedFn } from '@terra-ui-packages/test-utils';
import { act } from '@testing-library/react';
import { loadTerraUser } from 'src/auth/auth';
import { Ajax } from 'src/libs/ajax';
import { GroupRole } from 'src/libs/ajax/Groups';
import { SamUserTermsOfServiceDetails } from 'src/libs/ajax/TermsOfService';
import { SamUserResponse } from 'src/libs/ajax/User';
import { TerraUserState, userStore } from 'src/libs/state';

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
    const getUserAllowancesFunction = jest.fn().mockResolvedValue(testSamUserAllowances);
    const getUserAttributesFunction = jest.fn().mockResolvedValue({ marketingConsent: false });
    const getUserTermsOfServiceDetailsFunction = jest.fn().mockResolvedValue(mockSamUserTermsOfServiceDetails);
    const getEnterpriseFeaturesFunction = jest.fn().mockResolvedValue([]);
    const getSamUserResponseFunction = jest.fn().mockResolvedValue(mockSamUserResponse);
    const getNihStatusFunction = jest.fn().mockResolvedValue(mockOrchestrationNihStatusResponse);
    const getFenceStatusFunction = jest.fn().mockResolvedValue({});

    asMockedFn(Ajax).mockImplementation(
      () =>
        ({
          User: {
            getUserAllowances: getUserAllowancesFunction,
            getUserAttributes: getUserAttributesFunction,
            getUserTermsOfServiceDetails: getUserTermsOfServiceDetailsFunction,
            getEnterpriseFeatures: getEnterpriseFeaturesFunction,
            getSamUserResponse: getSamUserResponseFunction,
            getNihStatus: getNihStatusFunction,
            getFenceStatus: getFenceStatusFunction,
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
      expect(getSamUserResponseFunction).toHaveBeenCalled();
    });
    it('should update the samUser in state', async () => {
      // Act
      await act(() => loadTerraUser());

      let samUser;
      await act(async () => {
        samUser = await getSamUserResponseFunction.mock.results[0].value;
      });
      userStore.update((state: TerraUserState) => ({
        ...state,
        samUser,
      }));
      // Assert
      expect(getSamUserResponseFunction).toHaveBeenCalled();
      expect(userStore.get().samUser).toEqual(mockSamUserResponse);
    });
    describe('when not successful', () => {
      it('should fail with an error', async () => {
        // // Arrange
        // mock a failure to get samUserResponse
        const getSamUserResponseFunction = jest.fn().mockRejectedValue(new Error('unknown'));

        asMockedFn(Ajax).mockImplementation(
          () =>
            ({
              User: {
                getUserAllowances: getUserAllowancesFunction,
                getUserAttributes: getUserAttributesFunction,
                getUserTermsOfServiceDetails: getUserTermsOfServiceDetailsFunction,
                getEnterpriseFeatures: getEnterpriseFeaturesFunction,
                getSamUserResponse: getSamUserResponseFunction,
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
