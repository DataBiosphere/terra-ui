import { act, screen } from '@testing-library/react';
import { h } from 'react-hyperscript-helpers';
import { decodeSessionFromUrl, getIgvUrlParams } from 'src/components/useIGVSessions';
import { Apps, AppsAjaxContract } from 'src/libs/ajax/leonardo/Apps';
import { LeoAppStatus, ListAppItem } from 'src/libs/ajax/leonardo/models/app-models';
import { Metrics, MetricsContract } from 'src/libs/ajax/Metrics';
import { WorkspaceData as WorkspaceDataAjax, WorkspaceDataAjaxContract } from 'src/libs/ajax/WorkspaceDataService';
import { WorkspaceContract, Workspaces, WorkspacesAjaxContract } from 'src/libs/ajax/workspaces/Workspaces';
import { asMockedFn, MockedFn, partial, renderWithAppContexts as render } from 'src/testing/test-utils';
import {
  defaultAzureWorkspace,
  defaultGoogleBucketOptions,
  defaultGoogleWorkspace,
} from 'src/testing/workspace-fixtures';
import { StorageDetails } from 'src/workspaces/common/state/useWorkspace';
import { WorkspaceWrapper } from 'src/workspaces/utils';

import { WorkspaceData } from './Data';

type WorkspaceContainerExports = typeof import('src/workspaces/container/WorkspaceContainer');
jest.mock('src/workspaces/container/WorkspaceContainer', (): WorkspaceContainerExports => {
  return {
    ...jest.requireActual<WorkspaceContainerExports>('src/workspaces/container/WorkspaceContainer'),
    wrapWorkspace: jest.fn().mockImplementation((_opts) => (wrappedComponent: any) => wrappedComponent),
  };
});

const entityMetadata = {
  sra: {
    attributeNames: ['string', 'num'],
    count: 2,
    idName: 'sra',
  },
};

jest.mock('src/libs/ajax/leonardo/Apps');
jest.mock('src/libs/ajax/Metrics');
jest.mock('src/libs/ajax/workspaces/Workspaces');
jest.mock('src/libs/ajax/WorkspaceDataService');

jest.mock('src/libs/error', () => ({
  ...jest.requireActual('src/libs/error'),
  reportError: jest.fn(),
}));

const cwdsUrlRoot = 'https://cwds.test.url';

jest.mock('src/libs/config', () => ({
  ...jest.requireActual('src/libs/config'),
  getConfig: jest.fn().mockReturnValue({ cwdsUrlRoot }),
}));

type AjaxCommonExports = typeof import('src/libs/ajax/ajax-common');

jest.mock('src/libs/ajax/ajax-common', (): AjaxCommonExports => {
  return {
    ...jest.requireActual<AjaxCommonExports>('src/libs/ajax/ajax-common'),
    fetchWDS: jest.fn().mockImplementation(() => {
      return jest.fn().mockResolvedValue({
        json: jest.fn().mockResolvedValue({}),
      });
    }),
  };
});

jest.mock('src/components/useIGVSessions', () => ({
  getIgvUrlParams: jest.fn().mockReturnValue({
    igvSession: null,
    igvGenome: null,
  }),
  decodeSessionFromUrl: jest.fn(),
  clearIgvUrlParams: jest.fn(),
  useIGVSessions: jest.fn(() => ({
    savedSessions: [],
    getSavedSessions: jest.fn(),
    loadSession: jest.fn(),
    deleteSession: jest.fn(),
  })),
}));

jest.mock('src/libs/nav', () => {
  const mockRouteHandlersStore = {
    get: jest.fn().mockReturnValue([
      { name: 'workspace-data', makePath: jest.fn().mockReturnValue('/workspaces/test/test/data') },
      { name: 'upload', makePath: jest.fn().mockReturnValue('/upload') },
    ]),
  };

  return {
    getLink: jest.fn().mockReturnValue('/mock-upload-path'),
    getCurrentRoute: jest.fn().mockReturnValue({ name: 'workspace-data' }),
    getCurrentUrl: jest.fn().mockReturnValue({
      hostname: 'localhost',
      pathname: '/workspaces/test/test/data',
      search: '',
      hash: '',
    }),
    goToPath: jest.fn(),
    updateSearch: jest.fn(),
    routeHandlersStore: mockRouteHandlersStore,
  };
});

// When Data.js is broken apart and the WorkspaceData component is converted to TypeScript,
// this type belongs there.
interface WorkspaceDataProps {
  namespace: string;
  name: string;
  workspace: WorkspaceWrapper;
  refreshWorkspace: () => void;
  storageDetails: StorageDetails;
}

beforeAll(() => {
  jest.useFakeTimers();
});

afterAll(() => {
  jest.useRealTimers();
});

describe('WorkspaceData', () => {
  type SetupOptions = {
    namespace?: string;
    name?: string;
    workspace: WorkspaceWrapper;
    refreshWorkspace?: () => void;
    storageDetails?: StorageDetails;
    status: LeoAppStatus;
    wdsUrl?: string | undefined;
    entityMetadataResult?: 'success' | 'error' | 'empty' | any;
  };
  type SetupResult = {
    workspaceDataProps: WorkspaceDataProps;
    listAppResponse: Partial<ListAppItem>;
    mockGetSchema: MockedFn<WorkspaceDataAjaxContract['getSchema']>;
    mockListAppsV2: MockedFn<AppsAjaxContract['listAppsV2']>;
    mockEntityMetadata: MockedFn<WorkspaceContract['entityMetadata']>;
  };

  const populatedAzureStorageOptions = {
    azureContainerRegion: 'eastus',
    azureContainerUrl: 'container-url',
    azureContainerSasUrl: 'container-url?sas',
  };

  // SIFERS setup, see: https://medium.com/@kolodny/testing-with-sifers-c9d6bb5b362
  function setup({
    namespace = 'test-namespace',
    name = 'test-name',
    workspace,
    refreshWorkspace = () => {},
    storageDetails = { ...defaultGoogleBucketOptions, ...populatedAzureStorageOptions },
    status = 'RUNNING',
    wdsUrl = 'http://fake.wds.url',
    entityMetadataResult = 'success',
  }: SetupOptions): SetupResult {
    const listAppResponse = partial<ListAppItem>({
      proxyUrls: {
        wds: wdsUrl,
      },
      appType: 'WDS',
      status,
    });

    const mockGetCapabilities: MockedFn<WorkspaceDataAjaxContract['getCapabilities']> = jest.fn();
    const mockGetSchema: MockedFn<WorkspaceDataAjaxContract['getSchema']> = jest.fn();
    const mockListAppsV2: MockedFn<AppsAjaxContract['listAppsV2']> = jest.fn();
    const mockDetails: MockedFn<WorkspaceContract['details']> = jest.fn();
    const mockEntityMetadata: MockedFn<WorkspaceContract['entityMetadata']> = jest.fn();

    let entityMetadataMock;
    switch (entityMetadataResult) {
      case 'success':
        entityMetadataMock = mockEntityMetadata.mockResolvedValue(entityMetadata);
        break;
      case 'error':
        entityMetadataMock = mockEntityMetadata.mockRejectedValue(new Error('Entity metadata error'));
        break;
      case 'empty':
        entityMetadataMock = mockEntityMetadata.mockResolvedValue({});
        break;
      default:
        entityMetadataMock = mockEntityMetadata.mockResolvedValue(entityMetadataResult);
    }

    asMockedFn(Workspaces).mockReturnValue(
      partial<WorkspacesAjaxContract>({
        workspace: (_namespace, _name) =>
          partial<WorkspaceContract>({
            details: mockDetails.mockResolvedValue(workspace),
            entityMetadata: entityMetadataMock,
          }),
      })
    );
    asMockedFn(WorkspaceDataAjax).mockReturnValue(
      partial<WorkspaceDataAjaxContract>({
        getCapabilities: mockGetCapabilities.mockResolvedValue({}),
        getSchema: mockGetSchema.mockResolvedValue([]),
      })
    );
    asMockedFn(Apps).mockReturnValue(
      partial<AppsAjaxContract>({
        listAppsV2: mockListAppsV2.mockResolvedValue([listAppResponse]),
      })
    );
    asMockedFn(Metrics).mockReturnValue(partial<MetricsContract>({ captureEvent: jest.fn() }));

    const workspaceDataProps: WorkspaceDataProps = {
      namespace,
      name,
      workspace,
      refreshWorkspace,
      storageDetails,
    };

    return {
      workspaceDataProps,
      listAppResponse,
      mockGetSchema,
      mockListAppsV2,
      mockEntityMetadata,
    };
  }

  it('does not call Rawls for metadata on loading an azure workspace', async () => {
    // Arrange
    const { workspaceDataProps, mockEntityMetadata } = setup({
      workspace: defaultAzureWorkspace,
      status: 'RUNNING',
      entityMetadataResult: 'error',
    });

    // Act
    await act(async () => {
      render(h(WorkspaceData, workspaceDataProps));
    });

    // Assert
    expect(mockEntityMetadata).not.toHaveBeenCalled();
  });

  it('opens IGV browser when session is present in URL', async () => {
    // Mock URL parameters to include igvSession
    const mockUrlParams = new URLSearchParams();
    mockUrlParams.set('igvSession', 'test-session');
    mockUrlParams.set('igvGenome', 'hg38');

    Object.defineProperty(window, 'location', {
      value: {
        ...window.location,
        search: `?${mockUrlParams.toString()}`,
      },
      writable: true,
    });

    (decodeSessionFromUrl as jest.Mock).mockReturnValue({
      genome: 'hg38',
      locus: 'chr1:1000-2000',
      tracks: [],
    });

    (getIgvUrlParams as jest.Mock).mockReturnValue({
      igvSession: 'test-session',
      igvGenome: 'hg38',
    });

    const { workspaceDataProps } = setup({
      workspace: defaultGoogleWorkspace,
      status: 'RUNNING',
    });
    await act(async () => {
      render(h(WorkspaceData, workspaceDataProps));
    });

    expect(await screen.findByText('Save Session')).toBeInTheDocument();
    expect(await screen.findByText('Share Session')).toBeInTheDocument();
    expect(await screen.findByText('Add track')).toBeInTheDocument();
  });
});
