import { DeepPartial } from '@terra-ui-packages/core-utils';
import { act, fireEvent, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as clipboard from 'clipboard-polyfill/text';
import FileSaver from 'file-saver';
import { h } from 'react-hyperscript-helpers';
import { EntityQueryResponse, EntityQueryResultMetadata } from 'src/libs/ajax/data-table-providers/DataTableProvider';
import { Metrics, MetricsContract } from 'src/libs/ajax/Metrics';
import { WorkspaceContract, Workspaces, WorkspacesAjaxContract } from 'src/libs/ajax/workspaces/Workspaces';
import { asMockedFn, MockedFn, partial, renderWithAppContexts as render } from 'src/testing/test-utils';
import { defaultGoogleWorkspace } from 'src/testing/workspace-fixtures';

import EntitiesContent from './EntitiesContent';

jest.mock('src/libs/ajax/GoogleStorage');
jest.mock('src/libs/ajax/Metrics');
jest.mock('src/libs/ajax/workspaces/Workspaces');

type ReactNotificationsComponentExports = typeof import('react-notifications-component');
jest.mock('react-notifications-component', (): DeepPartial<ReactNotificationsComponentExports> => {
  return {
    Store: {
      addNotification: jest.fn(),
      removeNotification: jest.fn(),
    },
  };
});

type ReactVirtualizedExports = typeof import('react-virtualized');
jest.mock('react-virtualized', (): ReactVirtualizedExports => {
  const actual = jest.requireActual<ReactVirtualizedExports>('react-virtualized');

  const { AutoSizer } = actual;
  class MockAutoSizer extends AutoSizer {
    state = {
      height: 1000,
      width: 1000,
    };

    setState = () => {};
  }

  return {
    ...actual,
    AutoSizer: MockAutoSizer,
  };
});

type ClipboardPolyfillExports = typeof import('clipboard-polyfill/text');
jest.mock('clipboard-polyfill/text', (): ClipboardPolyfillExports => {
  const actual = jest.requireActual<ClipboardPolyfillExports>('clipboard-polyfill/text');
  return {
    ...actual,
    writeText: jest.fn().mockResolvedValue(undefined),
  };
});

type FileSaveExports = typeof import('file-saver');
jest.mock('file-saver', (): FileSaveExports => {
  const actual = jest.requireActual<FileSaveExports>('file-saver');
  return {
    ...actual,
    saveAs: jest.fn().mockResolvedValue(undefined),
  };
});

jest.mock('src/libs/ajax/GoogleStorage', () => ({
  GoogleStorage: jest.fn(() => ({
    listNotebooks: jest.fn().mockResolvedValue([]),
  })),
}));

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

describe('EntitiesContent', () => {
  it('copies to clipboard', async () => {
    // Arrange
    const user = userEvent.setup();

    const paginatedEntitiesOfType: MockedFn<WorkspaceContract['paginatedEntitiesOfType']> = jest.fn();
    paginatedEntitiesOfType.mockResolvedValue(
      partial<EntityQueryResponse>({
        results: [
          {
            entityType: 'sample',
            name: 'sample_1',
            attributes: {},
          },
        ],
        resultMetadata: partial<EntityQueryResultMetadata>({ filteredCount: 1, unfilteredCount: 1 }),
      })
    );
    asMockedFn(Workspaces).mockReturnValue(
      partial<WorkspacesAjaxContract>({
        workspace: () =>
          partial<WorkspaceContract>({
            paginatedEntitiesOfType,
          }),
      })
    );
    asMockedFn(Metrics).mockReturnValue(
      partial<MetricsContract>({
        captureEvent: async () => {},
      })
    );

    await act(async () => {
      render(
        h(EntitiesContent, {
          workspace: {
            ...defaultGoogleWorkspace,
            workspace: {
              ...defaultGoogleWorkspace.workspace,
              attributes: {},
            },
            workspaceSubmissionStats: {
              runningSubmissionsCount: 0,
            },
          },
          entityKey: 'sample',
          activeCrossTableTextFilter: '',
          entityMetadata: {
            sample: {
              idName: 'sample_id',
              attributeNames: [],
              count: 1,
            },
          },
          setEntityMetadata: () => {},
          loadMetadata: () => {},
          snapshotName: null,
          editable: false,
        })
      );
    });

    // Act

    // Select entity
    const checkbox = screen.getByRole('checkbox', { name: 'sample_1' });
    await user.click(checkbox);
    screen.getByText('1 row selected');

    // Copy to clipboard
    const exportButton = screen.getByText('Export');
    await user.click(exportButton);
    const copyMenuItem = screen.getByRole('menuitem', { name: 'Copy to clipboard' });
    const copyButton = within(copyMenuItem).getByRole('button');
    await user.click(copyButton);

    // Assert
    expect(clipboard.writeText).toHaveBeenCalledWith('entity:sample_id\nsample_1\n');
  });

  it('copies set table to clipboard', async () => {
    // Arrange
    const user = userEvent.setup();

    const paginatedEntitiesOfType: MockedFn<WorkspaceContract['paginatedEntitiesOfType']> = jest.fn();
    paginatedEntitiesOfType.mockResolvedValue(
      partial<EntityQueryResponse>({
        results: [
          {
            entityType: 'sample_set',
            name: 'sample_set_1',
            attributes: {
              samples: {
                itemsType: 'EntityReference',
                items: [
                  {
                    entityType: 'sample',
                    entityName: 'sample_1',
                  },
                  {
                    entityType: 'sample',
                    entityName: 'sample_2',
                  },
                ],
              },
            },
          },
        ],
        resultMetadata: partial<EntityQueryResultMetadata>({ filteredCount: 1, unfilteredCount: 1 }),
      })
    );

    asMockedFn(Workspaces).mockReturnValue(
      partial<WorkspacesAjaxContract>({
        workspace: () =>
          partial<WorkspaceContract>({
            paginatedEntitiesOfType,
          }),
      })
    );
    asMockedFn(Metrics).mockReturnValue(
      partial<MetricsContract>({
        captureEvent: async () => {},
      })
    );

    await act(async () => {
      render(
        h(EntitiesContent, {
          workspace: {
            ...defaultGoogleWorkspace,
            workspace: {
              ...defaultGoogleWorkspace.workspace,
              attributes: {},
            },
            workspaceSubmissionStats: {
              runningSubmissionsCount: 0,
            },
          },
          entityKey: 'sample_set',
          activeCrossTableTextFilter: '',
          entityMetadata: {
            sample_set: {
              idName: 'sample_set_id',
              attributeNames: ['samples'],
              count: 1,
            },
          },
          setEntityMetadata: () => {},
          loadMetadata: () => {},
          snapshotName: null,
          editable: false,
        })
      );
    });

    // Act

    // Select entity
    const checkbox = screen.getByRole('checkbox', { name: 'sample_set_1' });
    await user.click(checkbox);
    screen.getByText('1 row selected');

    // Copy to clipboard
    const exportButton = screen.getByText('Export');
    await user.click(exportButton);
    const copyMenuItem = screen.getByRole('menuitem', { name: 'Copy to clipboard' });
    const copyButton = within(copyMenuItem).getByRole('button');
    await user.click(copyButton);

    // Assert
    expect(clipboard.writeText).toHaveBeenCalledWith('entity:sample_set_id\nsample_set_1\n');
  });

  it('copies filtered table to clipboard', async () => {
    // Arrange
    const user = userEvent.setup();

    const paginatedEntitiesOfType: MockedFn<WorkspaceContract['paginatedEntitiesOfType']> = jest.fn();
    paginatedEntitiesOfType.mockResolvedValue(
      partial<EntityQueryResponse>({
        results: [
          {
            entityType: 'sample',
            name: 'sample_1',
            attributes: {},
          },
        ],
        resultMetadata: partial<EntityQueryResultMetadata>({ filteredCount: 1, unfilteredCount: 2 }),
      })
    );
    asMockedFn(Workspaces).mockReturnValue(
      partial<WorkspacesAjaxContract>({
        workspace: () =>
          partial<WorkspaceContract>({
            paginatedEntitiesOfType,
          }),
      })
    );
    asMockedFn(Metrics).mockReturnValue(
      partial<MetricsContract>({
        captureEvent: async () => {},
      })
    );

    await act(async () => {
      render(
        h(EntitiesContent, {
          workspace: {
            ...defaultGoogleWorkspace,
            workspace: {
              ...defaultGoogleWorkspace.workspace,
              attributes: {},
            },
            workspaceSubmissionStats: {
              runningSubmissionsCount: 0,
            },
          },
          entityKey: 'sample',
          activeCrossTableTextFilter: '',
          entityMetadata: {
            sample: {
              idName: 'sample_id',
              attributeNames: [],
              count: 2,
            },
          },
          setEntityMetadata: () => {},
          loadMetadata: () => {},
          snapshotName: null,
          editable: false,
        })
      );
    });

    // Act

    const columnMenu = screen.getByRole('button', { name: 'Column menu' });
    await user.click(columnMenu);

    // Filter
    fireEvent.change(screen.getByLabelText('Exact match filter'), { target: { value: 'even' } });

    const menuModal = screen.getByRole('dialog');
    const searchButton = within(menuModal).getByRole('button', { name: 'Search' });
    await user.click(searchButton);

    // Select filtered entity
    const checkbox = screen.getByRole('button', { name: '"Select All" options' });
    await user.click(checkbox);

    const pageButton = screen.getByRole('button', { name: 'Filtered (1)' });
    await user.click(pageButton);

    // Copy to clipboard
    const exportButton = screen.getByText('Export');
    await user.click(exportButton);
    const copyMenuItem = screen.getByRole('menuitem', { name: 'Copy to clipboard' });
    const copyButton = within(copyMenuItem).getByRole('button');
    await user.click(copyButton);

    // Assert
    expect(clipboard.writeText).toHaveBeenCalledWith('entity:sample_id\nsample_1\n');
  });

  it('downloads selection to tsv', async () => {
    // Arrange
    const user = userEvent.setup();

    const paginatedEntitiesOfType: MockedFn<WorkspaceContract['paginatedEntitiesOfType']> = jest.fn();
    paginatedEntitiesOfType.mockResolvedValue(
      partial<EntityQueryResponse>({
        results: [
          {
            entityType: 'sample',
            name: 'sample_1',
            attributes: {},
          },
        ],
        resultMetadata: partial<EntityQueryResultMetadata>({ filteredCount: 1, unfilteredCount: 1 }),
      })
    );
    asMockedFn(Workspaces).mockReturnValue(
      partial<WorkspacesAjaxContract>({
        workspace: () =>
          partial<WorkspaceContract>({
            paginatedEntitiesOfType,
          }),
      })
    );
    asMockedFn(Metrics).mockReturnValue(
      partial<MetricsContract>({
        captureEvent: async () => {},
      })
    );

    await act(async () => {
      render(
        h(EntitiesContent, {
          workspace: {
            ...defaultGoogleWorkspace,
            workspace: {
              ...defaultGoogleWorkspace.workspace,
              attributes: {},
            },
            workspaceSubmissionStats: {
              runningSubmissionsCount: 0,
            },
          },
          entityKey: 'sample',
          activeCrossTableTextFilter: '',
          entityMetadata: {
            sample: {
              idName: 'sample_id',
              attributeNames: [],
              count: 1,
            },
          },
          setEntityMetadata: () => {},
          loadMetadata: () => {},
          snapshotName: null,
          editable: false,
        })
      );
    });

    // Act

    // Select entity
    const checkbox = screen.getByRole('checkbox', { name: 'sample_1' });
    await user.click(checkbox);
    screen.getByText('1 row selected');

    // Download tsv
    const exportButton = screen.getByText('Export');
    await user.click(exportButton);
    const downloadMenuItem = screen.getByRole('menuitem', { name: 'Download as TSV' });
    const downloadButton = within(downloadMenuItem).getByRole('button');
    await user.click(downloadButton);

    // Assert
    expect(FileSaver.saveAs).toHaveBeenCalledWith(new Blob(['entity:sample_id\nsample_1\n']), 'sample.tsv');
  });

  it('downloads set table selection to tsv', async () => {
    // Arrange
    const user = userEvent.setup();

    const paginatedEntitiesOfType: MockedFn<WorkspaceContract['paginatedEntitiesOfType']> = jest.fn();
    paginatedEntitiesOfType.mockResolvedValue(
      partial<EntityQueryResponse>({
        results: [
          {
            entityType: 'sample_set',
            name: 'sample_set_1',
            attributes: {
              samples: {
                itemsType: 'EntityReference',
                items: [
                  {
                    entityType: 'sample',
                    entityName: 'sample_1',
                  },
                  {
                    entityType: 'sample',
                    entityName: 'sample_2',
                  },
                ],
              },
            },
          },
        ],
        resultMetadata: partial<EntityQueryResultMetadata>({ filteredCount: 1, unfilteredCount: 1 }),
      })
    );
    asMockedFn(Workspaces).mockReturnValue(
      partial<WorkspacesAjaxContract>({
        workspace: () =>
          partial<WorkspaceContract>({
            paginatedEntitiesOfType,
          }),
      })
    );
    asMockedFn(Metrics).mockReturnValue(
      partial<MetricsContract>({
        captureEvent: async () => {},
      })
    );

    await act(async () => {
      render(
        h(EntitiesContent, {
          workspace: {
            ...defaultGoogleWorkspace,
            workspace: {
              ...defaultGoogleWorkspace.workspace,
              attributes: {},
            },
            workspaceSubmissionStats: {
              runningSubmissionsCount: 0,
            },
          },
          entityKey: 'sample_set',
          activeCrossTableTextFilter: '',
          entityMetadata: {
            sample_set: {
              idName: 'sample_set_id',
              attributeNames: ['samples'],
              count: 1,
            },
          },
          setEntityMetadata: () => {},
          loadMetadata: () => {},
          snapshotName: null,
          editable: false,
        })
      );
    });

    // Act

    // Select entity
    const checkbox = screen.getByRole('checkbox', { name: 'sample_set_1' });
    await user.click(checkbox);
    screen.getByText('1 row selected');

    // Download tsv
    const exportButton = screen.getByText('Export');
    await user.click(exportButton);
    const downloadMenuItem = screen.getByRole('menuitem', { name: 'Download as TSV' });
    const downloadButton = within(downloadMenuItem).getByRole('button');
    await user.click(downloadButton);

    // Assert
    expect(FileSaver.saveAs).toHaveBeenCalledWith(
      new Blob(['membership:sample_set_id\\tsample\\nsample_set_1\\tsample_1\\nsample_set_1\\tsample_2']),
      'sample_set.zip'
    );
  });
});

describe('IGV & Workflow Icons and Tool Drawer', () => {
  const renderComponent = (props = {}) => {
    return render(
      h(EntitiesContent, {
        workspace: {
          ...defaultGoogleWorkspace,
          workspace: {
            attributes: {},
            ...defaultGoogleWorkspace.workspace,
          },
          workspaceSubmissionStats: {
            runningSubmissionsCount: 0,
          },
        },
        entityKey: 'sample',
        activeCrossTableTextFilter: '',
        entityMetadata: {
          sample: {
            idName: 'sample_id',
            attributeNames: [],
            count: 1,
          },
        },
        setEntityMetadata: jest.fn(),
        loadMetadata: jest.fn(),
        snapshotName: null,
        editable: true,
        ...props,
      })
    );
  };

  beforeEach(() => {
    const paginatedEntitiesOfType: MockedFn<WorkspaceContract['paginatedEntitiesOfType']> = jest.fn();
    paginatedEntitiesOfType.mockResolvedValue(
      partial<EntityQueryResponse>({
        results: [
          {
            entityType: 'sample',
            name: 'sample_1',
            attributes: {},
          },
        ],
        resultMetadata: partial<EntityQueryResultMetadata>({ filteredCount: 1, unfilteredCount: 1 }),
      })
    );

    asMockedFn(Workspaces).mockReturnValue(
      partial<WorkspacesAjaxContract>({
        workspace: () =>
          partial<WorkspaceContract>({
            paginatedEntitiesOfType,
            listMethodConfigs: jest.fn().mockResolvedValue([]),
          }),
      })
    );

    asMockedFn(Metrics).mockReturnValue(
      partial<MetricsContract>({
        captureEvent: async () => {},
      })
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders disabled workflow buttons when no entities selected', async () => {
    // Arrange & Act
    await act(async () => {
      renderComponent();
    });

    // Assert
    const workflowButton = screen.getByTestId('workflow-button');
    expect(workflowButton).toHaveAttribute('aria-disabled', 'true');
  });

  it('renders disabled IGV button when no entities selected and no sessions saved', async () => {
    // Arrange
    await act(async () => {
      renderComponent();
    });

    // Assert
    const igvButton = screen.getByTestId('igv-button');
    expect(igvButton).toHaveAttribute('aria-disabled', 'true');
  });

  it('renders enabled IGV button even when no entities selected', async () => {
    // Arrange
    const user = userEvent.setup();
    await act(async () => {
      renderComponent();
    });

    // Assert
    const igvButton = screen.getByTestId('igv-button');
    expect(igvButton).toHaveAttribute('aria-disabled', 'false');

    // Act
    await user.click(igvButton);

    // Assert
    const loadIGV = screen.getByText('Load IGV Session');
    expect(loadIGV).toHaveAttribute('aria-disabled', 'false');
    const openWithIGV = screen.getByText('Open with IGV');
    expect(openWithIGV).toHaveAttribute('aria-disabled', 'true');
  });

  it('hides icon buttons in snapshot mode', async () => {
    // Arrange & Act
    await act(async () => {
      renderComponent({ snapshotName: 'test-snapshot' });
    });

    // Assert
    expect(screen.queryByRole('img', { name: /igv-logo/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('img', { name: /wdl-logo/i })).not.toBeInTheDocument();
  });

  it('enables buttons/menu when entities are selected', async () => {
    // Arrange
    const user = userEvent.setup();

    await act(async () => {
      renderComponent();
    });

    // Act
    const checkbox = screen.getByRole('checkbox', { name: 'sample_1' });
    await user.click(checkbox);

    // Assert
    const igvButton = screen.getByTestId('igv-button');
    const workflowButton = screen.getByTestId('workflow-button');

    expect(workflowButton).not.toBeDisabled();
    await user.click(igvButton);

    const openWithIGV = screen.getByText('Open with IGV');
    expect(openWithIGV).not.toBeDisabled();
  });

  it('opens tool drawer with IGV mode when open with IGV selected', async () => {
    // Arrange
    const user = userEvent.setup();

    await act(async () => {
      renderComponent();
    });

    const checkbox = screen.getByRole('checkbox', { name: 'sample_1' });
    await user.click(checkbox);

    // Act
    const igvButton = screen.getByTestId('igv-button');
    await user.click(igvButton);
    const openWithIGV = screen.getByText('Open with IGV');
    await user.click(openWithIGV);

    // Assert
    expect(screen.getByText('IGV')).toBeInTheDocument();
  });

  it('opens IGV load session when selected', async () => {
    // Arrange
    const workspaceId = defaultGoogleWorkspace.workspace.workspaceId;
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
    const user = userEvent.setup();

    await act(async () => {
      renderComponent();
    });

    // Act
    const igvButton = screen.getByTestId('igv-button');
    expect(igvButton).toHaveAttribute('aria-disabled', 'false');
    await user.click(igvButton);
    const loadIGV = screen.getByText('Load IGV Session');
    await user.click(loadIGV);

    // Assert
    expect(screen.getByText('Select a session to load:')).toBeInTheDocument();
  });

  it('opens tool drawer with workflow mode when workflow button clicked', async () => {
    // Arrange
    const user = userEvent.setup();

    await act(async () => {
      renderComponent();
    });

    const checkbox = screen.getByRole('checkbox', { name: 'sample_1' });
    await user.click(checkbox);

    // Act
    const workflowButton = screen.getByTestId('workflow-button');
    await user.click(workflowButton);

    // Assert
    expect(screen.getByText('YOUR WORKFLOWS')).toBeInTheDocument();
  });
});
