import {
  CreateTerraUserProfileRequest,
  generateAPIBodyForCreateUserProfile,
  generateAPIBodyForUpdateUserProfile,
  OrchestrationUpsertTerraUserProfileRequest,
  UpdateTerraUserProfileRequest,
} from 'src/libs/ajax/User';
import { TerraUserProfile } from 'src/libs/state';

type AuthFetchExports = typeof import('src/auth/auth-fetch');
jest.mock(
  'src/auth/auth-fetch',
  (): Partial<AuthFetchExports> => ({
    authOpts: jest.fn().mockReturnValue({ headers: { Authorization: 'testToken' } }),
    withRetryAfterReloadingExpiredAuthToken: jest.fn().mockImplementation((fn) => fn),
  })
);

type SignOutExports = typeof import('src/auth/signout/sign-out');
jest.mock(
  'src/auth/signout/sign-out',
  (): SignOutExports => ({
    signOut: jest.fn(),
    userSignedOut: jest.fn(),
  })
);

const completeUserProfile: TerraUserProfile = {
  firstName: 'testFirstName',
  lastName: 'testLastName',
  contactEmail: 'user@example.com',
  department: 'testDepartment',
  institute: 'testInstitute',
  interestInTerra: 'testInterestInTerra',
  programLocationCity: 'testCity',
  programLocationCountry: 'testCountry',
  programLocationState: 'testState',
  starredWorkspaces: 'testStarredWorkspaces',
  title: 'testTitle',
  researchArea: 'testResearchArea',
} as const satisfies TerraUserProfile;

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
  researchArea: completeUserProfile.researchArea,
};

const NA = 'N/A';

// create user profile
describe('A create user profile request', () => {
  describe('when minimally filled out by the user', () => {
    // when a user has filled out the required fields of a profile
    // and has not entered values for the optional fields
    // those optional fields should be changed to 'N/A' in the request
    it.each(['title', 'institute', 'programLocationCity', 'programLocationState', 'programLocationCountry'])(
      'sets undefined property %s to "N/A"',
      (field) => {
        // Arrange, Act
        const apiBody: OrchestrationUpsertTerraUserProfileRequest = generateAPIBodyForCreateUserProfile(
          minimalCreateUserProfileRequest
        );

        // Assert
        expect(apiBody[field]).toBe(NA);
      }
    );
    it.each(['interestInTerra', 'department'])('should not modify property %s', (field) => {
      // Arrange, Act
      const apiBody: OrchestrationUpsertTerraUserProfileRequest = generateAPIBodyForCreateUserProfile(
        minimalCreateUserProfileRequest
      );

      // Assert
      expect(apiBody[field]).toBe(minimalCreateUserProfileRequest[field]);
    });
    it('should have undefined property researchArea', () => {
      // because the user is registering for the first time research area should be 'undefined'
      // these are not required to be initialized as 'N/A'
      // Arrange, Act
      const apiBody: OrchestrationUpsertTerraUserProfileRequest = generateAPIBodyForCreateUserProfile(
        minimalCreateUserProfileRequest
      );

      // Assert
      expect(apiBody.researchArea).toBe(undefined);
    });
    it.each(['firstName', 'lastName', 'contactEmail'])(
      'should not modify property or have undefined property %s',
      (field) => {
        // Arrange, Act
        const apiBody: OrchestrationUpsertTerraUserProfileRequest = generateAPIBodyForCreateUserProfile(
          minimalCreateUserProfileRequest
        );

        // Assert
        expect(apiBody[field]).toBe(completeUserProfile[field]);
        expect(apiBody[field]).toBeDefined();
      }
    );
  });
  describe('when completely filled out by the user', () => {
    it.each(['title', 'institute'])('should not modify property %s', (field) => {
      // Arrange, Act
      const apiBody: OrchestrationUpsertTerraUserProfileRequest = generateAPIBodyForCreateUserProfile(
        completeCreateUserProfileRequest
      );

      // Assert
      expect(apiBody[field]).toBe(completeUserProfile[field]);
    });
    it.each(['programLocationCity', 'programLocationState', 'programLocationCountry'])(
      'should set property %s to "N/A"',
      (field) => {
        // Arrange, Act
        const apiBody: OrchestrationUpsertTerraUserProfileRequest = generateAPIBodyForCreateUserProfile(
          completeCreateUserProfileRequest
        );

        // Assert
        expect(apiBody[field]).toBe(NA);
      }
    );
    it.each(['interestInTerra', 'department'])('should not modify or have undefined property %s', (field) => {
      // Arrange, Act
      const apiBody: OrchestrationUpsertTerraUserProfileRequest = generateAPIBodyForCreateUserProfile(
        completeCreateUserProfileRequest
      );

      // Assert
      expect(apiBody[field]).toBe(completeCreateUserProfileRequest[field]);
    });
    it('should have undefined property researchArea', () => {
      // Arrange, Act
      const apiBody: OrchestrationUpsertTerraUserProfileRequest = generateAPIBodyForCreateUserProfile(
        completeCreateUserProfileRequest
      );

      // Assert
      expect(apiBody.researchArea).toBe(undefined);
    });
    it.each(['firstName', 'lastName', 'contactEmail'])('should not modify or have undefined property %s', (field) => {
      // Arrange, Act
      const apiBody: OrchestrationUpsertTerraUserProfileRequest = generateAPIBodyForCreateUserProfile(
        completeCreateUserProfileRequest
      );

      // Assert
      expect(apiBody[field]).toBe(completeUserProfile[field]);
      expect(apiBody[field]).toBeDefined();
    });
  });
});

// update user profile
describe('An update user profile request', () => {
  describe('when minimally filled out by the user', () => {
    it.each(['title', 'institute', 'programLocationCity', 'programLocationState', 'programLocationCountry'])(
      'sets undefined property %s to "N/A"',
      (field) => {
        // Arrange, Act
        const apiBody: OrchestrationUpsertTerraUserProfileRequest = generateAPIBodyForUpdateUserProfile(
          minimalUpdateUserProfileRequest
        );

        // Assert
        expect(apiBody[field]).toBe(NA);
      }
    );
    // these required fields that the user filled out should not be changed but may be undefined
    it.each(['interestInTerra', 'department'])('should not modify property %s which may be undefined', (field) => {
      // Arrange, Act
      const apiBody: OrchestrationUpsertTerraUserProfileRequest = generateAPIBodyForUpdateUserProfile(
        minimalUpdateUserProfileRequest
      );

      // Assert
      expect(apiBody[field]).toBe(undefined);
    });
    describe('should have undefined property researchArea', () => {
      // Arrange, Act
      const apiBody: OrchestrationUpsertTerraUserProfileRequest = generateAPIBodyForUpdateUserProfile(
        minimalUpdateUserProfileRequest
      );

      // Assert
      expect(apiBody.researchArea).toBe(undefined);
    });
    it.each(['firstName', 'lastName', 'contactEmail'])(
      'should not modify property or have undefined property %s',
      (field) => {
        // Arrange, Act
        const apiBody: OrchestrationUpsertTerraUserProfileRequest = generateAPIBodyForUpdateUserProfile(
          minimalUpdateUserProfileRequest
        );

        // Assert
        expect(apiBody[field]).toBe(completeUserProfile[field]);
        expect(apiBody[field]).toBeDefined();
      }
    );
  });
  describe('when completely filled out by the user', () => {
    it.each([
      'title',
      'institute',
      'programLocationCity',
      'programLocationState',
      'programLocationCountry',
      'interestInTerra',
      'department',
      'researchArea',
    ])('should not modify property %s', (field) => {
      // Arrange, Act
      const apiBody: OrchestrationUpsertTerraUserProfileRequest = generateAPIBodyForUpdateUserProfile(
        completeUpdateUserProfileRequest
      );

      // Assert
      expect(apiBody[field]).toBe(completeUserProfile[field]);
    });
    it.each(['firstName', 'lastName', 'contactEmail'])('should not modify or have undefined property %s', (field) => {
      // Arrange, Act
      const apiBody: OrchestrationUpsertTerraUserProfileRequest = generateAPIBodyForUpdateUserProfile(
        completeUpdateUserProfileRequest
      );

      // Assert
      expect(apiBody[field]).toBe(completeUserProfile[field]);
      expect(apiBody[field]).toBeDefined();
    });
  });
});
