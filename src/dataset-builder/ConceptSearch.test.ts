import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import _ from 'lodash/fp';
import { act } from 'react-dom/test-utils';
import { h } from 'react-hyperscript-helpers';
import { ConceptSearch } from 'src/dataset-builder/ConceptSearch';
import { dummyGetConceptForId, testSnapshotBuilderSettings } from 'src/dataset-builder/TestConstants';
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
  const domainOption = testSnapshotBuilderSettings().domainOptions[0];

  const renderSearch = (initialSearch = '', initialCart: SnapshotBuilderConcept[] = []) =>
    render(
      h(ConceptSearch, {
        actionText,
        initialSearch,
        initialCart,
        onCancel,
        onCommit,
        onOpenHierarchy,
        snapshotId: datasetId,
        domainOption,
      })
    );

  const displayedConcepts = [dummyGetConceptForId(102), dummyGetConceptForId(103)];
  const mockSearch = jest.fn();

  const mockDataRepoContract: DataRepoContract = {
    snapshot: (_snapshotId) =>
      ({
        enumerateConcepts: mockSearch,
      } as Partial<DataRepoContract['snapshot']>),
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

  it('enumerateConcepts is called when initial search length is 0', async () => {
    // Arrange
    await act(() => renderSearch());
    // Assert - enumerateConcepts is called because searchText.length is 0
    expect(mockSearch).toBeCalledTimes(1);
  });

  it('enumerateConcepts is not called when initial search length is 1 or 2', async () => {
    // Arrange
    renderSearch('a');
    // Assert - enumerateConcepts is not called because searchText.length is 1
    expect(mockSearch).toBeCalledTimes(0);

    // Arrange
    renderSearch('ab');
    // Assert - enumerateConcepts is not called because searchText.length is 2
    expect(mockSearch).toBeCalledTimes(0);
  });
  it('enumerateConcepts is called when initial search length is greater than 2', async () => {
    // Arrange
    await act(() => renderSearch('abc'));
    // Assert - enumerateConcepts is called because searchText.length is greater than 2
    expect(mockSearch).toBeCalledTimes(1);
  });

  it('filters based on search text', async () => {
    // Arrange/Act
    const searchText = 'search text';
    // Need to explicitly call act() here to avoid a warning about state updates during rendering.
    await act(() => renderSearch(searchText));
    // Assert - the initial page load should have called search with the initial search text.
    expect(mockSearch).toHaveBeenCalledWith(domainOption.root, searchText);
  });

  it('calls open hierarchy on click', async () => {
    // Arrange
    const concept = displayedConcepts[0];
    renderSearch();
    // Act
    const user = userEvent.setup();
    // add
    await user.click(await screen.findByLabelText(`${concept.name}`));
    await user.click(screen.getByLabelText(`open hierarchy ${concept.id}`));
    // Assert
    expect(onOpenHierarchy).toHaveBeenCalledWith(domainOption, [concept], '', concept);
  });

  it('supports add to cart', async () => {
    // Arrange
    renderSearch();
    const concept = displayedConcepts[0];
    // Act
    const user = userEvent.setup();
    // add
    await user.click(await screen.findByLabelText(`${concept.name}`));
    // Assert
    expect(screen.queryByText(actionText)).toBeTruthy();
    expect(screen.queryByText('1 concept', { exact: false })).toBeTruthy();
  });

  it('supports remove from cart', async () => {
    // Arrange
    renderSearch();
    const concept = displayedConcepts[0];
    // Act
    const user = userEvent.setup();
    // add
    await user.click(await screen.findByLabelText(`${concept.name}`));
    // remove
    await user.click(screen.getByLabelText(`${concept.name}`));
    // Assert
    expect(screen.queryByText(actionText)).toBeFalsy();
    expect(screen.queryByText('1 concept', { exact: false })).toBeFalsy();
  });

  it('calls commit on action', async () => {
    // Arrange
    renderSearch();
    const concept = displayedConcepts[0];
    // Act
    const user = userEvent.setup();
    // add
    await user.click(await screen.findByLabelText(`${concept.name}`));
    await user.click(screen.getByText(actionText));
    // Assert
    expect(onCommit).toHaveBeenCalledWith([concept]);
  });

  it('bolds the search term and leaves the rest unbolded, "Dis"', async () => {
    renderSearch('Dis');

    const disText = await screen.findAllByText('Dis');

    const filterDisText = _.filter(
      (element) => element.tagName === 'SPAN' && element.style.fontWeight === '600',
      disText
    ).length;
    expect(filterDisText).toBeGreaterThan(0);
    expect(await screen.findByText('ease')).toBeTruthy();
  });

  it('loads the page with the initial cart', async () => {
    // Arrange
    await act(() => renderSearch('', [displayedConcepts[0]]));
    // Assert
    expect(screen.queryByText('1 concept', { exact: false })).toBeTruthy();
  });

  it('renders column headers defined', async () => {
    // Arrange
    renderSearch(); // might change
    // Assert
    expect(await screen.findByText('Column Headers Defined')).toBeTruthy();
  });

  it('opens popup when column headers defined is clicked', async () => {
    // Arrange
    renderSearch();
    // Act
    const user = userEvent.setup();
    await user.click(screen.getByText('Column Headers Defined'));
    // Assert
    expect(screen.getByRole('dialog')).toHaveTextContent(
      'A descriptive label for each Concept across all domains from the OMOP CDM.'
    );
  });
});
