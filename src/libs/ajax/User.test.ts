import {
  CreateTerraUserProfileRequest,
  generateAPIBodyForCreateUserProfile,
  generateAPIBodyForUpdateUserProfile,
  OrchestrationUpsertTerraUserProfileRequest,
  UpdateTerraUserProfileRequest,
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

const NA = 'N/A';

// CreateTerraUserProfileRequest must have:
//     firstName: completeUserProfile.firstName!,
//     lastName: completeUserProfile.lastName!,
//     contactEmail: completeUserProfile.contactEmail!,
//
//     optionally can have:
//     department: completeUserProfile.department,
//     institute: completeUserProfile.institute,
//     interestInTerra: completeUserProfile.interestInTerra,
//     title: completeUserProfile.title,

// in initial profile registration you CANNOT set these fields:
//  programLocationCity: 'testCity',
//   programLocationCountry: 'testCountry',
//   programLocationState: 'testState',
//   researchArea: 'testResearchArea',
//   starredWorkspaces: 'testStarredWorkspaces',

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
// - complete profile - DONE
// - incomplete profile - DONE

// A update user profile request
// - complete profile
// - incomplete profile - WIP

/*
for a createUserProfileRequest:
  these fields should have actual values from the request
    firstName: string;
    lastName: string;

  this field is not technically required but should be set
  should have actual value from the request
    contactEmail?: string;

  these fields are required but may not be set in the request
  they should be either values from the request or will be set to "N/A"
    title: string;
    institute: string;

  these values are required for the request but are not set during registration
  they will always be set to "N/A" and can be updated by the user after registration is complete
    programLocationCity: string;
    programLocationState: string;
    programLocationCountry: string;

// TODO: ask about this it isn't in the flow of generateAPIBodyForUpdateUserProfile
    termsOfService?: string;

  these fields are not required and may not be set
  they should be either values from the request or undefined
    department?: string;
    interestInTerra?: string;
    researchArea?: string;

 */

// update user profile

describe('An update user profile request', () => {
  describe('when completely filled out by the user', () => {
    describe('should not modify or have undefined property', () => {
      it('title', async () => {
        // Arrange, Act
        const apiBody: OrchestrationUpsertTerraUserProfileRequest = generateAPIBodyForUpdateUserProfile(
          completeUpdateUserProfileRequest
        );

        // Assert
        expect(apiBody.title).toBe(completeUserProfile.title);
      });
      it('institute', async () => {
        // Arrange, Act
        const apiBody: OrchestrationUpsertTerraUserProfileRequest = generateAPIBodyForUpdateUserProfile(
          completeUpdateUserProfileRequest
        );

        // Assert
        expect(apiBody.institute).toBe(completeUserProfile.institute);
      });
      it('programLocationCity', async () => {
        // Arrange, Act
        const apiBody: OrchestrationUpsertTerraUserProfileRequest = generateAPIBodyForUpdateUserProfile(
          completeUpdateUserProfileRequest
        );

        // Assert
        expect(apiBody.programLocationCity).toBe(completeUserProfile.programLocationCity);
      });
      it('programLocationState', async () => {
        // Arrange, Act
        const apiBody: OrchestrationUpsertTerraUserProfileRequest = generateAPIBodyForUpdateUserProfile(
          completeUpdateUserProfileRequest
        );

        // Assert
        expect(apiBody.programLocationState).toBe(completeUserProfile.programLocationState);
      });
      it('programLocationCountry', async () => {
        // Arrange, Act
        const apiBody: OrchestrationUpsertTerraUserProfileRequest = generateAPIBodyForUpdateUserProfile(
          completeUpdateUserProfileRequest
        );

        // Assert
        expect(apiBody.programLocationCountry).toBe(completeUserProfile.programLocationCountry);
      });
      it('interestInTerra', async () => {
        // Arrange, Act
        const apiBody: OrchestrationUpsertTerraUserProfileRequest = generateAPIBodyForUpdateUserProfile(
          completeUpdateUserProfileRequest
        );

        // Assert
        expect(apiBody.interestInTerra).toBe(completeUpdateUserProfileRequest.interestInTerra);
      });
      it('department', async () => {
        // Arrange, Act
        const apiBody: OrchestrationUpsertTerraUserProfileRequest = generateAPIBodyForUpdateUserProfile(
          completeUpdateUserProfileRequest
        );

        // Assert
        expect(apiBody.department).toBe(completeUpdateUserProfileRequest.department);
      });
      it('termsOfService', async () => {
        // Arrange, Act
        const apiBody: OrchestrationUpsertTerraUserProfileRequest = generateAPIBodyForUpdateUserProfile(
          completeUpdateUserProfileRequest
        );

        // Assert
        expect(apiBody.termsOfService).toBe(undefined);
      });
      it('researchArea', async () => {
        // Arrange, Act
        const apiBody: OrchestrationUpsertTerraUserProfileRequest = generateAPIBodyForUpdateUserProfile(
          completeUpdateUserProfileRequest
        );

        // Assert
        expect(apiBody.researchArea).toBe(completeUserProfile.researchArea);
      });
      it('firstName', async () => {
        // Arrange, Act
        const apiBody: OrchestrationUpsertTerraUserProfileRequest = generateAPIBodyForUpdateUserProfile(
          completeUpdateUserProfileRequest
        );

        // Assert
        expect(apiBody.firstName).toBe(completeUserProfile.firstName);
        expect(apiBody.firstName).not.toBe(undefined);
        expect(apiBody.firstName).not.toBe(null);
      });
      it('lastName', async () => {
        // Arrange, Act
        const apiBody: OrchestrationUpsertTerraUserProfileRequest = generateAPIBodyForUpdateUserProfile(
          completeUpdateUserProfileRequest
        );

        // Assert
        expect(apiBody.lastName).toBe(completeUserProfile.lastName);
        expect(apiBody.lastName).not.toBe(undefined);
        expect(apiBody.lastName).not.toBe(null);
      });
      it('contactEmail', async () => {
        // Arrange, Act
        const apiBody: OrchestrationUpsertTerraUserProfileRequest = generateAPIBodyForUpdateUserProfile(
          completeUpdateUserProfileRequest
        );

        // Assert
        expect(apiBody.contactEmail).toBe(completeUserProfile.contactEmail);
        expect(apiBody.contactEmail).not.toBe(undefined);
        expect(apiBody.contactEmail).not.toBe(null);
      });
    });
  });
});
describe('An update user profile request', () => {
  describe('when minimally filled out by the user', () => {
    describe('should not change the property', () => {
      it('title', async () => {
        // Arrange, Act
        const apiBody: OrchestrationUpsertTerraUserProfileRequest = generateAPIBodyForUpdateUserProfile(
          minimalUpdateUserProfileRequest
        );

        // Assert
        expect(apiBody.title).toBe(NA);
      });

      it('institute to "N/A"', async () => {
        // Arrange, Act
        const apiBody: OrchestrationUpsertTerraUserProfileRequest = generateAPIBodyForUpdateUserProfile(
          minimalUpdateUserProfileRequest
        );

        // Assert
        expect(apiBody.institute).toBe(NA);
      });

      it('programLocationCity to "N/A"', async () => {
        // Arrange, Act
        const apiBody: OrchestrationUpsertTerraUserProfileRequest = generateAPIBodyForUpdateUserProfile(
          minimalUpdateUserProfileRequest
        );

        // Assert
        expect(apiBody.programLocationCity).toBe(NA);
      });

      it('programLocationState to "N/A"', async () => {
        // Arrange, Act
        const apiBody: OrchestrationUpsertTerraUserProfileRequest = generateAPIBodyForUpdateUserProfile(
          minimalUpdateUserProfileRequest
        );

        // Assert
        expect(apiBody.programLocationState).toBe(NA);
      });

      it('programLocationCountry to "N/A"', async () => {
        // Arrange, Act
        const apiBody: OrchestrationUpsertTerraUserProfileRequest = generateAPIBodyForUpdateUserProfile(
          minimalUpdateUserProfileRequest
        );

        // Assert
        expect(apiBody.programLocationCountry).toBe(NA);
      });
    });
    describe('should not modify property', () => {
      // these required fields that the user filled out should not be changed
      it('interestInTerra', async () => {
        // Arrange, Act
        const apiBody: OrchestrationUpsertTerraUserProfileRequest = generateAPIBodyForUpdateUserProfile(
          minimalUpdateUserProfileRequest
        );

        // Assert
        expect(apiBody.interestInTerra).toBe(undefined);
      });
      it('department', async () => {
        // Arrange, Act
        const apiBody: OrchestrationUpsertTerraUserProfileRequest = generateAPIBodyForUpdateUserProfile(
          minimalUpdateUserProfileRequest
        );

        // Assert
        expect(apiBody.department).toBe(undefined);
      });
    });
    describe('should have undefined properties', () => {
      // because the user is registering for the first time, TOS acceptance and research area should be 'undefined'
      // these are not required to be initialized as 'N/A'
      it('termsOfService', async () => {
        // Arrange, Act
        const apiBody: OrchestrationUpsertTerraUserProfileRequest = generateAPIBodyForUpdateUserProfile(
          minimalUpdateUserProfileRequest
        );

        // Assert
        expect(apiBody.termsOfService).toBe(undefined);
      });
      it('researchArea', async () => {
        // Arrange, Act
        const apiBody: OrchestrationUpsertTerraUserProfileRequest = generateAPIBodyForUpdateUserProfile(
          minimalUpdateUserProfileRequest
        );

        // Assert
        expect(apiBody.researchArea).toBe(undefined);
      });
    });
    describe('should not modify or have undefined property', () => {
      // these properties should not be modified and should not have a value of 'N/A'
      it('firstName', async () => {
        // Arrange, Act
        const apiBody: OrchestrationUpsertTerraUserProfileRequest = generateAPIBodyForUpdateUserProfile(
          minimalUpdateUserProfileRequest
        );

        // Assert
        expect(apiBody.firstName).toBe(completeUserProfile.firstName);
        expect(apiBody.firstName).not.toBe(undefined);
        expect(apiBody.firstName).not.toBe(null);
      });

      it('lastName', async () => {
        // Arrange, Act
        const apiBody: OrchestrationUpsertTerraUserProfileRequest = generateAPIBodyForUpdateUserProfile(
          minimalUpdateUserProfileRequest
        );

        // Assert
        expect(apiBody.lastName).toBe(completeUserProfile.lastName);
        expect(apiBody.lastName).not.toBe(undefined);
        expect(apiBody.lastName).not.toBe(null);
      });

      it('contactEmail', async () => {
        // Arrange, Act
        const apiBody: OrchestrationUpsertTerraUserProfileRequest = generateAPIBodyForUpdateUserProfile(
          minimalUpdateUserProfileRequest
        );

        // Assert
        expect(apiBody.contactEmail).toBe(completeUserProfile.contactEmail);
        expect(apiBody.contactEmail).not.toBe(undefined);
        expect(apiBody.contactEmail).not.toBe(null);
      });
    });
  });
});

// create user profile
describe('A create user profile request', () => {
  describe('when completely filled out by the user', () => {
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
        expect(apiBody.interestInTerra).toBe(completeCreateUserProfileRequest.interestInTerra);
      });
      it('department', async () => {
        // Arrange, Act
        const apiBody: OrchestrationUpsertTerraUserProfileRequest = generateAPIBodyForCreateUserProfile(
          completeCreateUserProfileRequest
        );

        // Assert
        expect(apiBody.department).toBe(completeCreateUserProfileRequest.department);
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
