import { DeepPartial } from '@terra-ui-packages/core-utils';
import { act } from '@testing-library/react';
import _ from 'lodash/fp';
import { defaultLocation } from 'src/analysis/utils/runtime-utils';
import { locationTypes } from 'src/components/region-common';
import * as WorkspaceUtils from 'src/components/workspace-utils';
import { Ajax } from 'src/libs/ajax';
import { AzureStorage, AzureStorageContract } from 'src/libs/ajax/AzureStorage';
import * as GoogleStorage from 'src/libs/ajax/GoogleStorage';
import * as Notifications from 'src/libs/notifications';
import { workspaceStore } from 'src/libs/state';
import {
  azureBucketRecheckRate,
  googlePermissionsRecheckRate,
  useWorkspace,
} from 'src/pages/workspaces/workspace/useWorkspace';
import { asMockedFn, renderHookInAct } from 'src/testing/test-utils';

jest.mock('src/libs/ajax/AzureStorage');

type AjaxExports = typeof import('src/libs/ajax');
jest.mock('src/libs/ajax');
type AjaxContract = ReturnType<AjaxExports['Ajax']>;

jest.mock('src/libs/notifications');

type StateExports = typeof import('src/libs/state');
jest.mock('src/libs/state', (): StateExports => {
  return {
    ...jest.requireActual('src/libs/state'),
    getUser: jest.fn(() => ({ email: 'christina@foo.com' })),
  };
});

jest.mock('src/libs/config', () => ({
  ...jest.requireActual('src/libs/config'),
  getConfig: jest.fn().mockReturnValue({}),
}));

describe('useActiveWorkspace', () => {
  const initializedGoogleWorkspace = {
    accessLevel: 'PROJECT_OWNER',
    owners: ['christina@foo.com'],
    workspace: {
      attributes: {
        description: '',
      },
      authorizationDomain: [],
      billingAccount: 'billingAccounts/google-billing-account',
      bucketName: 'bucket-name',
      cloudPlatform: 'Gcp',
      completedCloneWorkspaceFileTransfer: '2023-02-03T22:29:04.319Z',
      createdBy: 'christina@foo.com',
      createdDate: '2023-02-03T22:26:06.124Z',
      googleProject: 'google-project-id',
      isLocked: false,
      lastModified: '2023-02-03T22:26:06.202Z',
      name: 'testName',
      namespace: 'testNamespace',
      workspaceId: 'google-workspace-id',
      workspaceType: 'rawls',
      workspaceVersion: 'v2',
    },
    canShare: true,
    canCompute: true,
    workspaceInitialized: true,
  };

  const initializedAzureWorkspace = {
    accessLevel: 'PROJECT_OWNER',
    owners: ['christina@foo.com'],
    azureContext: {
      managedResourceGroupId: 'test-mrg',
      subscriptionId: 'test-sub-id',
      tenantId: 'test-tenant-id',
    },
    workspace: {
      attributes: {
        description: '',
      },
      authorizationDomain: [],
      bucketName: '',
      cloudPlatform: 'Azure',
      completedCloneWorkspaceFileTransfer: '2023-02-03T22:29:04.319Z',
      createdBy: 'christina@foo.com',
      createdDate: '2023-02-03T22:26:06.124Z',
      googleProject: '',
      isLocked: false,
      lastModified: '2023-02-03T22:26:06.202Z',
      name: 'testName',
      namespace: 'testNamespace',
      workspaceId: 'azure-workspace-id',
      workspaceType: 'rawls',
      workspaceVersion: 'v2',
    },
    canShare: true,
    canCompute: true,
    workspaceInitialized: true,
  };

  const bucketLocationResponse = {
    location: 'bucket-location',
    locationType: 'location-type',
  };

  const defaultGoogleBucketOptions = {
    googleBucketLocation: defaultLocation,
    googleBucketType: locationTypes.default,
    fetchedGoogleBucketLocation: undefined,
  };

  const azureStorageDetails = {
    location: 'container-location',
    sas: { url: 'container-url?sas-token' },
  };

  const defaultAzureStorageOptions = {
    azureContainerRegion: undefined,
    azureContainerUrl: undefined,
    azureContainerSasUrl: undefined,
  };

  beforeEach(() => {
    workspaceStore.reset();
    jest.useFakeTimers();

    jest.spyOn(workspaceStore, 'set');
    jest.spyOn(WorkspaceUtils, 'updateRecentlyViewedWorkspaces');
    jest.spyOn(GoogleStorage, 'saToken');
    jest.spyOn(Notifications, 'notify');

    // Don't show expected error responses in logs
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  const assertResult = (result, expectedWorkspace, expectedStorageDetails, expectedAccessError) => {
    expect(result.workspace).toEqual(expectedWorkspace);
    expect(result.storageDetails).toEqual(expectedStorageDetails);
    expect(result.accessError).toBe(expectedAccessError);
    expect(result.refreshWorkspace).toBeTruthy();
    expect(result.loadingWorkspace).toBe(false);
  };

  it('can initialize from a Google workspace in workspaceStore', async () => {
    // Arrange
    const mockAjax: DeepPartial<AjaxContract> = {
      Workspaces: {
        workspace: () => ({
          checkBucketLocation: jest.fn().mockResolvedValue(bucketLocationResponse),
        }),
      },
    };
    asMockedFn(Ajax).mockImplementation(() => mockAjax as AjaxContract);

    workspaceStore.set(initializedGoogleWorkspace);
    const expectedStorageDetails = _.merge(
      {
        googleBucketLocation: bucketLocationResponse.location,
        googleBucketType: bucketLocationResponse.locationType,
        fetchedGoogleBucketLocation: 'SUCCESS',
      },
      defaultAzureStorageOptions
    );

    // Act
    // Wait for the bucket location call.
    const { result } = await renderHookInAct(() => useWorkspace('testNamespace', 'testName'));

    // Assert
    assertResult(result.current, initializedGoogleWorkspace, expectedStorageDetails, false);
    expect(workspaceStore.set).toHaveBeenCalledWith(initializedGoogleWorkspace);
    expect(WorkspaceUtils.updateRecentlyViewedWorkspaces).not.toHaveBeenCalled();
    expect(GoogleStorage.saToken).not.toHaveBeenCalled();
  });

  it('can initialize from a requester pays Google workspace in workspaceStore', async () => {
    // Arrange
    const mockAjax: DeepPartial<AjaxContract> = {
      Workspaces: {
        workspace: () => ({
          checkBucketLocation: () => Promise.reject(new Response('Mock requester pays error', { status: 400 })),
        }),
      },
    };
    asMockedFn(Ajax).mockImplementation(() => mockAjax as AjaxContract);

    workspaceStore.set(initializedGoogleWorkspace);
    // Calling to get the bucket location fails, default options remain except for indication of error state.
    const expectedStorageDetails = _.mergeAll([
      defaultGoogleBucketOptions,
      { fetchedGoogleBucketLocation: 'ERROR' },
      defaultAzureStorageOptions,
    ]);

    // Act
    // Wait for the bucket location call.
    const { result } = await renderHookInAct(() => useWorkspace('testNamespace', 'testName'));

    // Assert
    assertResult(result.current, initializedGoogleWorkspace, expectedStorageDetails, false);
  });

  it('can initialize from an Azure workspace in workspaceStore', async () => {
    // Arrange
    const azureStorageMock: Partial<AzureStorageContract> = {
      details: jest.fn().mockResolvedValue(azureStorageDetails),
    };
    asMockedFn(AzureStorage).mockImplementation(() => azureStorageMock as AzureStorageContract);

    workspaceStore.set(initializedAzureWorkspace);
    const expectedStorageDetails = _.merge(
      {
        azureContainerRegion: azureStorageDetails.location,
        azureContainerUrl: 'container-url',
        azureContainerSasUrl: azureStorageDetails.sas.url,
      },
      defaultGoogleBucketOptions
    );

    // Act
    // Wait for the Azure storage call.
    const { result } = await renderHookInAct(() => useWorkspace('testNamespace', 'testName'));

    // Assert
    assertResult(result.current, initializedAzureWorkspace, expectedStorageDetails, false);
    expect(workspaceStore.set).toHaveBeenCalledWith(initializedAzureWorkspace);
    expect(WorkspaceUtils.updateRecentlyViewedWorkspaces).not.toHaveBeenCalled();
    expect(GoogleStorage.saToken).not.toHaveBeenCalled();
  });

  const verifyGooglePermissionsFailure = async (fetchedGoogleBucketLocation: string | undefined = undefined) => {
    // Arrange
    // Expected response from useWorkspace should be false to reflect that permissions are not fully synced.
    const uninitializedGoogleWorkspace = _.clone(initializedGoogleWorkspace);
    uninitializedGoogleWorkspace.workspaceInitialized = false;

    const expectedStillSyncingDetails = _.mergeAll([
      defaultGoogleBucketOptions,
      { fetchedGoogleBucketLocation },
      defaultAzureStorageOptions,
    ]);

    // Act
    const renderHookResult = await renderHookInAct(() => useWorkspace('testNamespace', 'testName'));
    const { result } = renderHookResult;

    // Assert
    assertResult(result.current, uninitializedGoogleWorkspace, expectedStillSyncingDetails, false);
    expect(workspaceStore.set).toHaveBeenCalledWith(uninitializedGoogleWorkspace);
    expect(WorkspaceUtils.updateRecentlyViewedWorkspaces).toHaveBeenCalledWith(
      uninitializedGoogleWorkspace.workspace.workspaceId
    );
    expect(GoogleStorage.saToken).toHaveBeenCalled();

    return renderHookResult;
  };

  const verifyGooglePermissionsSuccess = async (result) => {
    // Arrange
    const expectedAllSyncedDetails = _.merge(
      {
        googleBucketLocation: bucketLocationResponse.location,
        googleBucketType: bucketLocationResponse.locationType,
        fetchedGoogleBucketLocation: 'SUCCESS',
      },
      defaultAzureStorageOptions
    );

    const successMockAjax: DeepPartial<AjaxContract> = {
      Workspaces: {
        workspace: () => ({
          checkBucketLocation: jest.fn().mockResolvedValue(bucketLocationResponse),
          checkBucketReadAccess: jest.fn(),
          storageCostEstimate: jest.fn(),
          bucketUsage: jest.fn(),
        }),
      },
    };
    asMockedFn(Ajax).mockImplementation(() => successMockAjax as AjaxContract);

    // Act
    await act(async () => {
      jest.advanceTimersByTime(googlePermissionsRecheckRate);
    });

    // Assert
    assertResult(result.current, initializedGoogleWorkspace, expectedAllSyncedDetails, false);
    expect(workspaceStore.set).toHaveBeenCalledWith(initializedGoogleWorkspace);
  };

  it('can read workspace details from server, and poll until permissions synced (handling checkBucketAccess failure)', async () => {
    // Arrange
    // remove workspaceInitialized because the server response does not include this information
    const { workspaceInitialized, ...serverWorkspaceResponse } = initializedGoogleWorkspace;

    const errorMockAjax: DeepPartial<AjaxContract> = {
      Workspaces: {
        workspace: () => ({
          details: jest.fn().mockResolvedValue(serverWorkspaceResponse),
          checkBucketReadAccess: () => Promise.reject(new Response('Mock permissions error', { status: 500 })),
        }),
      },
    };
    asMockedFn(Ajax).mockImplementation(() => errorMockAjax as AjaxContract);

    // Verify initial failure based on error mock.
    const { result } = await verifyGooglePermissionsFailure();

    // Finally, change mock to pass all checks verify success.
    await verifyGooglePermissionsSuccess(result);
  });

  it('can read workspace details from server, and poll until permissions synced (handling storageCostEstimate failure)', async () => {
    // Arrange
    // remove workspaceInitialized because the server response does not include this information
    const { workspaceInitialized, ...serverWorkspaceResponse } = initializedGoogleWorkspace;

    const errorMockAjax: DeepPartial<AjaxContract> = {
      Workspaces: {
        workspace: () => ({
          details: jest.fn().mockResolvedValue(serverWorkspaceResponse),
          checkBucketLocation: jest.fn().mockResolvedValue(bucketLocationResponse),
          checkBucketReadAccess: jest.fn(),
          storageCostEstimate: () => Promise.reject(new Response('Mock storage cost estimate error', { status: 500 })),
          bucketUsage: jest.fn(),
        }),
      },
    };
    asMockedFn(Ajax).mockImplementation(() => errorMockAjax as AjaxContract);

    // Verify initial failure based on error mock.
    const { result } = await verifyGooglePermissionsFailure();

    // Finally, change mock to pass all checks verify success.
    await verifyGooglePermissionsSuccess(result);
  });

  it('can read workspace details from server, and poll until permissions synced (handling bucketUsage failure)', async () => {
    // Arrange
    // remove workspaceInitialized because the server response does not include this information
    const { workspaceInitialized, ...serverWorkspaceResponse } = initializedGoogleWorkspace;

    const errorMockAjax: DeepPartial<AjaxContract> = {
      Workspaces: {
        workspace: () => ({
          details: jest.fn().mockResolvedValue(serverWorkspaceResponse),
          checkBucketLocation: jest.fn().mockResolvedValue(bucketLocationResponse),
          checkBucketReadAccess: jest.fn(),
          storageCostEstimate: jest.fn(),
          bucketUsage: () => Promise.reject(new Response('Mock bucket usage error', { status: 500 })),
        }),
      },
    };
    asMockedFn(Ajax).mockImplementation(() => errorMockAjax as AjaxContract);

    // Verify initial failure based on error mock.
    const { result } = await verifyGooglePermissionsFailure();

    // Finally, change mock to pass all checks verify success.
    await verifyGooglePermissionsSuccess(result);
  });

  it('can read workspace details from server, and poll until permissions synced (handling checkBucketLocation failure)', async () => {
    // Arrange
    // remove workspaceInitialized because the server response does not include this information
    const { workspaceInitialized, ...serverWorkspaceResponse } = initializedGoogleWorkspace;

    const errorMockAjax: DeepPartial<AjaxContract> = {
      Workspaces: {
        workspace: () => ({
          details: jest.fn().mockResolvedValue(serverWorkspaceResponse),
          checkBucketLocation: () => Promise.reject(new Response('Mock check bucket location', { status: 500 })),
          checkBucketReadAccess: jest.fn(),
          storageCostEstimate: jest.fn(),
          bucketUsage: jest.fn(),
        }),
      },
    };
    asMockedFn(Ajax).mockImplementation(() => errorMockAjax as AjaxContract);

    // Verify initial failure based on error mock.
    const { result } = await verifyGooglePermissionsFailure('ERROR');

    // Finally, change mock to pass all checks verify success.
    await verifyGooglePermissionsSuccess(result);
  });

  it('can read workspace details from server for read-only workspace, and poll Google until permissions are synced', async () => {
    // Arrange
    const readOnlyWorkspace = _.clone(initializedGoogleWorkspace);
    readOnlyWorkspace.accessLevel = 'READER';
    // remove workspaceInitialized because the server response does not include this information
    const { workspaceInitialized, ...serverWorkspaceResponse } = readOnlyWorkspace;

    // checkBucketAccess and checkBucketLocation succeed, but calls that should only be executed if
    // user has writer permission throw errors (to verify that they aren't called).
    const successMockAjax: DeepPartial<AjaxContract> = {
      Workspaces: {
        workspace: () => ({
          details: jest.fn().mockResolvedValue(serverWorkspaceResponse),
          checkBucketLocation: jest.fn().mockResolvedValue(bucketLocationResponse),
          checkBucketReadAccess: jest.fn(),
          storageCostEstimate: () => Promise.reject(new Response('Should not call', { status: 500 })),
          bucketUsage: () => Promise.reject(new Response('Should not call', { status: 500 })),
        }),
      },
    };
    asMockedFn(Ajax).mockImplementation(() => successMockAjax as AjaxContract);

    const expectedAllSyncedDetails = _.merge(
      {
        googleBucketLocation: bucketLocationResponse.location,
        googleBucketType: bucketLocationResponse.locationType,
        fetchedGoogleBucketLocation: 'SUCCESS',
      },
      defaultAzureStorageOptions
    );

    // Act
    // Wait for the calls to checkBucketReadAccess and checkBucketLocation to execute
    const { result } = await renderHookInAct(() => useWorkspace('testNamespace', 'testName'));

    // Assert
    assertResult(result.current, readOnlyWorkspace, expectedAllSyncedDetails, false);
    expect(workspaceStore.set).toHaveBeenCalledWith(readOnlyWorkspace);
  });

  it('treats requesterPays errors as Google workspace being initialized', async () => {
    // Arrange
    // remove workspaceInitialized because the server response does not include this information
    const { workspaceInitialized, ...serverWorkspaceResponse } = initializedGoogleWorkspace;

    // Throw error from checkBucketReadAccess
    const mockAjax: DeepPartial<AjaxContract> = {
      Workspaces: {
        workspace: () => ({
          details: jest.fn().mockResolvedValue(serverWorkspaceResponse),
          checkBucketReadAccess: () => Promise.reject(new Response('Mock requester pays error', { status: 500 })),
        }),
      },
    };
    asMockedFn(Ajax).mockImplementation(() => mockAjax as AjaxContract);

    // Will not attempt to retrieve storage details due to requester pays
    const expectedStorageDetails = _.merge(
      {
        googleBucketLocation: defaultGoogleBucketOptions.googleBucketLocation,
        googleBucketType: defaultGoogleBucketOptions.googleBucketType,
        fetchedGoogleBucketLocation: 'ERROR',
      },
      defaultAzureStorageOptions
    );

    // Act
    // Wait for the call to checkBucketReadAccess to execute
    const { result } = await renderHookInAct(() => useWorkspace('testNamespace', 'testName'));

    // Assert
    assertResult(result.current, initializedGoogleWorkspace, expectedStorageDetails, false);
    expect(workspaceStore.set).toHaveBeenCalledWith(initializedGoogleWorkspace);
    expect(WorkspaceUtils.updateRecentlyViewedWorkspaces).toHaveBeenCalledWith(
      initializedGoogleWorkspace.workspace.workspaceId
    );
    expect(GoogleStorage.saToken).toHaveBeenCalled();
  });

  it('can read workspace details from server, and poll WSM until the container exists', async () => {
    // Arrange
    // remove workspaceInitialized because the server response does not include this information
    const { workspaceInitialized, ...serverWorkspaceResponse } = initializedAzureWorkspace;

    const mockAjax: DeepPartial<AjaxContract> = {
      Workspaces: {
        workspace: () => ({
          details: jest.fn().mockResolvedValue(serverWorkspaceResponse),
        }),
      },
    };
    asMockedFn(Ajax).mockImplementation(() => mockAjax as AjaxContract);

    const errorAzureStorageMock: Partial<AzureStorageContract> = {
      details: () => Promise.reject(new Response('Mock container error', { status: 500 })),
    };
    asMockedFn(AzureStorage).mockImplementation(() => errorAzureStorageMock as AzureStorageContract);

    // Expected response from first call.
    const uninitializedAzureWorkspace = _.clone(initializedAzureWorkspace);
    uninitializedAzureWorkspace.workspaceInitialized = false;

    const expectedFirstStorageDetails = _.merge(defaultGoogleBucketOptions, defaultAzureStorageOptions);
    const expectedSecondStorageDetails = _.merge(
      {
        azureContainerRegion: azureStorageDetails.location,
        azureContainerUrl: 'container-url',
        azureContainerSasUrl: azureStorageDetails.sas.url,
      },
      defaultGoogleBucketOptions
    );

    // Act
    // Wait for the call to AzureStorage.details to execute.
    const { result } = await renderHookInAct(() => useWorkspace('testNamespace', 'testName'));

    // Assert
    assertResult(result.current, uninitializedAzureWorkspace, expectedFirstStorageDetails, false);
    expect(workspaceStore.set).toHaveBeenCalledWith(uninitializedAzureWorkspace);
    expect(WorkspaceUtils.updateRecentlyViewedWorkspaces).toHaveBeenCalledWith(
      uninitializedAzureWorkspace.workspace.workspaceId
    );
    expect(GoogleStorage.saToken).not.toHaveBeenCalled();

    // Arrange
    // Now return success for the next call to AzureStorage.details
    const successAzureStorageMock: Partial<AzureStorageContract> = {
      details: jest.fn().mockResolvedValue(azureStorageDetails),
    };
    asMockedFn(AzureStorage).mockImplementation(() => successAzureStorageMock as AzureStorageContract);

    // Act
    // next call to AzureStorage.details is on a timer
    await act(async () => {
      jest.advanceTimersByTime(azureBucketRecheckRate);
    });

    // Assert
    assertResult(result.current, initializedAzureWorkspace, expectedSecondStorageDetails, false);
    expect(workspaceStore.set).toHaveBeenCalledWith(initializedAzureWorkspace);
  });

  it('returns an access error if workspace details throws a 404', async () => {
    // Arrange
    const mockAjax: DeepPartial<AjaxContract> = {
      Workspaces: {
        workspace: () => ({
          details: () => Promise.reject(new Response('Mock access error', { status: 404 })),
        }),
      },
    };
    asMockedFn(Ajax).mockImplementation(() => mockAjax as AjaxContract);

    // Act
    const { result } = await renderHookInAct(() => useWorkspace('testNamespace', 'testName'));

    // Assert
    assertResult(result.current, undefined, _.merge(defaultGoogleBucketOptions, defaultAzureStorageOptions), true);
    expect(workspaceStore.set).not.toHaveBeenCalled();
    expect(WorkspaceUtils.updateRecentlyViewedWorkspaces).not.toHaveBeenCalled();
    expect(GoogleStorage.saToken).not.toHaveBeenCalled();
  });

  it('does not request SA token for Google workspace if not a writer', async () => {
    // Arrange
    // remove workspaceInitialized because the server response does not include this information
    const { workspaceInitialized, ...serverWorkspaceResponse } = initializedGoogleWorkspace;
    serverWorkspaceResponse.accessLevel = 'READER';

    const expectedWorkspaceResponse = _.merge(_.clone(serverWorkspaceResponse), { workspaceInitialized: true });

    const mockAjax: DeepPartial<AjaxContract> = {
      Workspaces: {
        workspace: () => ({
          details: jest.fn().mockResolvedValue(serverWorkspaceResponse),
          checkBucketLocation: jest.fn().mockResolvedValue(bucketLocationResponse),
          checkBucketReadAccess: jest.fn(),
        }),
      },
    };
    asMockedFn(Ajax).mockImplementation(() => mockAjax as AjaxContract);

    const expectStorageDetails = _.merge(
      {
        googleBucketLocation: bucketLocationResponse.location,
        googleBucketType: bucketLocationResponse.locationType,
        fetchedGoogleBucketLocation: 'SUCCESS',
      },
      defaultAzureStorageOptions
    );

    // Act
    // Wait for the call to checkBucketReadAccess to execute
    const { result } = await renderHookInAct(() => useWorkspace('testNamespace', 'testName'));

    // Assert
    assertResult(result.current, expectedWorkspaceResponse, expectStorageDetails, false);
    expect(workspaceStore.set).toHaveBeenCalledWith(expectedWorkspaceResponse);
    expect(WorkspaceUtils.updateRecentlyViewedWorkspaces).toHaveBeenCalledWith(
      expectedWorkspaceResponse.workspace.workspaceId
    );
    expect(GoogleStorage.saToken).not.toHaveBeenCalled();
    expect(Notifications.notify).not.toHaveBeenCalled();
  });

  it('Shows a notification if workspace just created by user, but Rawls did not return that they are the owner', async () => {
    // Arrange
    // remove workspaceInitialized because the server response does not include this information
    const { workspaceInitialized, ...serverWorkspaceResponse } = initializedGoogleWorkspace;
    serverWorkspaceResponse.accessLevel = 'READER';

    const expectedWorkspaceResponse = _.merge(_.clone(serverWorkspaceResponse), { workspaceInitialized: true });

    const mockAjax: DeepPartial<AjaxContract> = {
      Workspaces: {
        workspace: () => ({
          details: jest.fn().mockResolvedValue(serverWorkspaceResponse),
          checkBucketLocation: jest.fn().mockResolvedValue(bucketLocationResponse),
          checkBucketReadAccess: jest.fn(),
        }),
      },
    };
    asMockedFn(Ajax).mockImplementation(() => mockAjax as AjaxContract);

    const expectStorageDetails = _.merge(
      {
        googleBucketLocation: bucketLocationResponse.location,
        googleBucketType: bucketLocationResponse.locationType,
        fetchedGoogleBucketLocation: 'SUCCESS',
      },
      defaultAzureStorageOptions
    );

    // Created time is '2023-02-03T22:26:06.124Z',
    jest.setSystemTime(new Date(Date.UTC(2023, 1, 3, 22, 26, 12, 0)));

    // Act
    // Wait for the call to checkBucketReadAccess to execute
    const { result } = await renderHookInAct(() => useWorkspace('testNamespace', 'testName'));

    // Assert
    assertResult(result.current, expectedWorkspaceResponse, expectStorageDetails, false);
    expect(workspaceStore.set).toHaveBeenCalledWith(expectedWorkspaceResponse);
    expect(WorkspaceUtils.updateRecentlyViewedWorkspaces).toHaveBeenCalledWith(
      expectedWorkspaceResponse.workspace.workspaceId
    );
    expect(GoogleStorage.saToken).not.toHaveBeenCalled();
    expect(Notifications.notify).toHaveBeenCalled();
  });
});
