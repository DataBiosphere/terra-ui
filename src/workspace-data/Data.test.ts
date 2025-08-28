import { act, screen, waitFor } from '@testing-library/react';
import { h } from 'react-hyperscript-helpers';
import { decodeSessionFromUrl, getIgvUrlParams } from 'src/components/useIGVSessions';
import { Workspaces } from 'src/libs/ajax/workspaces/Workspaces';
import { asMockedFn, renderWithAppContexts as render } from 'src/testing/test-utils';
import { defaultGoogleBucketOptions, defaultGoogleWorkspace } from 'src/testing/workspace-fixtures';

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

jest.mock('src/libs/ajax/workspaces/Workspaces');

jest.mock('src/libs/error', () => ({
  ...jest.requireActual('src/libs/error'),
  reportError: jest.fn(),
}));

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

beforeAll(() => {
  jest.useFakeTimers();
});

afterAll(() => {
  jest.useRealTimers();
});

describe('WorkspaceData', () => {
  it('opens IGV browser when session is present in URL', async () => {
    // Setup mocks for the test
    const mockEntityMetadata = jest.fn();
    mockEntityMetadata.mockResolvedValue(entityMetadata);

    asMockedFn(Workspaces).mockReturnValue({
      workspace: (_namespace: string, _name: string) => ({
        entityMetadata: mockEntityMetadata,
      }),
    } as any);

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

    const workspaceDataProps = {
      namespace: 'test-namespace',
      name: 'test-name',
      workspace: defaultGoogleWorkspace,
      refreshWorkspace: () => {},
      storageDetails: { ...defaultGoogleBucketOptions },
    };

    await act(async () => {
      render(h(WorkspaceData, workspaceDataProps));
    });

    await waitFor(
      () => {
        expect(screen.getByText('Save Session')).toBeInTheDocument();
        expect(screen.getByText('Share Session')).toBeInTheDocument();
        expect(screen.getByText('Add track')).toBeInTheDocument();
      },
      { timeout: 10000 }
    );
  }, 15000);
});
