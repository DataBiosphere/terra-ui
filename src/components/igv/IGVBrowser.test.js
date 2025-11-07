import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as clipboard from 'clipboard-polyfill/text';
import { h } from 'react-hyperscript-helpers';
import * as DataUtils from 'src/components/data/data-utils';
import IGVBrowser from 'src/components/igv/IGVBrowser';
import { GoogleStorage } from 'src/libs/ajax/GoogleStorage';
import * as Notifications from 'src/libs/notifications';
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
jest.mock('src/libs/error', () => ({
  reportError: jest.fn(),
  withErrorReporting: jest.fn(() => (fn) => fn),
}));

// Track submission simulation
let submitTrack;

// Mock IGVAddTrackModal
jest.mock('src/components/igv/IGVAddTrackModal', () => ({
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

// Create shared mock functions that can be accessed throughout tests
const mockLoadTrack = jest.fn();
const mockToJSON = jest.fn(() =>
  Promise.resolve({
    genome: 'hg38',
    locus: 'chr1:1-1000',
    tracks: [],
  })
);
const mockLoadSession = jest.fn(() => Promise.resolve());
const mockCreateBrowser = jest.fn(async () => {
  const eventHandlers = {};
  return {
    loadTrack: mockLoadTrack,
    toJSON: mockToJSON,
    loadSession: mockLoadSession,
    on: jest.fn((event, handler) => {
      eventHandlers[event] = handler; // Store event handlers
    }),
    emit: jest.fn((event, ...args) => {
      if (eventHandlers[event]) {
        eventHandlers[event](...args); // Call the stored handler
      }
    }),
    trackViews: [
      {
        track: {
          type: 'variant',
          format: 'vcf',
          url: 'gs://bucket/test.vcf',
          getInViewFeatures: jest.fn(() => [{ info: { VT: 'SNP', AF: 0.5 } }]),
        },
      },
    ],
  };
});

// Mock IGV library
jest.mock('igv', () => {
  const igv = {
    setGoogleOauthToken: jest.fn(),
    createBrowser: mockCreateBrowser,
    removeAllBrowsers: jest.fn(),
  };
  return { __esModule: true, default: igv, ...igv };
});

jest.mock('clipboard-polyfill/text', () => ({
  writeText: jest.fn(),
}));

// Mock data-utils but keep real parseGsUri
jest.mock('src/components/data/data-utils', () => {
  const actual = jest.requireActual('src/components/data/data-utils');
  return {
    ...actual,
    getUserProjectForWorkspace: jest.fn(),
  };
});

// Mock RequesterPaysModal to trigger onSuccess AFTER render without useEffect or inline require
jest.mock('src/workspaces/common/requester-pays/RequesterPaysModal', () => {
  const RequesterPaysModal = ({ onSuccess }) => {
    // Schedule after render to avoid "setState during render" warning
    Promise.resolve().then(() => onSuccess('test-project'));
    return null;
  };
  return { __esModule: true, RequesterPaysModal };
});

const localStorageMock = (() => {
  let store = {};
  return {
    getItem: jest.fn((key) => store[key] || null),
    setItem: jest.fn((key, value) => {
      store[key] = value.toString();
    }),
    removeItem: jest.fn((key) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

afterEach(() => {
  jest.clearAllMocks();
});

const mockWorkspace = {
  workspace: { googleProject: 'test-project', workspaceId: 'test-workspace-id' },
};

const mockSelectedFiles = [
  {
    filePath: 'gs://bucket/test.bam',
    indexFilePath: 'gs://bucket/test.bai',
    isSignedUrl: false,
  },
];

describe('IGVBrowser', () => {
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

  it('transforms Google Storage URLs to Google Media API URLs', async () => {
    // Arrange
    const fakeBucketName = 'fc-2c0d2442-2a5a-1190-ae31-3575a55df9b4';
    const fakeSignedParams =
      'X-Goog-Algorithm=GOOG4-RSA-SHA256&X-Goog-Credential=placeholder-value&X-Goog-Date=20250829T141753Z&X-Goog-Expires=1234&X-Goog-SignedHeaders=host&requestedBy=me@example.com&userProject=gcp-project-name-1234&X-Goog-Signature=1234567890987654321';

    // Test files with Google Storage URLs
    const googleStorageFiles = [
      {
        filePath: `https://storage.googleapis.com/${fakeBucketName}/a_sub_dir/big/multipart/path/foobar.bazmoo.er.raw.g.vcf.gz?${fakeSignedParams}`,
        indexFilePath: `https://storage.googleapis.com/${fakeBucketName}/a_sub_dir/big/multipart/path/foobar.bazmoo.er.raw.g.vcf.gz.tbi?${fakeSignedParams}`,
        isSignedUrl: true,
      },
    ];

    state.knownBucketRequesterPaysStatuses.get.mockReturnValue({ [fakeBucketName]: false });
    Utils.mergeQueryParams.mockImplementation((_params, url) => url);

    // Act
    await act(async () => {
      render(
        h(IGVBrowser, {
          selectedFiles: googleStorageFiles,
          refGenome: { genome: 'hg38', reference: null },
          workspace: mockWorkspace,
          onDismiss: jest.fn(),
        })
      );
    });

    // Assert - Verify that Google Storage URLs were transformed to Media API URLs
    await waitFor(() => {
      expect(mockLoadTrack).toHaveBeenCalledWith({
        name: expect.stringContaining('foobar.bazmoo.er.raw.g.vcf.gz'),
        url: `https://storage.googleapis.com/storage/v1/b/${fakeBucketName}/o/a_sub_dir%2Fbig%2Fmultipart%2Fpath%2Ffoobar.bazmoo.er.raw.g.vcf.gz?${fakeSignedParams}&alt=media`,
        indexURL: `https://storage.googleapis.com/storage/v1/b/${fakeBucketName}/o/a_sub_dir%2Fbig%2Fmultipart%2Fpath%2Ffoobar.bazmoo.er.raw.g.vcf.gz.tbi?${fakeSignedParams}&alt=media`,
        visibilityWindow: 500000,
      });
    });
  });

  it('does not transform Google URLs that are not signed URLs', async () => {
    // This helps confirm that IGV works for non-DRS URIs

    // Arrange
    const fakeBucketName = 'test-bucket';

    // Test files with regular Google Storage URLs (not signed URLs)
    const googleStorageFiles = [
      {
        filePath: `gs://${fakeBucketName}/regular-file.bam`,
        indexFilePath: `gs://${fakeBucketName}/regular-file.bai`,
        isSignedUrl: false,
      },
    ];

    state.knownBucketRequesterPaysStatuses.get.mockReturnValue({ [fakeBucketName]: false });
    Utils.mergeQueryParams.mockImplementation((_params, url) => url);

    // Act
    await act(async () => {
      render(
        h(IGVBrowser, {
          selectedFiles: googleStorageFiles,
          refGenome: { genome: 'hg38', reference: null },
          workspace: mockWorkspace,
          onDismiss: jest.fn(),
        })
      );
    });

    // Assert - Verify that regular Google Storage URLs were NOT transformed to Media API URLs
    await waitFor(() => {
      expect(mockLoadTrack).toHaveBeenCalledWith({
        name: expect.stringContaining('regular-file.bam'),
        url: `gs://${fakeBucketName}/regular-file.bam`,
        indexURL: `gs://${fakeBucketName}/regular-file.bai`,
        visibilityWindow: 75000,
      });
    });
  });
});

describe('IGVBrowser Session Management', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.clear();
  });

  const mockSelectedFilesWithSignedUrl = [
    {
      filePath: 'gs://bucket/test.bam',
      indexFilePath: 'gs://bucket/test.bai',
      isSignedUrl: false,
    },
    {
      filePath: 'https://signed-url.com/file.vcf?signature=abc123',
      indexFilePath: 'https://signed-url.com/file.vcf.tbi?signature=abc123',
      isSignedUrl: true,
    },
  ];

  describe('Session Saving', () => {
    it('saves a session successfully', async () => {
      await act(async () => {
        render(
          h(IGVBrowser, {
            selectedFiles: mockSelectedFiles,
            refGenome: { genome: 'hg38', reference: null },
            workspace: mockWorkspace,
            onDismiss: jest.fn(),
          })
        );
      });

      const saveButton = screen.getByText('Save Session');
      fireEvent.click(saveButton);

      expect(screen.getByText('Save IGV Session')).toBeInTheDocument();

      // Enter session name
      const nameInput = screen.getByPlaceholderText('Session name...');
      await userEvent.type(nameInput, 'Test Session');

      // Click Save button in modal
      const modalSaveButton = screen.getByRole('button', { name: 'Save' });
      fireEvent.click(modalSaveButton);

      await waitFor(() => {
        // Check localStorage was called correctly
        expect(localStorageMock.setItem).toHaveBeenCalledWith(
          'igvSession-test-workspace-id-Test Session',
          expect.stringContaining('"name":"Test Session"')
        );
        expect(localStorageMock.setItem).toHaveBeenCalledWith('igv-session-list-test-workspace-id', expect.stringContaining('Test Session'));
      });

      // Modal should close
      await waitFor(() => {
        expect(screen.queryByText('Save IGV Session')).not.toBeInTheDocument();
      });
    });

    it('shows loading state while saving', async () => {
      // Make toJSON take some time
      mockToJSON.mockImplementation(() => {
        return new Promise((resolve) =>
          setTimeout(
            () =>
              resolve({
                genome: 'hg38',
                locus: 'chr1:1-1000',
                tracks: [],
              }),
            100
          )
        );
      });

      await act(async () => {
        render(
          h(IGVBrowser, {
            selectedFiles: mockSelectedFiles,
            refGenome: { genome: 'hg38', reference: null },
            workspace: mockWorkspace,
            onDismiss: jest.fn(),
          })
        );
      });

      const saveButton = screen.getByText('Save Session');
      fireEvent.click(saveButton);

      const nameInput = screen.getByPlaceholderText('Session name...');
      await userEvent.type(nameInput, 'Test Session');

      const modalSaveButton = screen.getByRole('button', { name: 'Save' });
      fireEvent.click(modalSaveButton);

      // Should show loading state
      expect(screen.getByText('Saving...')).toBeInTheDocument();
      expect(modalSaveButton).toHaveAttribute('disabled');

      await waitFor(() => {
        expect(screen.queryByText('Saving...')).not.toBeInTheDocument();
      });
    });

    it('prevents saving with empty session name', async () => {
      await act(async () => {
        render(
          h(IGVBrowser, {
            selectedFiles: mockSelectedFiles,
            refGenome: { genome: 'hg38', reference: null },
            workspace: mockWorkspace,
            onDismiss: jest.fn(),
          })
        );
      });

      const saveButton = screen.getByText('Save Session');
      fireEvent.click(saveButton);

      const modalSaveButton = screen.getByRole('button', { name: 'Save' });
      expect(modalSaveButton).toHaveAttribute('disabled');

      // Type and clear input
      const nameInput = screen.getByPlaceholderText('Session name...');
      await userEvent.type(nameInput, 'Test');
      expect(modalSaveButton).not.toHaveAttribute('disabled');

      await userEvent.clear(nameInput);
      expect(modalSaveButton).toHaveAttribute('disabled');
    });

    it('updates existing session when saving with same name', async () => {
      // Pre-populate localStorage with existing session
      const workspaceId = 'test-workspace-id';
      const existingSession = {
        name: 'Existing Session',
        timestamp: '2023-01-01T00:00:00.000Z',
        data: { genome: 'hg38' },
        workspace: workspaceId,
      };
      localStorageMock.setItem(`igvSession-${workspaceId}-Existing Session`, JSON.stringify(existingSession));
      localStorageMock.setItem(
        `igv-session-list-${workspaceId}`,
        JSON.stringify([{ name: 'Existing Session', timestamp: '2023-01-01T00:00:00.000Z' }])
      );
      await act(async () => {
        render(
          h(IGVBrowser, {
            selectedFiles: mockSelectedFiles,
            refGenome: { genome: 'hg38', reference: null },
            workspace: mockWorkspace,
            onDismiss: jest.fn(),
          })
        );
      });

      const saveButton = screen.getByText('Save Session');
      fireEvent.click(saveButton);

      const nameInput = screen.getByPlaceholderText('Session name...');
      await userEvent.type(nameInput, 'Existing Session');

      const modalSaveButton = screen.getByRole('button', { name: 'Save' });
      fireEvent.click(modalSaveButton);

      const overwriteButton = screen.getByRole('button', { name: 'Overwrite' });
      fireEvent.click(overwriteButton);

      await waitFor(() => {
        // Should update the existing session with new timestamp
        const savedData = JSON.parse(
          localStorageMock.setItem.mock.calls.findLast((call) => call[0] === `igvSession-${workspaceId}-Existing Session`)[1]
        );
        expect(savedData.timestamp).not.toBe('2023-01-01T00:00:00.000Z');
      });
    });

    it('isolates sessions by workspace', async () => {
      const workspace1Id = 'workspace-1';
      const workspace2Id = 'workspace-2';

      // Pre-populate with sessions from different workspaces
      localStorageMock.setItem(
        `igvSession-${workspace1Id}-Session A`,
        JSON.stringify({
          name: 'Session A',
          timestamp: '2023-01-01T00:00:00.000Z',
          data: { genome: 'hg38' },
          workspace: workspace1Id,
        })
      );
      localStorageMock.setItem(`igv-session-list-${workspace1Id}`, JSON.stringify([{ name: 'Session A', timestamp: '2023-01-01T00:00:00.000Z' }]));

      localStorageMock.setItem(
        `igvSession-${workspace2Id}-Session B`,
        JSON.stringify({
          name: 'Session B',
          timestamp: '2023-01-02T00:00:00.000Z',
          data: { genome: 'hg38' },
          workspace: workspace2Id,
        })
      );
      localStorageMock.setItem(`igv-session-list-${workspace2Id}`, JSON.stringify([{ name: 'Session B', timestamp: '2023-01-02T00:00:00.000Z' }]));

      // Render with workspace1
      await act(async () => {
        render(
          h(IGVBrowser, {
            selectedFiles: mockSelectedFiles,
            refGenome: { genome: 'hg38', reference: null },
            workspace: {
              workspace: {
                googleProject: 'test-project',
                workspaceId: workspace1Id,
              },
            },
            onDismiss: jest.fn(),
          })
        );
      });

      const loadButton = screen.getByText('Load Session');
      fireEvent.click(loadButton);

      // Should only see Session A, not Session B
      expect(screen.getByText('Session A')).toBeInTheDocument();
      expect(screen.queryByText('Session B')).not.toBeInTheDocument();
    });
  });

  describe('Session Loading', () => {
    beforeEach(() => {
      const workspaceId = 'test-workspace-id';
      // Pre-populate with saved sessions
      const sessions = [
        {
          name: 'Session 1',
          timestamp: '2023-01-01T00:00:00.000Z',
        },
        {
          name: 'Session 2',
          timestamp: '2023-01-02T00:00:00.000Z',
        },
      ];
      localStorageMock.setItem(`igv-session-list-${workspaceId}`, JSON.stringify(sessions));
      sessions.forEach((session) => {
        const sessionData = {
          name: session.name,
          timestamp: session.timestamp,
          data: {
            genome: 'hg38',
            locus: 'chr1:1000-2000',
            tracks: [],
          },
          workspace: 'test-workspace-id',
        };
        localStorageMock.setItem(`igvSession-${workspaceId}-${session.name}`, JSON.stringify(sessionData));
      });
    });
    it('loads saved sessions list', async () => {
      await act(async () => {
        render(
          h(IGVBrowser, {
            selectedFiles: mockSelectedFiles,
            refGenome: { genome: 'hg38', reference: null },
            workspace: mockWorkspace,
            onDismiss: jest.fn(),
          })
        );
      });
      const loadButton = screen.getByText('Load Session');
      fireEvent.click(loadButton);
      expect(screen.getByText('Load IGV Session')).toBeInTheDocument();
      expect(screen.getByText('Session 1')).toBeInTheDocument();
      expect(screen.getByText('Session 2')).toBeInTheDocument();
    });
    it('loads a session successfully', async () => {
      await act(async () => {
        render(
          h(IGVBrowser, {
            selectedFiles: mockSelectedFiles,
            refGenome: { genome: 'hg38', reference: null },
            workspace: mockWorkspace,
            onDismiss: jest.fn(),
          })
        );
      });
      const loadButton = screen.getByText('Load Session');
      fireEvent.click(loadButton);
      // Select a session
      const session1 = screen.getByText('Session 1');
      fireEvent.click(session1);
      // Load button should be enabled
      const modalLoadButton = screen.getByRole('button', { name: 'Load' });
      expect(modalLoadButton).not.toBeDisabled();
      fireEvent.click(modalLoadButton);
      await waitFor(() => {
        expect(mockLoadSession).toHaveBeenCalledWith({
          genome: 'hg38',
          locus: 'chr1:1000-2000',
          tracks: [],
        });
      });
      // Modal should close
      await waitFor(() => {
        expect(screen.queryByText('Load IGV Session')).not.toBeInTheDocument();
      });
    });
    it('shows loading state while loading session', async () => {
      mockLoadSession.mockImplementation(() => new Promise((resolve) => setTimeout(resolve, 100)));
      await act(async () => {
        render(
          h(IGVBrowser, {
            selectedFiles: mockSelectedFiles,
            refGenome: { genome: 'hg38', reference: null },
            workspace: mockWorkspace,
            onDismiss: jest.fn(),
          })
        );
      });
      const loadButton = screen.getByText('Load Session');
      fireEvent.click(loadButton);
      const session1 = screen.getByText('Session 1');
      fireEvent.click(session1);
      const modalLoadButton = screen.getByRole('button', { name: 'Load' });
      fireEvent.click(modalLoadButton);
      expect(screen.getByText('Loading...')).toBeInTheDocument();
      expect(modalLoadButton).toHaveAttribute('disabled');
      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
      });
    });
    it('requires session selection before loading', async () => {
      await act(async () => {
        render(
          h(IGVBrowser, {
            selectedFiles: mockSelectedFiles,
            refGenome: { genome: 'hg38', reference: null },
            workspace: mockWorkspace,
            onDismiss: jest.fn(),
          })
        );
      });
      const loadButton = screen.getByText('Load Session');
      fireEvent.click(loadButton);
      const modalLoadButton = screen.getByRole('button', { name: 'Load' });
      expect(modalLoadButton).toHaveAttribute('disabled');
      // Select a session
      const session1 = screen.getByText('Session 1');
      fireEvent.click(session1);
      expect(modalLoadButton).not.toHaveAttribute('disabled');
    });
  });

  it('shares a session successfully', async () => {
    // Arrange
    const mockNotify = Notifications.notify;

    // Mock the IGV browser's toJSON method
    mockToJSON.mockReturnValue({
      genome: 'hg38',
      locus: 'chr1:1000-2000',
      tracks: [],
    });

    await act(async () => {
      render(
        h(IGVBrowser, {
          selectedFiles: mockSelectedFiles,
          refGenome: { genome: 'hg38', reference: null },
          workspace: mockWorkspace,
          onDismiss: jest.fn(),
        })
      );
    });

    // Act
    const shareButton = screen.getByText('Share Session');
    fireEvent.click(shareButton);

    // Assert
    await waitFor(() => {
      // Verify clipboard write
      expect(clipboard.writeText).toHaveBeenCalledWith(expect.stringContaining('igvSession='));

      // Verify success notification
      expect(mockNotify).toHaveBeenCalledWith('success', 'Session URL copied to clipboard', { timeout: 3000 });
    });
  });

  it('disables save session button when signed URLs are present', async () => {
    await act(async () => {
      render(
        h(IGVBrowser, {
          selectedFiles: mockSelectedFilesWithSignedUrl,
          refGenome: { genome: 'hg38', reference: null },
          workspace: mockWorkspace,
          onDismiss: jest.fn(),
        })
      );
    });

    const saveButton = screen.getByText('Save Session');
    expect(saveButton).toHaveAttribute('disabled');
    // Hover over the button
    fireEvent.mouseEnter(saveButton);

    // Look for tooltip text in the document
    await waitFor(() => {
      const tooltipElements = screen.getAllByText('Cannot save session with signed URLs');
      expect(tooltipElements.length).toBeGreaterThan(0);
    });
  });

  it('disables share session button when signed URLs are present', async () => {
    await act(async () => {
      render(
        h(IGVBrowser, {
          selectedFiles: mockSelectedFilesWithSignedUrl,
          refGenome: { genome: 'hg38', reference: null },
          workspace: mockWorkspace,
          onDismiss: jest.fn(),
        })
      );
    });

    const shareButton = screen.getByText('Share Session');
    expect(shareButton).toHaveAttribute('disabled');
    // Hover over the button
    fireEvent.mouseEnter(shareButton);

    // Look for tooltip text in the document
    await waitFor(() => {
      const tooltipElements = screen.getAllByText('Cannot share session with signed URLs');
      expect(tooltipElements.length).toBeGreaterThan(0);
    });
  });

  it('still allows loading sessions when signed URLs are present', async () => {
    await act(async () => {
      render(
        h(IGVBrowser, {
          selectedFiles: mockSelectedFilesWithSignedUrl,
          refGenome: { genome: 'hg38', reference: null },
          workspace: mockWorkspace,
          onDismiss: jest.fn(),
        })
      );
    });

    const loadButton = screen.getByText('Load Session');
    expect(loadButton).not.toHaveAttribute('disabled');
  });

  it('prevents saving even when user tries to open modal with signed URLs', async () => {
    await act(async () => {
      render(
        h(IGVBrowser, {
          selectedFiles: mockSelectedFilesWithSignedUrl,
          refGenome: { genome: 'hg38', reference: null },
          workspace: mockWorkspace,
          onDismiss: jest.fn(),
        })
      );
    });

    const saveButton = screen.getByText('Save Session');

    // Button should be disabled, so clicking shouldn't open modal
    fireEvent.click(saveButton);

    // Modal should not appear
    expect(screen.queryByText('Save IGV Session')).not.toBeInTheDocument();
  });

  it('prevents sharing even when user tries to click disabled button', async () => {
    const mockNotify = Notifications.notify;

    await act(async () => {
      render(
        h(IGVBrowser, {
          selectedFiles: mockSelectedFilesWithSignedUrl,
          refGenome: { genome: 'hg38', reference: null },
          workspace: mockWorkspace,
          onDismiss: jest.fn(),
        })
      );
    });

    const shareButton = screen.getByText('Share Session');

    // Button should be disabled, so clicking shouldn't trigger sharing
    fireEvent.click(shareButton);

    // No clipboard write should occur
    expect(clipboard.writeText).not.toHaveBeenCalled();

    // No success notification should be shown
    expect(mockNotify).not.toHaveBeenCalledWith('success', 'Session URL copied to clipboard', expect.any(Object));
  });
});

describe('IGVBrowser Filter Panel', () => {
  const mockSelectedFilesWithVariants = [
    {
      filePath: 'gs://bucket/test.vcf.gz',
      indexFilePath: 'gs://bucket/test.vcf.gz.tbi',
      isSignedUrl: false,
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows filter variants button for VCF files', async () => {
    await act(async () => {
      render(
        h(IGVBrowser, {
          selectedFiles: mockSelectedFilesWithVariants,
          refGenome: { genome: 'hg38', reference: null },
          workspace: mockWorkspace,
          onDismiss: jest.fn(),
        })
      );
    });

    await waitFor(() => {
      expect(screen.getByText('Filter variants')).toBeInTheDocument();
    });
  });

  it('does not show filter variants button for non-VCF files', async () => {
    const nonVcfFiles = [
      {
        filePath: 'gs://bucket/test.bam',
        indexFilePath: 'gs://bucket/test.bai',
        isSignedUrl: false,
      },
    ];

    await act(async () => {
      render(
        h(IGVBrowser, {
          selectedFiles: nonVcfFiles,
          refGenome: { genome: 'hg38', reference: null },
          workspace: mockWorkspace,
          onDismiss: jest.fn(),
        })
      );
    });

    await waitFor(() => {
      expect(screen.queryByText('Filter variants')).not.toBeInTheDocument();
    });
  });

  it('calls onFilterPanelChange when filter panel is opened', async () => {
    const mockOnFilterPanelChange = jest.fn();

    await act(async () => {
      render(
        h(IGVBrowser, {
          selectedFiles: mockSelectedFilesWithVariants,
          refGenome: { genome: 'hg38', reference: null },
          workspace: mockWorkspace,
          onDismiss: jest.fn(),
          onFilterPanelChange: mockOnFilterPanelChange,
        })
      );
    });

    await waitFor(() => {
      expect(screen.getByText('Filter variants')).toBeInTheDocument();
    });

    const filterButton = screen.getByText('Filter variants');

    await act(async () => {
      fireEvent.click(filterButton);
    });

    await waitFor(() => {
      expect(mockOnFilterPanelChange).toHaveBeenCalledWith(
        expect.objectContaining({
          show: true,
          trackToFilter: expect.anything(),
          onFilterChange: expect.any(Function),
        })
      );
    });
  });

  it('reinitializes filter panel on locus change', async () => {
    const mockOnFilterPanelChange = jest.fn();

    await act(async () => {
      render(
        h(IGVBrowser, {
          selectedFiles: mockSelectedFilesWithVariants,
          refGenome: { genome: 'hg38', reference: null },
          workspace: mockWorkspace,
          onDismiss: jest.fn(),
          onFilterPanelChange: mockOnFilterPanelChange,
        })
      );
    });

    // Wait for IGV browser to be created
    await waitFor(() => {
      expect(mockCreateBrowser).toHaveBeenCalled();
    });

    // Retrieve the browser instance
    const igvBrowserInstance = await mockCreateBrowser.mock.results[0].value;

    // Extract the locuschange handler from the on.mock.calls
    const locusChangeCall = igvBrowserInstance.on.mock.calls.find(([event]) => event === 'locuschange');
    expect(locusChangeCall).toBeDefined();
    const handleLocusChange = locusChangeCall[1];

    // Open filter panel
    await act(async () => {
      fireEvent.click(screen.getByText('Filter variants'));
    });

    mockOnFilterPanelChange.mockClear();

    // Trigger locus change
    await act(async () => {
      handleLocusChange();
    });

    await waitFor(() => {
      expect(mockOnFilterPanelChange).toHaveBeenCalledWith(
        expect.objectContaining({
          isInitialized: false,
          isLoading: true,
        })
      );
    });
  });
});
