import { delay } from '@terra-ui-packages/core-utils';
import { act, fireEvent, screen, within } from '@testing-library/react';
import userEvent, { UserEvent } from '@testing-library/user-event';
import _ from 'lodash/fp';
import React from 'react';
import { Ajax } from 'src/libs/ajax';
import * as Nav from 'src/libs/nav';
import { getLink } from 'src/libs/nav';
import { TerraUser, TerraUserState, userStore } from 'src/libs/state';
import { MethodDefinition } from 'src/pages/workflows/workflow-utils';
import { WorkflowList } from 'src/pages/workflows/WorkflowList';
import { asMockedFn, renderWithAppContexts as render } from 'src/testing/test-utils';

jest.mock('src/libs/ajax');
jest.mock('src/libs/nav', () => ({
  ...jest.requireActual('src/libs/nav'),
  getLink: jest.fn(() => '#workflows'),
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

type AjaxContract = ReturnType<typeof Ajax>;
type AjaxMethodsContract = AjaxContract['Methods'];

const mockMethods = (methods: MethodDefinition[]): Partial<AjaxMethodsContract> => {
  return { definitions: jest.fn(() => Promise.resolve(methods)) };
};

const mockAjax = (methods: MethodDefinition[]): Partial<AjaxContract> => {
  return { Methods: mockMethods(methods) as AjaxMethodsContract };
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
    expect(table).toHaveAttribute('aria-colcount', '5');
    expect(table).toHaveAttribute('aria-rowcount', '2');

    const headers: HTMLElement[] = within(table).getAllByRole('columnheader');
    expect(headers).toHaveLength(5);
    expect(headers[0]).toHaveTextContent('Workflow');
    expect(headers[1]).toHaveTextContent('Synopsis');
    expect(headers[2]).toHaveTextContent('Owners');
    expect(headers[3]).toHaveTextContent('Snapshots');
    expect(headers[4]).toHaveTextContent('Configurations');

    const rows: HTMLElement[] = within(table).getAllByRole('row');
    expect(rows).toHaveLength(2);

    const methodCells: HTMLElement[] = within(rows[1]).getAllByRole('cell');
    expect(methodCells).toHaveLength(5);
    within(methodCells[0]).getByText('revali bird namespace');
    within(methodCells[0]).getByText('revali method 2');
    expect(methodCells[1]).toHaveTextContent('another revali description');
    expect(methodCells[2]).toHaveTextContent('revali@gale.com, revali@champions.com');
    expect(methodCells[3]).toHaveTextContent('1');
    expect(methodCells[4]).toHaveTextContent('2');
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
      render(<WorkflowList />);
    });

    await user.click(screen.getByText('Public Workflows (2)'));
    await user.click(screen.getByText('My Workflows (0)'));

    // Assert
    expect(navHistoryReplace).toHaveBeenCalledTimes(2);
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

  it('sorts by configurations ascending', async () => {
    // Arrange
    asMockedFn(Ajax).mockImplementation(
      () => mockAjax([sortingMethod, darukMethod, revaliMethod, revaliMethod2]) as AjaxContract
    );

    const user: UserEvent = userEvent.setup();

    // Act
    await act(async () => {
      render(<WorkflowList queryParams={{ tab: 'public' }} />);
    });

    await user.click(screen.getByText('Configurations'));

    // Assert
    checkOrder('sorting method', 'revali method 2', 'revali method', 'daruk method');
  });

  it('sorts by configurations descending', async () => {
    // Arrange
    asMockedFn(Ajax).mockImplementation(
      () => mockAjax([sortingMethod, darukMethod, revaliMethod, revaliMethod2]) as AjaxContract
    );

    const user: UserEvent = userEvent.setup();

    // Act
    await act(async () => {
      render(<WorkflowList queryParams={{ tab: 'public' }} />);
    });

    await user.click(screen.getByText('Configurations'));
    await user.click(screen.getByText('Configurations'));

    // Assert
    checkOrder('daruk method', 'revali method', 'revali method 2', 'sorting method');
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
