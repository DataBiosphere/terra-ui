import { DeepPartial } from '@terra-ui-packages/core-utils';
import { asMockedFn } from '@terra-ui-packages/test-utils';
import { act } from '@testing-library/react';
import { loadTerraUser } from 'src/auth/user-profile/user';
import { Groups, GroupsContract } from 'src/libs/ajax/Groups';
import { Metrics, MetricsContract } from 'src/libs/ajax/Metrics';
import { SamUserTermsOfServiceDetails, TermsOfService, TermsOfServiceContract } from 'src/libs/ajax/TermsOfService';
import { SamUserCombinedStateResponse, SamUserResponse, User, UserContract } from 'src/libs/ajax/User';
import { oidcStore, userStore } from 'src/libs/state';

jest.mock('src/libs/ajax/TermsOfService');
jest.mock('src/libs/ajax/User');
jest.mock('src/libs/ajax/Groups');
jest.mock('src/libs/ajax/Metrics');

jest.mock('react-notifications-component', () => {
  return {
    Store: {
      addNotification: jest.fn(),
      removeNotification: jest.fn(),
    },
  };
});

jest.spyOn(oidcStore, 'get').mockImplementation(
  jest.fn().mockReturnValue({
    userManager: { getUser: jest.fn() },
  })
);

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

// TODO centralize Ajax mock setup so it can be reused across tests
describe('a request to load a terra user', () => {
  // Arrange (shared between tests for the success case)
  const getSamUserCombinedStateFunction = jest.fn().mockResolvedValue(mockSamUserCombinedState);
  const getNihStatusFunction = jest.fn().mockResolvedValue(mockOrchestrationNihStatusResponse);
  const getFenceStatusFunction = jest.fn().mockResolvedValue({});

  beforeEach(() => {
    userStore.reset();
  });

  // reset userStore state before each test
  beforeAll(() => {
    asMockedFn(Metrics).mockReturnValue({
      captureEvent: jest.fn(),
    } as Partial<MetricsContract> as MetricsContract);
    asMockedFn(User).mockReturnValue({
      getSamUserCombinedState: getSamUserCombinedStateFunction,
      getNihStatus: getNihStatusFunction,
      getFenceStatus: getFenceStatusFunction,
      profile: {
        get: jest.fn().mockReturnValue(mockTerraUserProfile),
      },
    } as DeepPartial<UserContract> as UserContract);

    asMockedFn(Groups).mockReturnValue({
      list: jest.fn(),
    } as Partial<GroupsContract> as GroupsContract);

    asMockedFn(TermsOfService).mockReturnValue({
      getUserTermsOfServiceDetails: jest.fn().mockReturnValue({}),
    } as Partial<TermsOfServiceContract> as TermsOfServiceContract);
  });
  describe('when successful', () => {
    it('should include a samUserResponse', async () => {
      // Act
      await act(() => loadTerraUser());

      // Assert
      expect(getSamUserCombinedStateFunction).toHaveBeenCalled();
    });
    it('should update the samUser in state', async () => {
      // Act
      await act(() => loadTerraUser());

      // Assert
      expect(getSamUserCombinedStateFunction).toHaveBeenCalled();
      expect(userStore.get().samUser).toEqual(mockSamUserResponse);
    });
    describe('when not successful', () => {
      it('should fail with an error', async () => {
        // // Arrange
        // mock a failure to get samUserResponse
        const getSamUserCombinedStateMockFailure = jest.fn().mockRejectedValue(new Error('unknown'));

        asMockedFn(User).mockReturnValue({
          getSamUserCombinedState: getSamUserCombinedStateMockFailure,
          profile: {
            get: jest.fn().mockReturnValue(mockTerraUserProfile),
          },
          getNihStatus: getNihStatusFunction,
        } as DeepPartial<UserContract> as UserContract);

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
