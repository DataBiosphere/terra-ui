// test.js
import { act, fireEvent, waitFor } from '@testing-library/react';
import { h } from 'react-hyperscript-helpers';
import * as DataUtils from 'src/components/data/data-utils';
import IGVBrowser from 'src/components/IGVBrowser';
import { GoogleStorage } from 'src/libs/ajax/GoogleStorage';
import * as state from 'src/libs/state';
import * as Utils from 'src/libs/utils';
import { renderWithAppContexts as render } from 'src/testing/test-utils';

// --- Mocks ---
jest.mock('src/libs/ajax/GoogleStorage');
jest.mock('src/libs/state', () => ({
  configOverridesStore: { get: jest.fn(() => ({})) },
  requesterPaysProjectStore: { set: jest.fn() },
  knownBucketRequesterPaysStatuses: { get: jest.fn(() => ({ bucket: false })) },
  getTerraUser: jest.fn(() => 'mocked-user'),
}));
jest.mock('src/libs/utils', () => ({
  mergeQueryParams: jest.fn(),
  memoizeAsync: jest.fn((fn) => fn),
  maybeParseJSON: jest.fn((value) => JSON.parse(value)),
  cond: jest.fn((...args) => (...innerArgs) => {
    for (const [predicate, fn] of args) {
      if (predicate(...innerArgs)) return fn(...innerArgs);
    }
  }),
}));
jest.mock('src/libs/notifications');

// Track submission simulation
let submitTrack;

// Mock IGVAddTrackModal
jest.mock('src/components/IGVAddTrackModal', () => ({
  __esModule: true,
  default: ({ onSubmitTrack }) => {
    submitTrack = () =>
      onSubmitTrack({
        name: undefined,
        url: 'gs://bucket/test.bam',
        indexURL: 'gs://bucket/test.bai',
        isSignedUrl: false,
      });
    return null;
  },
}));

// Mock IGV library
jest.mock('igv', () => {
  const igv = {
    setGoogleOauthToken: jest.fn(),
    createBrowser: jest.fn(async () => ({
      loadTrack: jest.fn(),
    })),
    removeAllBrowsers: jest.fn(),
  };
  return { __esModule: true, default: igv, ...igv };
});

// Mock data-utils (keep real parseGsUri)
jest.mock('src/components/data/data-utils', () => {
  const actual = jest.requireActual('src/components/data/data-utils');
  return {
    ...actual,
    getUserProjectForWorkspace: jest.fn(),
  };
});

// ✅ Mock RequesterPaysModal to trigger onSuccess AFTER render without useEffect or inline require
jest.mock('src/workspaces/common/requester-pays/RequesterPaysModal', () => {
  const RequesterPaysModal = ({ onSuccess }) => {
    // Schedule after render to avoid "setState during render" warning.
    Promise.resolve().then(() => onSuccess('test-project'));
    return null;
  };
  return { __esModule: true, RequesterPaysModal };
});

afterEach(() => {
  jest.clearAllMocks();
});

describe('IGVBrowser', () => {
  const mockWorkspace = {
    workspace: { googleProject: 'test-project' },
  };

  const mockSelectedFiles = [
    {
      filePath: 'gs://bucket/test.bam',
      indexFilePath: 'gs://bucket/test.bai',
      isSignedUrl: false,
    },
  ];

  it('renders the component', async () => {
    // Arrange
    let utils;
    await act(async () => {
      utils = render(
        h(IGVBrowser, {
          selectedFiles: mockSelectedFiles,
          refGenome: { genome: 'hg38', reference: null },
          workspace: mockWorkspace,
          onDismiss: jest.fn(),
        })
      );
    });

    // Act
    const { getByText } = utils;

    // Assert
    expect(getByText('Back to data table')).toBeInTheDocument();
    expect(getByText('Add track')).toBeInTheDocument();
  });

  it('opens the requester pays modal when needed', async () => {
    // Arrange
    state.knownBucketRequesterPaysStatuses.get.mockReturnValue({ bucket: true });
    DataUtils.getUserProjectForWorkspace.mockResolvedValue(null);
    GoogleStorage.mockImplementation(() => ({
      getObject: jest.fn(async () => {
        const error = new Error('Requester pays error');
        Object.assign(error, { requesterPaysError: true });
        throw error;
      }),
    }));

    let utils;
    await act(async () => {
      utils = render(
        h(IGVBrowser, {
          selectedFiles: mockSelectedFiles,
          refGenome: { genome: 'hg38', reference: null },
          workspace: mockWorkspace,
          onDismiss: jest.fn(),
        })
      );
    });

    // Act
    const { getByText } = utils;

    // Assert
    await waitFor(() => {
      expect(state.requesterPaysProjectStore.set).toHaveBeenCalledTimes(1);
      expect(state.requesterPaysProjectStore.set).toHaveBeenCalledWith('test-project');
    });
    expect(getByText('Add track')).toBeInTheDocument();
  });

  it('adds tracks correctly', async () => {
    // Arrange
    state.knownBucketRequesterPaysStatuses.get.mockReturnValue({ bucket: true });
    DataUtils.getUserProjectForWorkspace.mockResolvedValue('test-project');
    Utils.mergeQueryParams.mockReturnValue('gs://bucket/test.bam?userProject=test-project');

    let utils;
    await act(async () => {
      utils = render(
        h(IGVBrowser, {
          selectedFiles: mockSelectedFiles,
          refGenome: { genome: 'hg38', reference: null },
          workspace: mockWorkspace,
          onDismiss: jest.fn(),
        })
      );
    });

    // Act
    const { getByText } = utils;

    // Assert (initial addTracks during mount)
    await waitFor(() => {
      expect(Utils.mergeQueryParams).toHaveBeenCalled();
    });

    // Act (open modal and submit track)
    await act(async () => {
      fireEvent.click(getByText('Add track'));
    });
    await act(async () => {
      submitTrack();
    });

    // Assert (mergeQueryParams called with userProject for RP bucket)
    await waitFor(() => {
      expect(Utils.mergeQueryParams).toHaveBeenCalledWith({ userProject: 'test-project' }, 'gs://bucket/test.bam');
    });
  });

  it('handles dismiss action', async () => {
    // Arrange
    const mockOnDismiss = jest.fn();

    let utils;
    await act(async () => {
      utils = render(
        h(IGVBrowser, {
          selectedFiles: mockSelectedFiles,
          refGenome: { genome: 'hg38', reference: null },
          workspace: mockWorkspace,
          onDismiss: mockOnDismiss,
        })
      );
    });

    // Act
    const { getByText } = utils;
    await act(async () => {
      fireEvent.click(getByText('Back to data table'));
    });

    // Assert
    expect(mockOnDismiss).toHaveBeenCalled();
  });
});
