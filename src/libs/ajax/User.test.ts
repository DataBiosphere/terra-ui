// test make setuserProfile request
// when given any TerraUserProfile it should create a request with all fields to be nonempty strings

// complete profile
// incomplete profile
//

// import { withRetryOnError, authOpts, makeRequestRetry, withRetryAfterReloadingExpiredAuthToken } from './ajax-common';
// import {makeSetUserProfileRequest, SetTerraUserProfileRequest} from "src/libs/ajax/User";

/* type UserExports = typeof import('src/libs/ajax/User');
jest.mock('src/libs/ajax/User', (): Partial<UserExports> => {
  return {
    //...jest.requireActual('src/libs/ajax/User'),
    //makeSetUserProfileRequest: jest.fn(),
  };
}); */

import { makeSetUserProfileRequest, SetTerraUserProfileRequest } from 'src/libs/ajax/User';
import { TerraUserProfile } from 'src/libs/state';

jest.mock('src/libs/ajax/ajax-common', () => ({
  authOpts: jest.fn(() => ''),
}));

const emptyProfile: TerraUserProfile = {
  firstName: undefined,
  lastName: undefined,
  contactEmail: undefined,
  department: undefined,
  institute: undefined,
  interestInTerra: undefined,
  programLocationCity: undefined,
  programLocationCountry: undefined,
  programLocationState: undefined,
  starredWorkspaces: undefined,
  title: undefined,
};

const NA = 'N/A';

describe('Prepared UserProfileRequest', () => {
  describe('should change `undefined` property', () => {
    it('title to "N/A"', async () => {
      // Arrange, Act
      const userProfileRequest: SetTerraUserProfileRequest = makeSetUserProfileRequest(emptyProfile);

      // Assert
      expect(userProfileRequest.title).toBe(NA);
    });

    it('institute to "N/A"', async () => {
      // Arrange, Act
      const userProfileRequest: SetTerraUserProfileRequest = makeSetUserProfileRequest(emptyProfile);

      // Assert
      expect(userProfileRequest.institute).toBe(NA);
    });

    it('programLocationCity to "N/A"', async () => {
      // Arrange, Act
      const userProfileRequest: SetTerraUserProfileRequest = makeSetUserProfileRequest(emptyProfile);

      // Assert
      expect(userProfileRequest.programLocationCity).toBe(NA);
    });

    it('programLocationState to "N/A"', async () => {
      // Arrange, Act
      const userProfileRequest: SetTerraUserProfileRequest = makeSetUserProfileRequest(emptyProfile);

      // Assert
      expect(userProfileRequest.programLocationState).toBe(NA);
    });

    it('programLocationCountry to "N/A"', async () => {
      // Arrange, Act
      const userProfileRequest: SetTerraUserProfileRequest = makeSetUserProfileRequest(emptyProfile);

      // Assert
      expect(userProfileRequest.programLocationCountry).toBe(NA);
    });
  });

  describe('should not modify property', () => {
    it('firstName', async () => {
      // Arrange, Act
      const userProfileRequest: SetTerraUserProfileRequest = makeSetUserProfileRequest(emptyProfile);

      // Assert
      expect(userProfileRequest.firstName).not.toBe(NA);
    });

    it('lastName', async () => {
      // Arrange, Act
      const userProfileRequest: SetTerraUserProfileRequest = makeSetUserProfileRequest(emptyProfile);

      // Assert
      expect(userProfileRequest.lastName).not.toBe(NA);
    });
  });
});

// describe('converting a terra user profile into a request to upsert a user profile', () => {
//   it('with a complete profile', () => {
//     // arrange
//     const terraCompleteProfile: TerraUserProfile = {
//       firstName: 'testFirstName',
//       lastName: 'testLastName',
//       institute: 'testInstitute',
//       contactEmail: 'testContactEmail',
//       title: 'testTitle',
//       department: 'TestDepartment',
//       interestInTerra: 'testInterestInTerra',
//       programLocationCity: 'testCity',
//       programLocationState: 'testState',
//       programLocationCountry: 'testCountry',
//       starredWorkspaces: 'testWorkspace',
//     };
//
//     // act
//     const setUserProfileRequest: SetTerraUserProfileRequest = makeSetUserProfileRequest(terraCompleteProfile);
//
//     // assert
//     const expectedRequest: SetTerraUserProfileRequest = {
//       firstName: 'testFirstName',
//       lastName: 'testLastName',
//       institute: 'testInstitute',
//       contactEmail: 'testContactEmail',
//       title: 'testTitle',
//       department: 'TestDepartment',
//       interestInTerra: 'testInterestInTerra',
//       programLocationCity: 'testCity',
//       programLocationState: 'testState',
//       programLocationCountry: 'testCountry',
//       // termsOfService: "testTos",
//       // researchArea: "string",
//     };
//
//     expect(setUserProfileRequest).toBe(expectedRequest);
//   });
// });
