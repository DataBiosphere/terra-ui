import { expect } from '@storybook/test';
import { DeepPartial } from '@terra-ui-packages/core-utils';
import { asMockedFn } from '@terra-ui-packages/test-utils';
import { act } from 'react-dom/test-utils';
import { loadTerraUser } from 'src/auth/auth';
import { Ajax } from 'src/libs/ajax';
import { SamUserTermsOfServiceDetails } from 'src/libs/ajax/TermsOfService';
import { SamUserResponse } from 'src/libs/ajax/User';

jest.mock('src/libs/ajax');
jest.mock('react-notifications-component', () => {
  return {
    Store: {
      addNotification: jest.fn(),
      removeNotification: jest.fn(),
    },
  };
});

jest.mock('src/auth/oidc-broker.ts', () => ({
  ...jest.requireActual('src/auth/oidc-broker.ts'),
  initializeOidcUserManager: () => {
    return {
      userManager: {
        getUser: jest.fn().mockResolvedValue({}),
      },
    };
  },
}));

const samUserDate = new Date('1970-01-01');

const mockSamUserResponse: SamUserResponse = {
  id: 'string',
  googleSubjectId: 'string',
  email: 'string',
  azureB2CId: 'string',
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

describe('a request to load a terra user', () => {
  describe('when successful', () => {
    it('should include a samUserResponse', async () => {
      // Arrange
      const getProfileFunction = jest.fn().mockResolvedValue('testProfile');
      const getUserAllowancesFunction = jest.fn().mockResolvedValue('testAllowances');
      const getUserAttributesFunction = jest.fn().mockResolvedValue({ marketingConsent: false });
      const getUserTermsOfServiceDetailsFunction = jest.fn().mockResolvedValue(mockSamUserTermsOfServiceDetails);
      const getSamUserResponseFunction = jest.fn().mockResolvedValue(mockSamUserResponse);

      type AjaxExports = typeof import('src/libs/ajax');
      type AjaxContract = ReturnType<AjaxExports['Ajax']>;

      // Act
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

      await act(() => loadTerraUser());

      // Assert
      await expect(getSamUserResponseFunction).toHaveBeenCalled();
    });
    it('should update the samUser in state', async () => {
      // Arrange
      // type AjaxContract = ReturnType<typeof Ajax>;
      // type UserPartial = Partial<AjaxContract['User']>;
      //
      // const samUserResponseFn = jest.fn().mockReturnValue(Promise.resolve());
      //
      // asMockedFn(Ajax).mockImplementation(
      //     () =>
      //         ({
      //           User: { getUserAttributes: jest.fn().mockReturnValue(mockSamUserResponse) } as UserPartial,
      //           // User: { getSamUserResponse: jest.fn().mockReturnValue(mockSamUserResponse) } as UserPartial,
      //         } as AjaxContract)
      // );
      //
      // // Act
      // await act(async () => {
      //   await User().getRegisteredAtDate();
      // });
      //
      // // Arrange
      // const getLinkStatusFn = jest.fn().mockResolvedValue(undefined);
      // const getAuthorizationUrlFn = jest.fn().mockResolvedValue('https://foo.bar.com/oauth2/authorize');
      // asMockedFn(Ajax).mockImplementation(
      //     () =>
      //         ({
      //           ExternalCredentials: () => {
      //             return {
      //               getAccountLinkStatus: getLinkStatusFn,
      //               getAuthorizationUrl: getAuthorizationUrlFn,
      //             };
      //           },
      //         } as DeepPartial<AjaxContract> as AjaxContract)
      // );
      // // Act
      // const { container } = await act(() => render(<OAuth2Link queryParams={{}} provider={testAccessTokenProvider} />));
      //
      // // Assert
      // screen.getByText(`Link your ${testAccessTokenProvider.name} account`);
      // expect(getLinkStatusFn).toHaveBeenCalled();
      // expect(getAuthorizationUrlFn).not.toHaveBeenCalled();
      // expect(await axe(container)).toHaveNoViolations();
      // Assert
      // expect(samUserResponseFn).toBe(mockSamUserResponse);
    });
    describe('when not successful', () => {
      it('should fail with an error', async () => {});
    });
  });
});
//
// describe('a request to get the samUser', () => {
//   it('should return a samUserResponse', async () => {
//     // Arrange
//     const getSamUserResponseFunction = jest.fn().mockResolvedValue(mockSamUserResponse);
//     const getAuthTokenFromLocalStorageFunction = jest.fn().mockResolvedValue('mockToken');
//
//     type AjaxExports = typeof import('src/libs/ajax');
//     type AjaxContract = ReturnType<AjaxExports['Ajax']>;
//
//     // Act
//     asMockedFn(Ajax).mockImplementation(
//       () =>
//         ({
//           User: {
//             getSamUserResponse: getSamUserResponseFunction,
//           },
//           getAuthTokenFromLocalStorage: getAuthTokenFromLocalStorageFunction,
//         } as DeepPartial<AjaxContract> as AjaxContract)
//     );
//
//     initializeOidcUserManager();
//     const samUserResponse = await User().getSamUserResponse();
//
//     // Assert
//     await expect(samUserResponse).toBe(mockSamUserResponse);
//   });
// });
