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

import {
  generateAPIBodyForCreateUserProfile,
  OrchestrationUpsertTerraUserProfileRequest,
  UpdateTerraUserProfileRequest,
} from 'src/libs/ajax/User';
import { TerraUserProfile } from 'src/libs/state';

jest.mock('src/libs/ajax/ajax-common', () => ({
  authOpts: jest.fn(() => ''),
}));

const registrationProfile: TerraUserProfile = {
  firstName: 'testFirstName',
  lastName: 'testFirstName',
  contactEmail: 'testFirstName',
  department: undefined,
  institute: undefined,
  interestInTerra: undefined,
  programLocationCity: undefined,
  programLocationCountry: undefined,
  programLocationState: undefined,
  starredWorkspaces: undefined,
  title: undefined,
};

const createUserProfileRequest: UpdateTerraUserProfileRequest = {
  firstName: registrationProfile.firstName!,
  lastName: registrationProfile.lastName!,
  contactEmail: registrationProfile.contactEmail!,
  department: '',
  institute: '',
  interestInTerra: '',
  title: '',
};

const NA = 'N/A';

describe('Prepared UserProfileRequest', () => {
  describe('should change `undefined` property', () => {
    it('title to "N/A"', async () => {
      // Arrange, Act
      const apiBody: OrchestrationUpsertTerraUserProfileRequest =
        generateAPIBodyForCreateUserProfile(createUserProfileRequest);

      // Assert
      expect(apiBody.title).toBe(NA);
    });

    it('institute to "N/A"', async () => {
      // Arrange, Act
      const apiBody: OrchestrationUpsertTerraUserProfileRequest =
        generateAPIBodyForCreateUserProfile(createUserProfileRequest);

      // Assert
      expect(apiBody.institute).toBe(NA);
    });

    it('programLocationCity to "N/A"', async () => {
      // Arrange, Act
      const apiBody: OrchestrationUpsertTerraUserProfileRequest =
        generateAPIBodyForCreateUserProfile(createUserProfileRequest);

      // Assert
      expect(apiBody.programLocationCity).toBe(NA);
    });

    it('programLocationState to "N/A"', async () => {
      // Arrange, Act
      const apiBody: OrchestrationUpsertTerraUserProfileRequest =
        generateAPIBodyForCreateUserProfile(createUserProfileRequest);

      // Assert
      expect(apiBody.programLocationState).toBe(NA);
    });

    it('programLocationCountry to "N/A"', async () => {
      // Arrange, Act
      const apiBody: OrchestrationUpsertTerraUserProfileRequest =
        generateAPIBodyForCreateUserProfile(createUserProfileRequest);

      // Assert
      expect(apiBody.programLocationCountry).toBe(NA);
    });
  });

  describe('should not modify property', () => {
    it('firstName', async () => {
      // Arrange, Act
      const apiBody: OrchestrationUpsertTerraUserProfileRequest =
        generateAPIBodyForCreateUserProfile(createUserProfileRequest);

      // Assert
      expect(apiBody.firstName).not.toBe(NA);
    });

    it('lastName', async () => {
      // Arrange, Act
      const apiBody: OrchestrationUpsertTerraUserProfileRequest =
        generateAPIBodyForCreateUserProfile(createUserProfileRequest);

      // Assert
      expect(apiBody.lastName).not.toBe(NA);
    });
  });
});
