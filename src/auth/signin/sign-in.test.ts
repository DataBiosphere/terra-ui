import { DeepPartial } from '@terra-ui-packages/core-utils';
import { asMockedFn } from '@terra-ui-packages/test-utils';
import { act } from '@testing-library/react';
import { AuthTokenState, loadAuthToken, loadTerraUser } from 'src/auth/auth';
import { OidcUser } from 'src/auth/oidc-broker';
import { signIn } from 'src/auth/signin/sign-in';
import { Ajax } from 'src/libs/ajax';
import { GroupRole } from 'src/libs/ajax/Groups';
import { SamUserTermsOfServiceDetails } from 'src/libs/ajax/TermsOfService';
import { SamUserResponse } from 'src/libs/ajax/User';
import { TerraUserState, userStore } from 'src/libs/state';

jest.mock('src/auth/auth.ts', () => {
  return {
    loadAuthToken: jest.fn(),
  };
});

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

type NotificationExports = typeof import('src/libs/notifications');
jest.mock(
  'src/libs/notifications',
  (): NotificationExports => ({
    ...jest.requireActual('src/libs/state'),
    notify: jest.fn(),
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

describe('when a user signs in', () => {
  it('loads the auth token', async () => {
    // Arrange
    const captureEventFn = jest.fn();
    asMockedFn(Ajax).mockReturnValue({
      Metrics: {
        captureEvent: captureEventFn,
      },
    } as DeepPartial<AjaxContract> as AjaxContract);

    asMockedFn(loadAuthToken).mockResolvedValue({
      status: 'success',
      oidcUser: { id_token: 'foo' } as OidcUser,
    } as unknown as AuthTokenState);

    const user = await signIn();

    // Assert
    expect(loadAuthToken).toHaveBeenCalled();
    expect(captureEventFn).toHaveBeenCalledWith('user:login:success', expect.any(Object));
    expect(user.id_token).toEqual('foo');
  });
});

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
