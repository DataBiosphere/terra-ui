import { DeepPartial } from '@terra-ui-packages/core-utils';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { h } from 'react-hyperscript-helpers';
import { defaultGoogleWorkspace } from 'src/analysis/_testData/testData';
import DataTable from 'src/components/data/DataTable';
import { Ajax } from 'src/libs/ajax';
import { DataTableProvider } from 'src/libs/ajax/data-table-providers/DataTableProvider';
import { asMockedFn } from 'src/testing/test-utils';

type AjaxContract = ReturnType<typeof Ajax>;

jest.mock('src/libs/ajax');

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

const mockDataProvider: DeepPartial<DataTableProvider> = {
  getPage: jest.fn().mockResolvedValue({
    results: [
      {
        entityType: 'sample',
        name: 'sample_1',
        attributes: {},
      },
    ],
    resultMetadata: { filteredCount: 1, unfilteredCount: 1 },
  }),
  features: {
    supportsFiltering: true,
    supportsRowSelection: true,
  },
};

const EntitiesContentHarness = (props) => {
  const [selectedEntities, setSelectedEntities] = useState({});
  return h(DataTable, {
    ...props,
    selectionModel: {
      selected: selectedEntities,
      setSelected: setSelectedEntities,
    },
  });
};

describe('DataTable', () => {
  it('selects all', async () => {
    // Arrange
    const user = userEvent.setup();

    const paginatedEntitiesOfType = jest.fn().mockResolvedValue({
      results: [
        {
          entityType: 'sample',
          name: 'sample_1',
          attributes: {},
        },
      ],
      resultMetadata: { filteredCount: 1, unfilteredCount: 1 },
    });
    const mockAjax: DeepPartial<AjaxContract> = {
      Workspaces: {
        workspace: () => {
          return {
            paginatedEntitiesOfType,
          };
        },
      },
      Metrics: {
        captureEvent: () => {},
      },
    };
    asMockedFn(Ajax).mockImplementation(() => mockAjax as AjaxContract);

    await act(async () => {
      render(
        h(EntitiesContentHarness, {
          entityType: 'sample',
          entityMetadata: {
            sample: {
              idName: 'sample_id',
              attributeNames: [],
              count: 1,
            },
          },
          setEntityMetadata: () => {},
          workspaceId: defaultGoogleWorkspace.workspace.workspaceId,
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
          googleProject: defaultGoogleWorkspace.workspace.googleProject,
          workspaceId: {
            namespace: defaultGoogleWorkspace.workspace.namespace,
            name: defaultGoogleWorkspace.workspace.name,
          },
          onScroll: () => {},
          initialX: 0,
          initialY: 0,
          loadMetadata: () => {},
          childrenBefore: '',
          editable: '',
          activeCrossTableTextFilter: '',
          persist: '',
          refreshKey: 0,
          snapshotName: null,
          deleteColumnUpdateMetadata: () => {},
          controlPanelStyle: '',
          border: true,
          extraColumnActions: '',
          dataProvider: mockDataProvider,
        })
      );
    });

    // Act
    // screen.debug();

    // Select all entities
    const checkbox = screen.getByRole('checkbox', { name: 'Select all' });
    await user.click(checkbox);

    // Should include all rows + the 'Select all' check
    const allChecks = screen.getAllByRole('checkbox');
    // console.log(allChecks.length);
    // TODO: have more than one row and check length
    // Assert
    // They should all be checked
    allChecks.forEach((checkbox) => {
      expect(checkbox).toBeChecked();
    });

    // const exportButton = screen.getByText('Export');
    // await user.click(exportButton);
    // const copyMenuItem = screen.getByRole('menuitem', { name: 'Copy to clipboard' });
    // const copyButton = within(copyMenuItem).getByRole('button');
    // await user.click(copyButton);
    //
    // expect(clipboard.writeText).toHaveBeenCalledWith('entity:sample_id\nsample_1\n');
  });

  it('selects page', async () => {
    // Arrange
    const user = userEvent.setup();

    const paginatedEntitiesOfType = jest.fn().mockResolvedValue({
      results: [
        {
          entityType: 'sample',
          name: 'sample_1',
          attributes: {},
        },
      ],
      resultMetadata: { filteredCount: 1, unfilteredCount: 1 },
    });
    const mockAjax: DeepPartial<AjaxContract> = {
      Workspaces: {
        workspace: () => {
          return {
            paginatedEntitiesOfType,
          };
        },
      },
      Metrics: {
        captureEvent: () => {},
      },
    };
    asMockedFn(Ajax).mockImplementation(() => mockAjax as AjaxContract);

    await act(async () => {
      render(
        h(EntitiesContentHarness, {
          entityType: 'sample',
          entityMetadata: {
            sample: {
              idName: 'sample_id',
              attributeNames: [],
              count: 1,
            },
          },
          setEntityMetadata: () => {},
          workspaceId: defaultGoogleWorkspace.workspace.workspaceId,
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
          googleProject: defaultGoogleWorkspace.workspace.googleProject,
          workspaceId: {
            namespace: defaultGoogleWorkspace.workspace.namespace,
            name: defaultGoogleWorkspace.workspace.name,
          },
          onScroll: () => {},
          initialX: 0,
          initialY: 0,
          loadMetadata: () => {},
          childrenBefore: '',
          editable: '',
          activeCrossTableTextFilter: '',
          persist: '',
          refreshKey: 0,
          snapshotName: null,
          deleteColumnUpdateMetadata: () => {},
          controlPanelStyle: '',
          border: true,
          extraColumnActions: '',
          dataProvider: mockDataProvider,
        })
      );
    });

    // Act
    // screen.debug();

    // Select all entities
    const checkbox = screen.getByRole('checkbox', { name: 'Select all' });
    await user.click(checkbox);

    // Should include all rows + the 'Select all' check
    const allChecks = screen.getAllByRole('checkbox');
    // console.log(allChecks.length);
    // TODO: have more than one row and check length
    // Assert
    // They should all be checked
    allChecks.forEach((checkbox) => {
      expect(checkbox).toBeChecked();
    });

    // const exportButton = screen.getByText('Export');
    // await user.click(exportButton);
    // const copyMenuItem = screen.getByRole('menuitem', { name: 'Copy to clipboard' });
    // const copyButton = within(copyMenuItem).getByRole('button');
    // await user.click(copyButton);
    //
    // expect(clipboard.writeText).toHaveBeenCalledWith('entity:sample_id\nsample_1\n');
  });

  it('selects filtered', async () => {
    // Arrange
    const user = userEvent.setup();

    const paginatedEntitiesOfType = jest.fn().mockResolvedValue({
      results: [
        {
          entityType: 'sample',
          name: 'sample_1',
          attributes: {},
        },
      ],
      resultMetadata: { filteredCount: 1, unfilteredCount: 1 },
    });
    const mockAjax: DeepPartial<AjaxContract> = {
      Workspaces: {
        workspace: () => {
          return {
            paginatedEntitiesOfType,
          };
        },
      },
      Metrics: {
        captureEvent: () => {},
      },
    };
    asMockedFn(Ajax).mockImplementation(() => mockAjax as AjaxContract);

    await act(async () => {
      render(
        h(EntitiesContentHarness, {
          entityType: 'sample',
          entityMetadata: {
            sample: {
              idName: 'sample_id',
              attributeNames: [],
              count: 1,
            },
          },
          setEntityMetadata: () => {},
          workspaceId: defaultGoogleWorkspace.workspace.workspaceId,
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
          googleProject: defaultGoogleWorkspace.workspace.googleProject,
          workspaceId: {
            namespace: defaultGoogleWorkspace.workspace.namespace,
            name: defaultGoogleWorkspace.workspace.name,
          },
          onScroll: () => {},
          initialX: 0,
          initialY: 0,
          loadMetadata: () => {},
          childrenBefore: '',
          editable: '',
          activeCrossTableTextFilter: '',
          persist: '',
          refreshKey: 0,
          snapshotName: null,
          deleteColumnUpdateMetadata: () => {},
          controlPanelStyle: '',
          border: true,
          extraColumnActions: '',
          dataProvider: mockDataProvider,
        })
      );
    });

    // Act
    // screen.debug();

    // Select all entities
    const checkbox = screen.getByRole('checkbox', { name: 'Select all' });
    await user.click(checkbox);

    // Should include all rows + the 'Select all' check
    const allChecks = screen.getAllByRole('checkbox');
    // console.log(allChecks.length);
    // TODO: have more than one row and check length
    // Assert
    // They should all be checked
    allChecks.forEach((checkbox) => {
      expect(checkbox).toBeChecked();
    });

    // const exportButton = screen.getByText('Export');
    // await user.click(exportButton);
    // const copyMenuItem = screen.getByRole('menuitem', { name: 'Copy to clipboard' });
    // const copyButton = within(copyMenuItem).getByRole('button');
    // await user.click(copyButton);
    //
    // expect(clipboard.writeText).toHaveBeenCalledWith('entity:sample_id\nsample_1\n');
  });
});
