import {
  CreateTerraUserProfileRequest,
  generateAPIBodyForCreateUserProfile,
  OrchestrationUpsertTerraUserProfileRequest,
  // UpdateTerraUserProfileRequest,
} from 'src/libs/ajax/User';
import { TerraUserProfile } from 'src/libs/state';

jest.mock('src/libs/ajax/ajax-common', () => ({
  authOpts: jest.fn(() => ''),
}));

const completeUserProfile: TerraUserProfile = {
  firstName: 'testFirstName',
  lastName: 'testFirstName',
  contactEmail: 'testFirstName',
  department: 'testDepartment',
  institute: 'testInstitute',
  interestInTerra: 'testInterestInTerra',
  programLocationCity: 'testCity',
  programLocationCountry: 'testCountry',
  programLocationState: 'testState',
  starredWorkspaces: 'testStarredWorkspaces',
  title: 'testTitle',
  researchArea: 'testResearchArea',
};

const minimalCreateUserProfileRequest: CreateTerraUserProfileRequest = {
  firstName: completeUserProfile.firstName!,
  lastName: completeUserProfile.lastName!,
  contactEmail: completeUserProfile.contactEmail!,
};

const completeCreateUserProfileRequest: CreateTerraUserProfileRequest = {
  firstName: completeUserProfile.firstName!,
  lastName: completeUserProfile.lastName!,
  contactEmail: completeUserProfile.contactEmail!,
  department: completeUserProfile.department,
  institute: completeUserProfile.institute,
  interestInTerra: completeUserProfile.interestInTerra,
  title: completeUserProfile.title,
};

// CreateTerraUserProfileRequest must have:
// firstName: completeUserProfile.firstName!,
//     lastName: completeUserProfile.lastName!,
//     contactEmail: completeUserProfile.contactEmail!,
//
//     optionally can have:
//     const   department: completeUserProfile.department,
//     institute: completeUserProfile.institute,
//     interestInTerra: completeUserProfile.interestInTerra,
//     title: completeUserProfile.title,

// TODO: figure out whether the above ^ completeCreateUserProfileRequest should include city state etc or not
//  for testing the complete profile create request case
// in initial profile registration you CANNOT set these fields:
//  programLocationCity: 'testCity',
//   programLocationCountry: 'testCountry',
//   programLocationState: 'testState',
//   researchArea: 'testResearchArea',
//   starredWorkspaces: 'testStarredWorkspaces',

/*
const minimalUpdateUserProfileRequest: UpdateTerraUserProfileRequest = {
  firstName: completeUserProfile.firstName!,
  lastName: completeUserProfile.lastName!,
  contactEmail: completeUserProfile.contactEmail!,
};

const completeUpdateUserProfileRequest: UpdateTerraUserProfileRequest = {
  firstName: completeUserProfile.firstName!,
  lastName: completeUserProfile.lastName!,
  contactEmail: completeUserProfile.contactEmail!,
  department: completeUserProfile.department,
  institute: completeUserProfile.institute,
  interestInTerra: completeUserProfile.interestInTerra,
  title: completeUserProfile.title,
  programLocationCity: completeUserProfile.programLocationCity,
  programLocationState: completeUserProfile.programLocationState,
  programLocationCountry: completeUserProfile.programLocationCountry,
  termsOfService: '',
  researchArea: completeUserProfile.researchArea,
};
 */

const NA = 'N/A';

// test make setUserProfile request
// when given any TerraUserProfile it should create a request with all fields to be nonempty strings
/*
  firstName: string;
  lastName: string;
  title: string;
  contactEmail?: string;
  institute: string;
  programLocationCity: string;
  programLocationState: string;
  programLocationCountry: string;
  termsOfService?: string;
  researchArea?: string;
  department?: string;
  interestInTerra?: string;
 */

// A create user profile request
// - complete profile - WIP
// - incomplete profile - DONE

// A update user profile request
// - complete profile
// - incomplete profile

// TODO: make sure to give this a complete profile from one the consts above
//   maybe don't have to check each line individually?
//  check if this should actually be passing or not

describe('A create user profile request', () => {
  describe('when given a fully filled out terra user profile', () => {
    describe('should not modify or have undefined property', () => {
      it('title', async () => {
        // Arrange, Act
        const apiBody: OrchestrationUpsertTerraUserProfileRequest = generateAPIBodyForCreateUserProfile(
          completeCreateUserProfileRequest
        );

        // Assert
        expect(apiBody.title).toBe(completeUserProfile.title);
      });
      it('institute', async () => {
        // Arrange, Act
        const apiBody: OrchestrationUpsertTerraUserProfileRequest = generateAPIBodyForCreateUserProfile(
          completeCreateUserProfileRequest
        );

        // Assert
        expect(apiBody.institute).toBe(completeUserProfile.institute);
      });
      it('programLocationCity', async () => {
        // Arrange, Act
        const apiBody: OrchestrationUpsertTerraUserProfileRequest = generateAPIBodyForCreateUserProfile(
          completeCreateUserProfileRequest
        );

        // Assert
        expect(apiBody.programLocationCity).toBe(NA);
      });
      it('programLocationState', async () => {
        // Arrange, Act
        const apiBody: OrchestrationUpsertTerraUserProfileRequest = generateAPIBodyForCreateUserProfile(
          completeCreateUserProfileRequest
        );

        // Assert
        expect(apiBody.programLocationState).toBe(NA);
      });
      it('programLocationCountry', async () => {
        // Arrange, Act
        const apiBody: OrchestrationUpsertTerraUserProfileRequest = generateAPIBodyForCreateUserProfile(
          completeCreateUserProfileRequest
        );

        // Assert
        expect(apiBody.programLocationCountry).toBe(NA);
      });
      it('interestInTerra', async () => {
        // Arrange, Act
        const apiBody: OrchestrationUpsertTerraUserProfileRequest = generateAPIBodyForCreateUserProfile(
          completeCreateUserProfileRequest
        );

        // Assert
        expect(apiBody.interestInTerra).toBe(minimalCreateUserProfileRequest.interestInTerra);
      });
      it('department', async () => {
        // Arrange, Act
        const apiBody: OrchestrationUpsertTerraUserProfileRequest = generateAPIBodyForCreateUserProfile(
          completeCreateUserProfileRequest
        );

        // Assert
        expect(apiBody.department).toBe(minimalCreateUserProfileRequest.department);
      });
      it('termsOfService', async () => {
        // Arrange, Act
        const apiBody: OrchestrationUpsertTerraUserProfileRequest = generateAPIBodyForCreateUserProfile(
          completeCreateUserProfileRequest
        );

        // Assert
        expect(apiBody.termsOfService).toBe(undefined);
      });
      it('researchArea', async () => {
        // Arrange, Act
        const apiBody: OrchestrationUpsertTerraUserProfileRequest = generateAPIBodyForCreateUserProfile(
          completeCreateUserProfileRequest
        );

        // Assert
        expect(apiBody.researchArea).toBe(undefined);
      });
      it('firstName', async () => {
        // Arrange, Act
        const apiBody: OrchestrationUpsertTerraUserProfileRequest = generateAPIBodyForCreateUserProfile(
          completeCreateUserProfileRequest
        );

        // Assert
        expect(apiBody.firstName).toBe(completeUserProfile.firstName);
        expect(apiBody.firstName).not.toBe(undefined);
        expect(apiBody.firstName).not.toBe(null);
      });
      it('lastName', async () => {
        // Arrange, Act
        const apiBody: OrchestrationUpsertTerraUserProfileRequest = generateAPIBodyForCreateUserProfile(
          completeCreateUserProfileRequest
        );

        // Assert
        expect(apiBody.lastName).toBe(completeUserProfile.lastName);
        expect(apiBody.lastName).not.toBe(undefined);
        expect(apiBody.lastName).not.toBe(null);
      });
      it('contactEmail', async () => {
        // Arrange, Act
        const apiBody: OrchestrationUpsertTerraUserProfileRequest = generateAPIBodyForCreateUserProfile(
          completeCreateUserProfileRequest
        );

        // Assert
        expect(apiBody.contactEmail).toBe(completeUserProfile.contactEmail);
        expect(apiBody.contactEmail).not.toBe(undefined);
        expect(apiBody.contactEmail).not.toBe(null);
      });
    });
  });
});

// TODO: below are already existing tests

describe('A create user profile request', () => {
  describe('when minimally filled out by the user', () => {
    describe('should change `undefined` property', () => {
      // when a user has filled out the required fields of a profile
      // and has not entered values for the optional fields
      // those optional fields should be changed to 'N/A' in the request
      it('title to "N/A"', async () => {
        // Arrange, Act
        const apiBody: OrchestrationUpsertTerraUserProfileRequest = generateAPIBodyForCreateUserProfile(
          minimalCreateUserProfileRequest
        );

        // Assert
        expect(apiBody.title).toBe(NA);
      });

      it('institute to "N/A"', async () => {
        // Arrange, Act
        const apiBody: OrchestrationUpsertTerraUserProfileRequest = generateAPIBodyForCreateUserProfile(
          minimalCreateUserProfileRequest
        );

        // Assert
        expect(apiBody.institute).toBe(NA);
      });

      it('programLocationCity to "N/A"', async () => {
        // Arrange, Act
        const apiBody: OrchestrationUpsertTerraUserProfileRequest = generateAPIBodyForCreateUserProfile(
          minimalCreateUserProfileRequest
        );

        // Assert
        expect(apiBody.programLocationCity).toBe(NA);
      });

      it('programLocationState to "N/A"', async () => {
        // Arrange, Act
        const apiBody: OrchestrationUpsertTerraUserProfileRequest = generateAPIBodyForCreateUserProfile(
          minimalCreateUserProfileRequest
        );

        // Assert
        expect(apiBody.programLocationState).toBe(NA);
      });

      it('programLocationCountry to "N/A"', async () => {
        // Arrange, Act
        const apiBody: OrchestrationUpsertTerraUserProfileRequest = generateAPIBodyForCreateUserProfile(
          minimalCreateUserProfileRequest
        );

        // Assert
        expect(apiBody.programLocationCountry).toBe(NA);
      });
    });
    describe('should not modify property', () => {
      // these required fields that the user filled out should not be changed
      it('interestInTerra', async () => {
        // Arrange, Act
        const apiBody: OrchestrationUpsertTerraUserProfileRequest = generateAPIBodyForCreateUserProfile(
          minimalCreateUserProfileRequest
        );

        // Assert
        expect(apiBody.interestInTerra).toBe(minimalCreateUserProfileRequest.interestInTerra);
      });
      it('department', async () => {
        // Arrange, Act
        const apiBody: OrchestrationUpsertTerraUserProfileRequest = generateAPIBodyForCreateUserProfile(
          minimalCreateUserProfileRequest
        );

        // Assert
        expect(apiBody.department).toBe(minimalCreateUserProfileRequest.department);
      });
    });
    describe('should have undefined properties', () => {
      // because the user is registering for the first time, TOS acceptance and research area should be 'undefined'
      // these are not required to be initialized as 'N/A'
      it('termsOfService', async () => {
        // Arrange, Act
        const apiBody: OrchestrationUpsertTerraUserProfileRequest = generateAPIBodyForCreateUserProfile(
          minimalCreateUserProfileRequest
        );

        // Assert
        expect(apiBody.termsOfService).toBe(undefined);
      });
      it('researchArea', async () => {
        // Arrange, Act
        const apiBody: OrchestrationUpsertTerraUserProfileRequest = generateAPIBodyForCreateUserProfile(
          minimalCreateUserProfileRequest
        );

        // Assert
        expect(apiBody.researchArea).toBe(undefined);
      });
    });
    describe('should not modify or have undefined property', () => {
      // these properties should not be modified and should not have a value of 'N/A'
      it('firstName', async () => {
        // Arrange, Act
        const apiBody: OrchestrationUpsertTerraUserProfileRequest = generateAPIBodyForCreateUserProfile(
          minimalCreateUserProfileRequest
        );

        // Assert
        expect(apiBody.firstName).toBe(completeUserProfile.firstName);
        expect(apiBody.firstName).not.toBe(undefined);
        expect(apiBody.firstName).not.toBe(null);
      });

      it('lastName', async () => {
        // Arrange, Act
        const apiBody: OrchestrationUpsertTerraUserProfileRequest = generateAPIBodyForCreateUserProfile(
          minimalCreateUserProfileRequest
        );

        // Assert
        expect(apiBody.lastName).toBe(completeUserProfile.lastName);
        expect(apiBody.lastName).not.toBe(undefined);
        expect(apiBody.lastName).not.toBe(null);
      });

      it('contactEmail', async () => {
        // Arrange, Act
        const apiBody: OrchestrationUpsertTerraUserProfileRequest = generateAPIBodyForCreateUserProfile(
          minimalCreateUserProfileRequest
        );

        // Assert
        expect(apiBody.contactEmail).toBe(completeUserProfile.contactEmail);
        expect(apiBody.contactEmail).not.toBe(undefined);
        expect(apiBody.contactEmail).not.toBe(null);
      });
    });
  });
});
