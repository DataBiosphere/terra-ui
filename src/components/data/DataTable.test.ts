import { DeepPartial } from '@terra-ui-packages/core-utils';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import _ from 'lodash/fp';
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

const entities = _.map(
  (n) => ({ entityType: 'sample', name: `sample_${n}`, attributes: { attr: n % 2 === 0 ? 'even' : 'odd' } }),
  _.range(0, 250)
);

type ReactVirtualizedExports = typeof import('react-virtualized');
jest.mock('react-virtualized', (): ReactVirtualizedExports => {
  const actual = jest.requireActual<ReactVirtualizedExports>('react-virtualized');

  const { AutoSizer } = actual;
  class MockAutoSizer extends AutoSizer {
    state = {
      height: 7000,
      width: 2000,
    };

    setState = () => {};
  }

  return {
    ...actual,
    AutoSizer: MockAutoSizer,
  };
});

const getPage = jest
  .fn()
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  .mockImplementation((signal, entityType, queryOptions: { pageNumber; columnFilter }, entityMetadata) => {
    if (queryOptions.columnFilter) {
      return Promise.resolve({
        results: _.filter((s: { attributes: { attr: string } }) => s.attributes.attr === 'even', entities),
        resultMetadata: { filteredCount: 125, unfilteredCount: 250, filteredPageCount: 2 },
      });
    }
    if (!queryOptions.pageNumber || queryOptions.pageNumber === 1) {
      return Promise.resolve({
        results: entities.slice(0, 100),
        resultMetadata: { filteredCount: 250, unfilteredCount: 250, filteredPageCount: 3 },
      });
    }
    if (queryOptions.pageNumber === 2) {
      return Promise.resolve({
        results: entities.slice(100, 200),
        resultMetadata: { filteredCount: 250, unfilteredCount: 250, filteredPageCount: 3 },
      });
    }
    return Promise.resolve({
      results: entities.slice(200),
      resultMetadata: { filteredCount: 250, unfilteredCount: 250, filteredPageCount: 3 },
    });
  });

const mockDataProvider: DeepPartial<DataTableProvider> = {
  getPage,
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

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const paginatedEntitiesOfType = jest.fn().mockImplementation((entityType, params) => {
  if (params.columnFilter) {
    return Promise.resolve({
      results: _.filter((s: { attributes: { attr: string } }) => s.attributes.attr === 'even', entities),
      resultMetadata: { filteredCount: 125, unfilteredCount: 250, filteredPageCount: 2 },
    });
  }
  return Promise.resolve({
    results: entities,
    resultMetadata: { filteredCount: 250, unfilteredCount: 250, filteredPageCount: 3 },
  });
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

describe('DataTable', () => {
  it('selects all', async () => {
    // Arrange
    const user = userEvent.setup();

    await act(async () => {
      render(
        h(EntitiesContentHarness, {
          entityType: 'sample',
          entityMetadata: {
            sample: {
              idName: 'sample_id',
              attributeNames: [],
              count: 250,
            },
          },
          setEntityMetadata: () => {},
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

    // Select all entities
    const button = screen.getByRole('button', { name: '"Select All" options' });
    await user.click(button);

    const pageButton = screen.getByRole('button', { name: 'All (250)' });
    await user.click(pageButton);

    // Assert

    // Should include all rows + the 'Select all' check
    const allChecks = screen.getAllByRole('checkbox', { checked: true });
    expect(allChecks.length).toEqual(101);

    // Go to next page
    const nextPageButton = screen.getByRole('button', { name: 'Next page' });
    await user.click(nextPageButton);

    // Get the checkboxes on this page
    const newPageChecks = screen.getAllByRole('checkbox', { checked: true });
    expect(newPageChecks.length).toEqual(101);
  });

  it('selects page', async () => {
    // Arrange
    const user = userEvent.setup();

    await act(async () => {
      render(
        h(EntitiesContentHarness, {
          entityType: 'sample',
          entityMetadata: {
            sample: {
              idName: 'sample_id',
              attributeNames: [],
              count: 250,
            },
          },
          setEntityMetadata: () => {},
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

    // Select page of entities
    const button = screen.getByRole('button', { name: '"Select All" options' });
    await user.click(button);

    const pageButton = screen.getByRole('button', { name: 'Page' });
    await user.click(pageButton);

    // Assert

    // Should include all rows + the 'Select all' check
    const allChecks = screen.getAllByRole('checkbox', { checked: true });
    expect(allChecks.length).toEqual(101);

    // Go to next page
    const nextPageButton = screen.getByRole('button', { name: 'Next page' });
    await user.click(nextPageButton);

    // Get the checkboxes on this page
    const newPageChecks = screen.getAllByRole('checkbox', { checked: false });
    expect(newPageChecks.length).toEqual(101);
  });

  it('passes filters to getPaginatedEntities', async () => {
    // Arrange
    const user = userEvent.setup();

    await act(async () => {
      render(
        h(EntitiesContentHarness, {
          entityType: 'sample',
          entityMetadata: {
            sample: {
              idName: 'sample_id',
              attributeNames: [],
              count: 250,
            },
          },
          setEntityMetadata: () => {},
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

    const columnMenu = screen.getByRole('button', { name: 'Column menu' });
    await user.click(columnMenu);

    // Filter
    fireEvent.change(screen.getByLabelText('Exact match filter'), { target: { value: 'even' } });

    const menuModal = screen.getByRole('dialog');
    const searchButton = within(menuModal).getByRole('button', { name: 'Search' });
    await user.click(searchButton);

    // Select filtered entities
    const checkbox = screen.getByRole('button', { name: '"Select All" options' });
    await user.click(checkbox);

    const pageButton = screen.getByRole('button', { name: 'Filtered (125)' });
    await user.click(pageButton);

    expect(paginatedEntitiesOfType).toHaveBeenCalledWith(
      'sample',
      expect.objectContaining({ columnFilter: 'sample_id=even' })
    );
  });

  it('selects filtered', async () => {
    // Arrange
    const user = userEvent.setup();

    await act(async () => {
      render(
        h(EntitiesContentHarness, {
          entityType: 'sample',
          entityMetadata: {
            sample: {
              idName: 'sample_id',
              attributeNames: [],
              count: 250,
            },
          },
          setEntityMetadata: () => {},
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

    const columnMenu = screen.getByRole('button', { name: 'Column menu' });
    await user.click(columnMenu);

    // Filter
    fireEvent.change(screen.getByLabelText('Exact match filter'), { target: { value: 'even' } });

    const menuModal = screen.getByRole('dialog');
    const searchButton = within(menuModal).getByRole('button', { name: 'Search' });
    await user.click(searchButton);

    // Select filtered entities
    const checkbox = screen.getByRole('button', { name: '"Select All" options' });
    await user.click(checkbox);

    const pageButton = screen.getByRole('button', { name: 'Filtered (125)' });
    await user.click(pageButton);

    // Should include all (filtered) entities + select all checkbox
    const allChecks = screen.getAllByRole('checkbox', { checked: true });
    expect(allChecks.length).toEqual(126);
  });
});
