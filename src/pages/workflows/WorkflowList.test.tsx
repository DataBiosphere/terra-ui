import { DeepPartial, delay } from '@terra-ui-packages/core-utils';
import { act, fireEvent, screen, within } from '@testing-library/react';
import userEvent, { UserEvent } from '@testing-library/user-event';
import _ from 'lodash/fp';
import React from 'react';
import { Ajax, AjaxContract } from 'src/libs/ajax';
import { MethodsAjaxContract } from 'src/libs/ajax/methods/Methods';
import * as Nav from 'src/libs/nav';
import { getLink } from 'src/libs/nav';
import { notify } from 'src/libs/notifications';
import { TerraUser, TerraUserState, userStore } from 'src/libs/state';
import { MethodDefinition } from 'src/pages/workflows/workflow-utils';
import { WorkflowList } from 'src/pages/workflows/WorkflowList';
import { asMockedFn, renderWithAppContexts as render } from 'src/testing/test-utils';

jest.mock('src/libs/ajax');
jest.mock('src/libs/notifications');
jest.mock('src/libs/nav', () => ({
  ...jest.requireActual('src/libs/nav'),
  getLink: jest.fn(() => '#workflows'),
  goToPath: jest.fn(),
}));

// Space for tables is rendered based on the available space. In unit tests, there is no available space, and so we must mock out the space needed to get the data table to render.
jest.mock('react-virtualized', () => {
  const actual = jest.requireActual('react-virtualized');

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

const mockMethods = (methods: MethodDefinition[]): Partial<MethodsAjaxContract> => {
  return {
    definitions: jest.fn(() => Promise.resolve(methods)),
  };
};

const mockAjax = (methods: MethodDefinition[]): Partial<AjaxContract> => {
  return { Methods: mockMethods(methods) as MethodsAjaxContract };
};

const mockUser = (email: string): Partial<TerraUser> => ({ email });

const mockUserState = (email: string): Partial<TerraUserState> => {
  return { terraUser: mockUser(email) as TerraUser };
};

const darukMethod: MethodDefinition = {
  namespace: 'daruk rock namespace',
  name: 'daruk method',
  synopsis: 'daruk description',
  managers: ['daruk@protection.com', 'yunobo@goron.com'],
  public: true,
  numConfigurations: 11,
  numSnapshots: 11,
  entityType: 'Workflow',
};

const revaliMethod: MethodDefinition = {
  namespace: 'revali bird namespace',
  name: 'revali method',
  synopsis: 'revali description',
  managers: ['revali@gale.com'],
  public: true,
  numConfigurations: 10,
  numSnapshots: 2,
  entityType: 'Workflow',
};

const revaliMethod2: MethodDefinition = {
  namespace: 'revali bird namespace',
  name: 'revali method 2',
  synopsis: 'another revali description',
  managers: ['revali@gale.com', 'revali@champions.com'],
  public: true,
  numConfigurations: 2,
  numSnapshots: 1,
  entityType: 'Workflow',
};

const sortingMethod: MethodDefinition = {
  namespace: 'a namespace',
  name: 'sorting method',
  synopsis: 'great synopsis',
  managers: ['anemail@email.com'],
  public: true,
  numConfigurations: 1,
  numSnapshots: 10,
  entityType: 'Workflow',
};

const noSpacesMethod: MethodDefinition = {
  namespace: 'test-namespace',
  name: 'method-name',
  synopsis: 'synopsis',
  managers: ['email@email.com'],
  public: true,
  numConfigurations: 1,
  numSnapshots: 2,
  entityType: 'Workflow',
};

const revaliPrivateMethod: MethodDefinition = {
  namespace: 'revali private bird namespace',
  name: 'revali private method',
  synopsis: 'revali private description',
  managers: ['revali@gale.com'],
  public: false,
  numConfigurations: 1,
  numSnapshots: 4,
  entityType: 'Workflow',
};

const ganonPrivateMethod: MethodDefinition = {
  namespace: 'ganon private evil namespace',
  name: 'ganon private method',
  synopsis: 'ganon private description',
  managers: ['ganon@ganon.com'],
  public: false,
  numConfigurations: 1,
  numSnapshots: 5,
  entityType: 'Workflow',
};

const paginationMethods: MethodDefinition[] = _.flatMap(
  (suffix: string) => {
    return [
      {
        namespace: 'test namespace',
        name: `method ${suffix}`,
        synopsis: 'test synopsis',
        managers: ['test@test.com'],
        public: true,
        numConfigurations: 0,
        numSnapshots: 1,
        entityType: 'Workflow',
      },
      {
        namespace: 'test namespace',
        name: `method ${suffix}`,
        synopsis: 'test synopsis',
        managers: ['me@me.com'],
        public: false,
        numConfigurations: 0,
        numSnapshots: 1,
        entityType: 'Workflow',
      },
    ];
  },
  ['az', 'bz', 'cz', 'dz', 'ez', 'fz', 'gz', 'hz', 'iz', 'jz', 'kz', 'lz', 'm']
);

// Note: For these test cases, the user is assumed to be Revali
const tabMethodCountsTestCases: { methods: MethodDefinition[]; myMethodsCount: number; publicMethodsCount: number }[] =
  [
    { methods: [], myMethodsCount: 0, publicMethodsCount: 0 },
    { methods: [revaliPrivateMethod], myMethodsCount: 1, publicMethodsCount: 0 },
    { methods: [revaliMethod], myMethodsCount: 1, publicMethodsCount: 1 },
    { methods: [revaliMethod, darukMethod, revaliMethod2], myMethodsCount: 2, publicMethodsCount: 3 },
    {
      methods: [revaliMethod, darukMethod, revaliMethod2, revaliPrivateMethod],
      myMethodsCount: 3,
      publicMethodsCount: 3,
    },
  ];

describe('workflows table', () => {
  it('renders the search bar and tabs', async () => {
    // Arrange
    asMockedFn(Ajax).mockImplementation(() => mockAjax([]) as AjaxContract);

    // Act
    await act(async () => {
      render(<WorkflowList />);
    });

    // Assert
    expect(screen.getByPlaceholderText('SEARCH WORKFLOWS')).toBeInTheDocument();
    expect(screen.getByText('My Workflows (0)')).toBeInTheDocument();
    expect(screen.getByText('Public Workflows (0)')).toBeInTheDocument();

    expect(screen.queryByText('Featured Workflows')).not.toBeInTheDocument();
  });

  it('renders the workflows table with method information', async () => {
    // Arrange
    asMockedFn(Ajax).mockImplementation(() => mockAjax([revaliMethod2]) as AjaxContract);

    // Act
    await act(async () => {
      render(<WorkflowList queryParams={{ tab: 'public' }} />);
    });

    const table: HTMLElement = await screen.findByRole('table');

    // Assert
    expect(table).toHaveAttribute('aria-colcount', '4');
    expect(table).toHaveAttribute('aria-rowcount', '2');

    const headers: HTMLElement[] = within(table).getAllByRole('columnheader');
    expect(headers).toHaveLength(4);
    expect(headers[0]).toHaveTextContent('Workflow');
    expect(headers[1]).toHaveTextContent('Synopsis');
    expect(headers[2]).toHaveTextContent('Owners');
    expect(headers[3]).toHaveTextContent('Snapshots');

    const rows: HTMLElement[] = within(table).getAllByRole('row');
    expect(rows).toHaveLength(2);

    const methodCells: HTMLElement[] = within(rows[1]).getAllByRole('cell');
    expect(methodCells).toHaveLength(4);
    within(methodCells[0]).getByText('revali bird namespace');
    within(methodCells[0]).getByText('revali method 2');
    expect(methodCells[1]).toHaveTextContent('another revali description');
    expect(methodCells[2]).toHaveTextContent('revali@gale.com, revali@champions.com');
    expect(methodCells[3]).toHaveTextContent('1');
  });

  it('displays a message with no my workflows', async () => {
    // Arrange
    asMockedFn(Ajax).mockImplementation(() => mockAjax([darukMethod]) as AjaxContract);

    // set the user's email
    jest.spyOn(userStore, 'get').mockImplementation(jest.fn().mockReturnValue(mockUserState('revali@gale.com')));

    // Act
    await act(async () => {
      render(<WorkflowList />);
    });

    // Assert
    expect(screen.getByText('Nothing to display')).toBeInTheDocument();
    expect(screen.queryByText('daruk method')).not.toBeInTheDocument();
  });

  it('displays only my workflows in the my workflows tab', async () => {
    // Arrange
    asMockedFn(Ajax).mockImplementation(
      () => mockAjax([darukMethod, revaliMethod, revaliPrivateMethod]) as AjaxContract
    );

    // set the user's email
    jest.spyOn(userStore, 'get').mockImplementation(jest.fn().mockReturnValue(mockUserState('revali@gale.com')));

    // Act
    await act(async () => {
      render(<WorkflowList />);
    });

    // Assert
    expect(screen.queryByText('Nothing to display')).not.toBeInTheDocument();
    expect(screen.queryByText('daruk method')).not.toBeInTheDocument();
    expect(screen.getByText('revali method')).toBeInTheDocument();
    expect(screen.getByText('revali private method')).toBeInTheDocument();
  });

  it('displays a message with no public workflows', async () => {
    // Arrange
    asMockedFn(Ajax).mockImplementation(() => mockAjax([ganonPrivateMethod]) as AjaxContract);

    // set the user's email
    jest.spyOn(userStore, 'get').mockImplementation(jest.fn().mockReturnValue(mockUserState('ganon@ganon.com')));

    // Act
    await act(async () => {
      render(<WorkflowList queryParams={{ tab: 'public' }} />);
    });

    // Assert
    expect(screen.getByText('Nothing to display')).toBeInTheDocument();
    expect(screen.queryByText('ganon private method')).not.toBeInTheDocument();
  });

  it('displays only public workflows in the public workflows tab', async () => {
    // Arrange
    asMockedFn(Ajax).mockImplementation(
      () => mockAjax([darukMethod, revaliMethod, ganonPrivateMethod]) as AjaxContract
    );

    // set the user's email
    jest.spyOn(userStore, 'get').mockImplementation(jest.fn().mockReturnValue(mockUserState('ganon@ganon.com')));

    // Act
    await act(async () => {
      render(<WorkflowList queryParams={{ tab: 'public' }} />);
    });

    // Assert
    expect(screen.queryByText('Nothing to display')).not.toBeInTheDocument();
    expect(screen.queryByText('ganon private method')).not.toBeInTheDocument();
    expect(screen.getByText('daruk method')).toBeInTheDocument();
    expect(screen.getByText('revali method')).toBeInTheDocument();
  });

  it.each(tabMethodCountsTestCases)(
    'provides accurate method counts in the tab display names',
    async ({ methods, myMethodsCount, publicMethodsCount }) => {
      // Arrange
      asMockedFn(Ajax).mockImplementation(() => mockAjax(methods) as AjaxContract);

      // set the user's email
      jest.spyOn(userStore, 'get').mockImplementation(jest.fn().mockReturnValue(mockUserState('revali@gale.com')));

      // Act
      await act(async () => {
        render(<WorkflowList />);
      });

      // Assert
      expect(screen.getByText(`My Workflows (${myMethodsCount})`)).toBeInTheDocument();
      expect(screen.getByText(`Public Workflows (${publicMethodsCount})`)).toBeInTheDocument();
    }
  );

  it("updates only the current tab's method count based on the filter", async () => {
    // Arrange
    asMockedFn(Ajax).mockImplementation(
      () => mockAjax([revaliMethod, darukMethod, revaliMethod2, revaliPrivateMethod]) as AjaxContract
    );

    // set the user's email
    jest.spyOn(userStore, 'get').mockImplementation(jest.fn().mockReturnValue(mockUserState('revali@gale.com')));

    // Act
    await act(async () => {
      render(<WorkflowList queryParams={{ filter: '2' }} />);
    });

    // Assert

    // currently selected tab - count based on filter
    expect(screen.getByText('My Workflows (1)')).toBeInTheDocument();

    // other tab - count not based on filter
    expect(screen.getByText('Public Workflows (3)')).toBeInTheDocument();
  });

  it('filters workflows by namespace', async () => {
    // Arrange
    asMockedFn(Ajax).mockImplementation(() => mockAjax([darukMethod, revaliMethod]) as AjaxContract);

    // Act
    await act(async () => {
      render(<WorkflowList queryParams={{ tab: 'public', filter: 'rock' }} />);
    });

    // Assert
    expect(screen.queryByText('Nothing to display')).not.toBeInTheDocument();
    expect(screen.getByText('daruk method')).toBeInTheDocument();
    expect(screen.queryByText('revali method')).not.toBeInTheDocument();
  });

  it('filters workflows by name', async () => {
    // Arrange
    asMockedFn(Ajax).mockImplementation(() => mockAjax([darukMethod, revaliMethod, revaliMethod2]) as AjaxContract);

    // Act
    await act(async () => {
      render(<WorkflowList queryParams={{ tab: 'public', filter: 'revali method' }} />);
    });

    // Assert
    expect(screen.queryByText('Nothing to display')).not.toBeInTheDocument();
    expect(screen.queryByText('daruk method')).not.toBeInTheDocument();
    expect(screen.getByText('revali method')).toBeInTheDocument();
    expect(screen.getByText('revali method 2')).toBeInTheDocument();
  });

  it('filters workflows by namespace and name simultaneously', async () => {
    // Arrange
    asMockedFn(Ajax).mockImplementation(() => mockAjax([darukMethod, revaliMethod, revaliMethod2]) as AjaxContract);

    // Act
    await act(async () => {
      render(<WorkflowList queryParams={{ tab: 'public', filter: 'revali bird namespace/revali method' }} />);
    });

    // Assert
    expect(screen.queryByText('Nothing to display')).not.toBeInTheDocument();
    expect(screen.queryByText('daruk method')).not.toBeInTheDocument();
    expect(screen.getByText('revali method')).toBeInTheDocument();
    expect(screen.getByText('revali method 2')).toBeInTheDocument();
  });

  it('updates the query parameters when you click a tab', async () => {
    // Arrange
    asMockedFn(Ajax).mockImplementation(() => mockAjax([darukMethod, revaliMethod]) as AjaxContract);

    // set the user's email to ensure there are no my workflows
    jest.spyOn(userStore, 'get').mockImplementation(jest.fn().mockReturnValue(mockUserState('test@test.com')));

    // should be called to switch tabs
    const navHistoryReplace = jest.spyOn(Nav.history, 'replace');

    const user: UserEvent = userEvent.setup();

    // Act
    await act(async () => {
      render(<WorkflowList queryParams={{ filter: 'test' }} />);
    });

    await user.click(screen.getByText('Public Workflows (2)'));
    await user.click(screen.getByText('My Workflows (0)'));

    // Assert
    expect(navHistoryReplace).toHaveBeenCalledTimes(2);

    // clicking a tab clears the search filter
    expect(navHistoryReplace).toHaveBeenCalledWith({ search: '?tab=public' });
  });

  it('updates the query parameters when you type in the search bar', async () => {
    // Arrange
    asMockedFn(Ajax).mockImplementation(() => mockAjax([darukMethod, revaliMethod]) as AjaxContract);

    // should be called after the user types in the search bar
    const navHistoryReplace = jest.spyOn(Nav.history, 'replace');

    // Act
    await act(async () => {
      render(<WorkflowList />);
    });

    fireEvent.change(screen.getByPlaceholderText('SEARCH WORKFLOWS'), { target: { value: 'mysearch' } });
    await act(() => delay(300)); // debounced search

    // Assert
    expect(navHistoryReplace).toHaveBeenCalledTimes(1);
    expect(navHistoryReplace).toHaveBeenCalledWith({ search: '?filter=mysearch' });
  });

  it('displays the search filter in the search bar', async () => {
    // Arrange
    asMockedFn(Ajax).mockImplementation(() => mockAjax([darukMethod]) as AjaxContract);

    // Act
    await act(async () => {
      render(<WorkflowList queryParams={{ filter: 'testfilter' }} />);
    });

    // Assert
    expect(screen.getByRole('searchbox')).toHaveProperty('value', 'testfilter');
  });

  it('sorts by workflow ascending by default', async () => {
    // Arrange
    asMockedFn(Ajax).mockImplementation(
      () => mockAjax([sortingMethod, darukMethod, revaliMethod, revaliMethod2]) as AjaxContract
    );

    // Act
    await act(async () => {
      render(<WorkflowList queryParams={{ tab: 'public' }} />);
    });

    // Assert
    checkOrder('daruk method', 'revali method', 'revali method 2', 'sorting method');
  });

  it('sorts by workflow descending', async () => {
    // Arrange
    asMockedFn(Ajax).mockImplementation(
      () => mockAjax([sortingMethod, darukMethod, revaliMethod, revaliMethod2]) as AjaxContract
    );

    const user: UserEvent = userEvent.setup();

    // Act
    await act(async () => {
      render(<WorkflowList queryParams={{ tab: 'public' }} />);
    });

    await user.click(screen.getByText('Workflow'));

    // Assert
    checkOrder('sorting method', 'revali method 2', 'revali method', 'daruk method');
  });

  it('sorts by synopsis ascending', async () => {
    // Arrange
    asMockedFn(Ajax).mockImplementation(
      () => mockAjax([sortingMethod, darukMethod, revaliMethod, revaliMethod2]) as AjaxContract
    );

    const user: UserEvent = userEvent.setup();

    // Act
    await act(async () => {
      render(<WorkflowList queryParams={{ tab: 'public' }} />);
    });

    await user.click(screen.getByText('Synopsis'));

    // Assert
    checkOrder('revali method 2', 'daruk method', 'sorting method', 'revali method');
  });

  it('sorts by synopsis descending', async () => {
    // Arrange
    asMockedFn(Ajax).mockImplementation(
      () => mockAjax([sortingMethod, darukMethod, revaliMethod, revaliMethod2]) as AjaxContract
    );

    const user: UserEvent = userEvent.setup();

    // Act
    await act(async () => {
      render(<WorkflowList queryParams={{ tab: 'public' }} />);
    });

    await user.click(screen.getByText('Synopsis'));
    await user.click(screen.getByText('Synopsis'));

    // Assert
    checkOrder('revali method', 'sorting method', 'daruk method', 'revali method 2');
  });

  it('sorts by owners ascending', async () => {
    // Arrange
    asMockedFn(Ajax).mockImplementation(
      () => mockAjax([sortingMethod, darukMethod, revaliMethod, revaliMethod2]) as AjaxContract
    );

    const user: UserEvent = userEvent.setup();

    // Act
    await act(async () => {
      render(<WorkflowList queryParams={{ tab: 'public' }} />);
    });

    await user.click(screen.getByText('Owners'));

    // Assert
    checkOrder('sorting method', 'daruk method', 'revali method', 'revali method 2');
  });

  it('sorts by owners descending', async () => {
    // Arrange
    asMockedFn(Ajax).mockImplementation(
      () => mockAjax([sortingMethod, darukMethod, revaliMethod, revaliMethod2]) as AjaxContract
    );

    const user: UserEvent = userEvent.setup();

    // Act
    await act(async () => {
      render(<WorkflowList queryParams={{ tab: 'public' }} />);
    });

    await user.click(screen.getByText('Owners'));
    await user.click(screen.getByText('Owners'));

    // Assert
    checkOrder('revali method 2', 'revali method', 'daruk method', 'sorting method');
  });

  it('sorts by snapshots ascending', async () => {
    // Arrange
    asMockedFn(Ajax).mockImplementation(
      () => mockAjax([sortingMethod, darukMethod, revaliMethod, revaliMethod2]) as AjaxContract
    );

    const user: UserEvent = userEvent.setup();

    // Act
    await act(async () => {
      render(<WorkflowList queryParams={{ tab: 'public' }} />);
    });

    await user.click(screen.getByText('Snapshots'));

    // Assert
    checkOrder('revali method 2', 'revali method', 'sorting method', 'daruk method');
  });

  it('sorts by snapshots descending', async () => {
    // Arrange
    asMockedFn(Ajax).mockImplementation(
      () => mockAjax([sortingMethod, darukMethod, revaliMethod, revaliMethod2]) as AjaxContract
    );

    const user: UserEvent = userEvent.setup();

    // Act
    await act(async () => {
      render(<WorkflowList queryParams={{ tab: 'public' }} />);
    });

    await user.click(screen.getByText('Snapshots'));
    await user.click(screen.getByText('Snapshots'));

    // Assert
    checkOrder('daruk method', 'sorting method', 'revali method', 'revali method 2');
  });

  it('displays a paginator with at least one displayed workflow', async () => {
    // Arrange
    asMockedFn(Ajax).mockImplementation(() => mockAjax([darukMethod]) as AjaxContract);

    // Act
    await act(async () => {
      render(<WorkflowList queryParams={{ tab: 'public' }} />);
    });

    // Assert
    expect(screen.getByLabelText('Items per page:')).toBeInTheDocument();
  });

  it('correctly uses the paginator to paginate workflows', async () => {
    // Arrange
    asMockedFn(Ajax).mockImplementation(() => mockAjax(paginationMethods) as AjaxContract);

    const user: UserEvent = userEvent.setup();

    // set the user's email
    jest.spyOn(userStore, 'get').mockImplementation(jest.fn().mockReturnValue(mockUserState('me@me.com')));

    // Act
    await act(async () => {
      render(<WorkflowList queryParams={{ tab: 'public', filter: 'z' }} />);
    });

    await user.selectOptions(screen.getByRole('combobox', { name: /items per page:/i }), '10');

    // Assert
    expect(screen.getByText('1 - 10 of 12 (filtered from 13 total)')).toBeInTheDocument();
    expect(screen.getByText('method az')).toBeInTheDocument();
    expect(screen.getByText('method jz')).toBeInTheDocument();
    expect(screen.queryByText('method kz')).not.toBeInTheDocument();

    // Act
    await user.click(screen.getByRole('button', { name: /next page/i }));

    // Assert
    expect(screen.getByText('11 - 12 of 12 (filtered from 13 total)')).toBeInTheDocument();
    expect(screen.queryByText('method az')).not.toBeInTheDocument();
    expect(screen.queryByText('method jz')).not.toBeInTheDocument();
    expect(screen.getByText('method kz')).toBeInTheDocument();
    expect(screen.getByText('method lz')).toBeInTheDocument();
    expect(screen.queryByText('method m')).not.toBeInTheDocument();
  });

  it('resets the table page when sorting', async () => {
    // Arrange
    asMockedFn(Ajax).mockImplementation(() => mockAjax(paginationMethods) as AjaxContract);

    const user: UserEvent = userEvent.setup();

    // Act
    await act(async () => {
      render(<WorkflowList queryParams={{ tab: 'public' }} />);
    });

    await user.selectOptions(screen.getByRole('combobox', { name: /items per page:/i }), '10');
    await user.click(screen.getByRole('button', { name: /next page/i }));

    // Assert
    expect(screen.getByText('11 - 13 of 13')).toBeInTheDocument();

    // Act
    await user.click(screen.getByText('Synopsis'));

    // Assert
    expect(screen.getByText('1 - 10 of 13')).toBeInTheDocument();
  });

  it('resets the table page when switching tabs', async () => {
    // Arrange
    asMockedFn(Ajax).mockImplementation(() => mockAjax(paginationMethods) as AjaxContract);

    // set the user's email
    jest.spyOn(userStore, 'get').mockImplementation(jest.fn().mockReturnValue(mockUserState('me@me.com')));

    const user: UserEvent = userEvent.setup();

    // Act
    await act(async () => {
      render(<WorkflowList />);
    });

    await user.selectOptions(screen.getByRole('combobox', { name: /items per page:/i }), '10');
    await user.click(screen.getByRole('button', { name: /next page/i }));

    // Assert
    expect(screen.getByText('11 - 13 of 13')).toBeInTheDocument();

    // Act
    await user.click(screen.getByText('Public Workflows (13)'));

    // Assert

    // Note: the total workflow count (13) is actually still from
    // the previous tab just in the test because Nav cannot be
    // mocked properly to actually switch tabs when the public
    // workflows tab is clicked
    expect(screen.getByText('1 - 10 of 13')).toBeInTheDocument();
  });

  it('resets the table page when typing in the search bar', async () => {
    // Arrange
    asMockedFn(Ajax).mockImplementation(() => mockAjax(paginationMethods) as AjaxContract);

    // set the user's email
    jest.spyOn(userStore, 'get').mockImplementation(jest.fn().mockReturnValue(mockUserState('me@me.com')));

    const user: UserEvent = userEvent.setup();

    // Act
    await act(async () => {
      render(<WorkflowList />);
    });

    await user.selectOptions(screen.getByRole('combobox', { name: /items per page:/i }), '10');
    await user.click(screen.getByRole('button', { name: /next page/i }));

    // Assert
    expect(screen.getByText('11 - 13 of 13')).toBeInTheDocument();

    // Act
    fireEvent.change(screen.getByPlaceholderText('SEARCH WORKFLOWS'), { target: { value: 'method' } });
    await act(() => delay(300)); // debounced search

    // Assert

    // Note: just in the test, this would be the text displayed
    // even if the search should filter out some of the workflows,
    // because Nav cannot be mocked properly to actually update
    // the filter when the value in the search bar changes
    expect(screen.getByText('1 - 10 of 13')).toBeInTheDocument();
  });

  it('displays a tooltip for namespace and method names', async () => {
    // Arrange
    asMockedFn(Ajax).mockImplementation(() => mockAjax([revaliMethod]) as AjaxContract);

    // set the user's email
    jest.spyOn(userStore, 'get').mockImplementation(jest.fn().mockReturnValue(mockUserState('revali@gale.com')));

    const user: UserEvent = userEvent.setup();

    // Act
    await act(async () => {
      render(<WorkflowList />);
    });

    await user.pointer({ target: screen.getByText('revali method') });

    // Assert
    expect(screen.getByRole('tooltip')).toHaveTextContent('revali bird namespace/revali method');
  });

  it('displays a tooltip for method synopsis', async () => {
    // Arrange
    asMockedFn(Ajax).mockImplementation(() => mockAjax([revaliMethod]) as AjaxContract);

    // set the user's email
    jest.spyOn(userStore, 'get').mockImplementation(jest.fn().mockReturnValue(mockUserState('revali@gale.com')));

    const user: UserEvent = userEvent.setup();

    // Act
    await act(async () => {
      render(<WorkflowList />);
    });

    const revaliDescriptionVisibleElementArray = screen
      .getAllByText('revali description')
      .filter((element) => !element.style.display.includes('none'));

    await user.pointer({ target: revaliDescriptionVisibleElementArray[0] });

    // Assert
    expect(revaliDescriptionVisibleElementArray).toHaveLength(1);
    expect(screen.getByRole('tooltip')).toHaveTextContent('revali description');
  });

  it('displays a tooltip for method owners', async () => {
    // Arrange
    asMockedFn(Ajax).mockImplementation(() => mockAjax([revaliMethod2]) as AjaxContract);

    // set the user's email
    jest.spyOn(userStore, 'get').mockImplementation(jest.fn().mockReturnValue(mockUserState('revali@gale.com')));

    const user: UserEvent = userEvent.setup();

    // Act
    await act(async () => {
      render(<WorkflowList />);
    });

    const revaliOwnersVisibleElementArray = screen
      .getAllByText('revali@gale.com, revali@champions.com')
      .filter((element) => !element.style.display.includes('none'));

    await user.pointer({ target: revaliOwnersVisibleElementArray[0] });

    // Assert
    expect(revaliOwnersVisibleElementArray).toHaveLength(1);
    expect(screen.getByRole('tooltip')).toHaveTextContent('revali@gale.com, revali@champions.com');
  });

  it('links on the method name to additional workflow details', async () => {
    // Arrange
    asMockedFn(Ajax).mockImplementation(() => mockAjax([noSpacesMethod]) as AjaxContract);

    asMockedFn(getLink).mockImplementation(
      (routeName: string, { namespace, name }: { namespace?: string; name?: string } = {}) =>
        `/${routeName}/${namespace}/${name}`
    );

    // Act
    await act(async () => {
      render(<WorkflowList queryParams={{ tab: 'public' }} />);
    });

    // Assert

    // This is not the correct path of the link on the actual site (due to
    // the mock), but is sufficient to verify that getLink is being called
    // with the correct parameters based on the method namespace and name
    expect(screen.getByText('method-name')).toHaveAttribute('href', '/workflow-dashboard/test-namespace/method-name');
  });

  it('handles errors loading workflows', async () => {
    // Arrange
    asMockedFn(Ajax).mockImplementation(() => {
      return {
        Methods: {
          definitions: jest.fn(() => {
            throw new Error('BOOM');
          }) as Partial<MethodsAjaxContract>,
        } as MethodsAjaxContract,
      } as AjaxContract;
    });

    // Act
    await act(async () => {
      render(<WorkflowList />);
    });

    // Assert

    // tabs should not display method counts because their
    // true values are not known
    expect(screen.getByText('My Workflows')).toBeInTheDocument();
    expect(screen.getByText('Public Workflows')).toBeInTheDocument();

    expect(screen.getByText('Nothing to display')).toBeInTheDocument();
    expect(notify).toHaveBeenCalledWith('error', 'Error loading workflows', expect.anything());
  });
});

describe('create new workflow button', () => {
  it('uploads a new workflow', async () => {
    const mockCreateMethodResp = {
      namespace: 'testing',
      name: 'get-resp',
      synopsis: '',
      snapshotComment: '',
      documentation: '',
      payload:
        'version 1.0\n\ntask test_equality {\n\n  command {\n    echo "hi!"\n  }\n\n  Array[Pair[String, Int]] test = [ (1, 1), ("two", 2), ("three", 3) ]\n\n  output {\n    Array[Pair[String, Int]] testOut = test\n  }\n\n  meta {\n    volatile: true\n  }\n  \n  runtime {\n    docker: "ubuntu:latest"\n    maxRetries: 5\n  }\n}\n\nworkflow eqality_testing {\n  call test_equality\n  output {\n    Array[Pair[String, Int]] s1 = test_equality.testOut\n  }\n}\n',
      entityType: 'Workflow',
    };
    // Act
    const mockAjax: DeepPartial<AjaxContract> = {
      Methods: {
        methods: jest.fn().mockReturnValue(Promise.resolve(mockCreateMethodResp)),
      },
    };
    asMockedFn(Ajax).mockImplementation(() => mockAjax as AjaxContract);

    await act(async () => {
      render(<WorkflowList />);
    });

    // Assert
    const createWorkflowButton = screen.getByRole('button', { name: 'Create New Method' });
    fireEvent.click(createWorkflowButton);

    const newMethodText = screen.getAllByText('Create New Method');
    const modalTitle = newMethodText[1];
    expect(modalTitle).not.toHaveAttribute('role', 'button'); // Ensure the element is the modal title and not the button

    expect(modalTitle).toBeInTheDocument();

    // Get text areas in modal
    const textBoxes = screen.getAllByRole('textbox');
    const namespaceTextBox = textBoxes[0];
    expect(namespaceTextBox).toHaveAttribute('id', 'namespace-input');
    fireEvent.change(namespaceTextBox, { target: { value: 'test namespace' } });

    const nameTextBox = textBoxes[1];
    expect(nameTextBox).toHaveAttribute('id', 'name-input');
    fireEvent.change(nameTextBox, { target: { value: 'test name' } });

    const wdlBox = document.getElementsByClassName('wdl-editor')[0];
    wdlBox.innerHTML = 'wdl text'; // manually setting the WDL box text because of 'Loading' message in monaco-editor

    const uploadButton = screen.getByRole('button', { name: 'Upload' });
    await fireEvent.click(uploadButton);

    expect(Nav.goToPath).toHaveBeenCalledWith('workflow-dashboard', {
      name: 'get-resp',
      namespace: 'testing',
      snapshotId: undefined,
    });
  });
});

/**
 * Checks that the elements with the given text appear on the page in the
 * specified order.
 * @param {...string} elementsText - the text of the elements to check, in the
 * order that they should appear on the page
 */
const checkOrder = (...elementsText: string[]) => {
  const elements: HTMLElement[] = _.map((text) => screen.getByText(text), elementsText);

  for (let i = 0; i < elements.length - 1; i++) {
    expect(elements[i].compareDocumentPosition(elements[i + 1])).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
  }
};
