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

jest.mock('./ajax-common');

describe('converting a terra user profile into a request to upsert a user profile', () => {
  it('with a complete profile', () => {
    // arrange
    const terraCompleteProfile: TerraUserProfile = {
      firstName: 'testFirstName',
      lastName: 'testLastName',
      institute: 'testInstitute',
      contactEmail: 'testContactEmail',
      title: 'testTitle',
      department: 'TestDepartment',
      interestInTerra: 'testInterestInTerra',
      programLocationCity: 'testCity',
      programLocationState: 'testState',
      programLocationCountry: 'testCountry',
      starredWorkspaces: 'testWorkspace',
    };

    // act
    const setUserProfileRequest: SetTerraUserProfileRequest = makeSetUserProfileRequest(terraCompleteProfile);

    // assert
    const expectedRequest: SetTerraUserProfileRequest = {
      firstName: 'testFirstName',
      lastName: 'testLastName',
      institute: 'testInstitute',
      contactEmail: 'testContactEmail',
      title: 'testTitle',
      department: 'TestDepartment',
      interestInTerra: 'testInterestInTerra',
      programLocationCity: 'testCity',
      programLocationState: 'testState',
      programLocationCountry: 'testCountry',
      // termsOfService: "testTos",
      // researchArea: "string",
    };

    expect(setUserProfileRequest).toBe(expectedRequest);
  });
});
