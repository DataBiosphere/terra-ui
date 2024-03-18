import { expect } from '@storybook/test';
import { DeepPartial } from '@terra-ui-packages/core-utils';
import { asMockedFn } from '@terra-ui-packages/test-utils';
import { act } from 'react-dom/test-utils';
import { loadTerraUser } from 'src/auth/auth';
import { Ajax } from 'src/libs/ajax';
import { SamUserTermsOfServiceDetails } from 'src/libs/ajax/TermsOfService';
import { SamUserResponse } from 'src/libs/ajax/User';
import { TerraUserState, userStore } from 'src/libs/state';

jest.mock('src/libs/ajax');
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

type AjaxExports = typeof import('src/libs/ajax');
type AjaxContract = ReturnType<AjaxExports['Ajax']>;

describe('a request to load a terra user', () => {
  // reset userStore before each test
  beforeEach(() => {
    userStore.reset;
  });
  describe('when successful', () => {
    // Arrange (shared between tests for the success case)
    const getProfileFunction = jest.fn().mockResolvedValue('testProfile');
    const getUserAllowancesFunction = jest.fn().mockResolvedValue('testAllowances');
    const getUserAttributesFunction = jest.fn().mockResolvedValue({ marketingConsent: false });
    const getUserTermsOfServiceDetailsFunction = jest.fn().mockResolvedValue(mockSamUserTermsOfServiceDetails);
    const getSamUserResponseFunction = jest.fn().mockResolvedValue(mockSamUserResponse);

    asMockedFn(Ajax).mockImplementation(
      () =>
        ({
          User: {
            getProfile: getProfileFunction,
            getUserAllowances: getUserAllowancesFunction,
            getUserAttributes: getUserAttributesFunction,
            getUserTermsOfServiceDetails: getUserTermsOfServiceDetailsFunction,
            getSamUserResponse: getSamUserResponseFunction,
            profile: {
              get: jest.fn().mockReturnValue({}),
            },
          },
          TermsOfService: {
            getUserTermsOfServiceDetails: jest.fn().mockReturnValue({}),
          },
        } as DeepPartial<AjaxContract> as AjaxContract)
    );
    it('should include a samUserResponse', async () => {
      // Act
      await act(() => loadTerraUser());

      // Assert
      await expect(getSamUserResponseFunction).toHaveBeenCalled();
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
      await expect(getSamUserResponseFunction).toHaveBeenCalled();
      await expect(userStore.get().samUser).toEqual(mockSamUserResponse);
    });
    describe('when not successful', () => {
      it('should fail with an error', async () => {
        // Arrange
        const getProfileFunction = jest.fn().mockResolvedValue('testProfile');
        const getUserAllowancesFunction = jest.fn().mockResolvedValue('testAllowances');
        const getUserAttributesFunction = jest.fn().mockResolvedValue({ marketingConsent: false });
        const getUserTermsOfServiceDetailsFunction = jest.fn().mockResolvedValue(mockSamUserTermsOfServiceDetails);
        // mock a failure to get samUserResponse
        const getSamUserResponseFunction = jest.fn().mockRejectedValue(new Error('unknown'));

        asMockedFn(Ajax).mockImplementation(
          () =>
            ({
              User: {
                getProfile: getProfileFunction,
                getUserAllowances: getUserAllowancesFunction,
                getUserAttributes: getUserAttributesFunction,
                getUserTermsOfServiceDetails: getUserTermsOfServiceDetailsFunction,
                getSamUserResponse: getSamUserResponseFunction,
                profile: {
                  get: jest.fn().mockReturnValue({}),
                },
              },
              TermsOfService: {
                getUserTermsOfServiceDetails: jest.fn().mockReturnValue({}),
              },
            } as DeepPartial<AjaxContract> as AjaxContract)
        );
        // Act, Assert
        await expect.assertions(1);
        try {
          await act(() => loadTerraUser());
        } catch (error) {
          await expect(error).toEqual(new Error('unknown'));
        }
      });
    });
  });
});
