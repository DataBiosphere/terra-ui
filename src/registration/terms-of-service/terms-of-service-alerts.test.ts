import { DeepPartial } from '@terra-ui-packages/core-utils';
import { asMockedFn } from '@terra-ui-packages/test-utils';
import { act } from '@testing-library/react';
import { h } from 'react-hyperscript-helpers';
import { AlertsIndicator } from 'src/alerts/Alerts';
import { Metrics, MetricsContract } from 'src/libs/ajax/Metrics';
import { SamUserTermsOfServiceDetails, TermsOfServiceContract } from 'src/libs/ajax/TermsOfService';
import { SamUserResponse, User, UserContract } from 'src/libs/ajax/User';
import { authStore, TermsOfServiceStatus } from 'src/libs/state';
import * as TosAlerts from 'src/registration/terms-of-service/terms-of-service-alerts';
import { renderWithAppContexts as render } from 'src/testing/test-utils';

import { TermsOfService } from '../../libs/ajax/TermsOfService';

jest.mock('src/libs/ajax/User');
jest.mock('src/libs/ajax/TermsOfService');
jest.mock('src/libs/ajax');
jest.mock('src/libs/ajax/Metrics');

// jest.mock('src/libs/ajax/ajax-common', () => ({
//   ...jest.requireActual('src/libs/ajax/ajax-common'),
//   fetchFromProxy: jest.fn(),
//   fetchOk: jest.fn(),
//   authOpts: jest.fn(),
//   fetchSam: jest.fn(),
// }));

jest.mock('src/libs/nav', () => ({
  ...jest.requireActual('src/libs/nav'),
  getLink: jest.fn().mockReturnValue(''),
}));

jest.mock('react-notifications-component', () => {
  return {
    Store: {
      addNotification: jest.fn(),
      removeNotification: jest.fn(),
    },
  };
});

jest.mock('src/libs/state', () => {
  const state = jest.requireActual('src/libs/state');
  return {
    ...state,
    oidcStore: {
      ...state.oidcStore,
      get: jest.fn().mockReturnValue({
        ...state.oidcStore.get,
        userManager: { getUser: jest.fn() },
      }),
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
const mockSamUserTermsOfServiceDetails: SamUserTermsOfServiceDetails = {
  latestAcceptedVersion: '1234',
  acceptedOn: samUserDate,
  permitsSystemUsage: true,
  isCurrentVersion: true,
};
const getUserTermsOfServiceDetailsFunction = jest.fn().mockResolvedValue(mockSamUserTermsOfServiceDetails);
const getSamUserResponseFunction = jest.fn().mockResolvedValue(mockSamUserResponse);
const getUserAllowancesFunction = jest.fn().mockResolvedValue(testSamUserAllowances);
beforeEach(() => {
  asMockedFn(User).mockReturnValue({
    profile: { get: jest.fn().mockReturnValue(mockTerraUserProfile) },
    getUserAllowances: getUserAllowancesFunction,
    getUserAttributes: jest.fn(),
    getEnterpriseFeatures: jest.fn(),
    getSamUserResponse: getSamUserResponseFunction,
    getNihStatus: jest.fn(),
    getUserTermsOfServiceDetailsFunction,
  } as DeepPartial<UserContract> as UserContract);

  asMockedFn(TermsOfService).mockReturnValue({
    getUserTermsOfServiceDetails: getUserTermsOfServiceDetailsFunction,
  } as Partial<TermsOfServiceContract> as TermsOfServiceContract);

  asMockedFn(Metrics).mockReturnValue({
    captureEvent: jest.fn(),
  } as Partial<MetricsContract> as MetricsContract);
});

afterEach(() => {
  jest.restoreAllMocks();
  TosAlerts.tosAlertsStore.reset();
});

const renderAlerts = async (termsOfService: TermsOfServiceStatus) => {
  await act(async () => {
    render(h(AlertsIndicator));
  });

  const signInStatus = 'authenticated';
  await act(async () => {
    authStore.update((state) => ({ ...state, termsOfService, signInStatus }));
  });
};

describe('terms-of-service-alerts', () => {
  it('adds a notification when the user has a new Terms of Service to accept', async () => {
    // Arrange
    jest.spyOn(TosAlerts, 'useTermsOfServiceAlerts');

    const termsOfService = {
      isCurrentVersion: false,
      permitsSystemUsage: true,
    };

    // Act
    await renderAlerts(termsOfService);

    // Assert
    expect(TosAlerts.useTermsOfServiceAlerts).toHaveBeenCalled();
    expect(TosAlerts.tosAlertsStore.get().length).toEqual(1);
    expect(TosAlerts.tosAlertsStore.get()[0].id).toEqual('new-terms-of-service-alert');
  });

  it('does not add a notification when the user does not have a new Terms of Service to accept', async () => {
    // Arrange
    jest.spyOn(TosAlerts, 'useTermsOfServiceAlerts');

    const termsOfService = {
      isCurrentVersion: true,
      permitsSystemUsage: true,
    };

    // Act
    await renderAlerts(termsOfService);

    // Assert
    expect(TosAlerts.useTermsOfServiceAlerts).toHaveBeenCalled();
    expect(TosAlerts.tosAlertsStore.get().length).toEqual(0);
  });
});
