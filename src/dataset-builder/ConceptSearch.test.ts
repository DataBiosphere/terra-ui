import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { h } from 'react-hyperscript-helpers';
import { ConceptSearch } from 'src/dataset-builder/ConceptSearch';
import { dummyDatasetModel, dummyGetConceptForId } from 'src/dataset-builder/TestConstants';
import { DataRepo, DataRepoContract, SnapshotBuilderConcept } from 'src/libs/ajax/DataRepo';
import { asMockedFn, renderWithAppContexts as render } from 'src/testing/test-utils';

// This is necessary to avoid waiting for the delayed (debounced) input change event.
jest.mock('src/components/input', () => {
  return {
    ...jest.requireActual('src/components/input'),
    withDebouncedChange: (component) => component,
  };
});

jest.mock('src/libs/ajax/GoogleStorage');
type DataRepoExports = typeof import('src/libs/ajax/DataRepo');
jest.mock('src/libs/ajax/DataRepo', (): DataRepoExports => {
  return {
    ...jest.requireActual('src/libs/ajax/DataRepo'),
    DataRepo: jest.fn(),
  };
});
describe('ConceptSearch', () => {
  const onCancel = jest.fn();
  const onCommit = jest.fn();
  const onOpenHierarchy = jest.fn();
  const actionText = 'action text';
  const datasetId = '0';
  const domainOption = dummyDatasetModel()!.snapshotBuilderSettings!.domainOptions[0];
  const renderSearch = (initialSearch = '', initialCart: SnapshotBuilderConcept[] = []) => {
    render(
      h(ConceptSearch, {
        actionText,
        initialSearch,
        initialCart,
        onCancel,
        onCommit,
        onOpenHierarchy,
        datasetId,
        domainOption,
      })
    );
  };

  const displayedConcepts = [dummyGetConceptForId(102), dummyGetConceptForId(103)];
  const mockSearch = jest.fn();

  const mockDataRepoContract: DataRepoContract = {
    dataset: (_datasetId) =>
      ({
        searchConcepts: mockSearch,
      } as Partial<DataRepoContract['dataset']>),
  } as Partial<DataRepoContract> as DataRepoContract;
  asMockedFn(DataRepo).mockImplementation(() => mockDataRepoContract as DataRepoContract);
  mockSearch.mockResolvedValue({
    result: displayedConcepts,
  });

  it('renders the concept search with an initial search result', async () => {
    // Arrange
    renderSearch();
    // Assert
    expect(await screen.findByText(displayedConcepts[0].name)).toBeTruthy();
    expect(await screen.findByText(displayedConcepts[0].id)).toBeTruthy();
    expect(await screen.findByText(displayedConcepts[1].name)).toBeTruthy();
    expect(await screen.findByText(displayedConcepts[1].id)).toBeTruthy();
    // Action text not visible until a row is selected.
    expect(screen.queryByText(actionText)).toBeFalsy();
  });

  it('searches based on user input', async () => {
    // Arrange
    renderSearch();
    const searchText = 'search text';
    // Act
    const user = userEvent.setup();
    await user.type(screen.getByPlaceholderText('Search'), searchText);
    // Assert - the search is called with the search text.
    expect(mockSearch).toHaveBeenCalledWith(domainOption.root, searchText);
  });

  it('filters based on search text', async () => {
    // Arrange
    renderSearch(displayedConcepts[0].name);
    // Act
    // Assert
    expect(screen.findByText(displayedConcepts[0].name)).toBeTruthy();
    // The second concept should not be displayed.
    expect(() => screen.getByText(displayedConcepts[1].name)).toThrow();
  });

  it('calls open hierarchy on click', async () => {
    // Arrange
    const concept = displayedConcepts[0];
    renderSearch();
    await screen.findByText(concept.name);
    // Act
    const user = userEvent.setup();
    await user.click(screen.getByLabelText(`add ${concept.id}`));
    await user.click(screen.getByLabelText(`open hierarchy ${concept.id}`));
    // Assert
    expect(onOpenHierarchy).toHaveBeenCalledWith(
      { id: concept.id, category: domainOption.category, root: concept },
      [concept],
      ''
    );
  });

  it('supports add to cart', async () => {
    // Arrange
    renderSearch();
    const concept = displayedConcepts[0];
    await screen.findByText(concept.name);
    // Act
    const user = userEvent.setup();
    await user.click(screen.getByLabelText(`add ${concept.id}`));
    // Assert
    expect(screen.queryByText(actionText)).toBeTruthy();
    expect(screen.queryByText('1 concept', { exact: false })).toBeTruthy();
  });

  it('supports remove from cart', async () => {
    // Arrange
    renderSearch();
    const concept = displayedConcepts[0];
    await screen.findByText(concept.name);
    // Act
    const user = userEvent.setup();
    await user.click(screen.getByLabelText(`add ${concept.id}`));
    await user.click(screen.getByLabelText(`remove ${concept.id}`));
    // Assert
    expect(screen.queryByText(actionText)).toBeFalsy();
    expect(screen.queryByText('1 concept', { exact: false })).toBeFalsy();
  });

  it('calls commit on action', async () => {
    // Arrange
    renderSearch();
    const concept = displayedConcepts[0];
    await screen.findByText(concept.name);
    // Act
    const user = userEvent.setup();
    await user.click(screen.getByLabelText(`add ${concept.id}`));
    await user.click(screen.getByText(actionText));
    // Assert
    expect(onCommit).toHaveBeenCalledWith([concept]);
  });

  it('loads the page with the initial cart', async () => {
    // Arrange
    renderSearch('', [displayedConcepts[0]]);
    // Assert
    expect(screen.queryByText('1 concept', { exact: false })).toBeTruthy();
  });
});
