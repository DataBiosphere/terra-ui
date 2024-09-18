import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { h } from 'react-hyperscript-helpers';
import { mockAutoSizer } from 'src/components/TreeGrid.test';
import { dummyGetConceptForId } from 'src/dataset-builder/TestConstants';
import { DataRepo, DataRepoContract, SnapshotBuilderConcept } from 'src/libs/ajax/DataRepo';
import { asMockedFn, renderWithAppContexts as render } from 'src/testing/test-utils';

import { ConceptSelector, findRoot } from './ConceptSelector';

jest.mock('src/libs/ajax/GoogleStorage');
type DataRepoExports = typeof import('src/libs/ajax/DataRepo');
jest.mock('src/libs/ajax/DataRepo', (): DataRepoExports => {
  return {
    ...jest.requireActual('src/libs/ajax/DataRepo'),
    DataRepo: jest.fn(),
  };
});

mockAutoSizer();

describe('ConceptSelector', () => {
  const onCancel = jest.fn();
  const onCommit = jest.fn();
  const title = 'title';
  const actionText = 'action text';
  const snapshotId = '0';
  // Using 101 so the ID doesn't match the count.
  const parents = [{ parentId: 0, children: [dummyGetConceptForId(101), dummyGetConceptForId(102)] }];
  const renderSelector = (initialCart: SnapshotBuilderConcept[] = []) => {
    render(
      h(ConceptSelector, {
        actionText,
        parents,
        initialCart,
        onCancel,
        onCommit,
        title,
        snapshotId,
      })
    );
  };

  const firstChild = parents[0].children[0];
  const secondChild = parents[0].children[1];

  it('renders the concept selector', () => {
    // Arrange
    renderSelector();
    // Assert
    expect(screen.queryByText(title)).toBeTruthy();
    expect(screen.queryByText(firstChild.name)).toBeTruthy();
    expect(screen.queryByText(firstChild.id)).toBeTruthy();
    // Two elements have the same count.
    expect(screen.queryAllByText(firstChild.count!)).toHaveLength(2);
    // Action text not visible until a row is selected.
    expect(screen.queryByText(actionText)).toBeFalsy();
  });

  it('renders the concept selector with a non-empty initial cart', () => {
    // Arrange
    renderSelector([firstChild]);
    // Assert
    expect(screen.queryByText(actionText)).toBeTruthy();
    expect(screen.queryByText('1 concept', { exact: false })).toBeTruthy();
  });

  it('renders the concept selector with a multiple concepts in initial cart', () => {
    // Arrange
    renderSelector([firstChild, secondChild]);
    // Assert
    expect(screen.queryByText(actionText)).toBeTruthy();
    expect(screen.queryByText('2 concepts', { exact: false })).toBeTruthy();
  });

  it('supports add to cart', async () => {
    // Arrange
    renderSelector();
    // Act
    const user = userEvent.setup();
    // add
    await user.click(screen.getByLabelText(`${firstChild.name}`));
    // Assert
    expect(screen.queryByText(actionText)).toBeTruthy();
    expect(screen.queryByText('1 concept', { exact: false })).toBeTruthy();
  });

  it('supports add to cart with existing cart items', async () => {
    // Arrange
    renderSelector([secondChild]);
    // Act
    const user = userEvent.setup();
    // add
    await user.click(screen.getByLabelText(`${firstChild.name}`));
    // Assert
    expect(screen.queryByText(actionText)).toBeTruthy();
    expect(screen.queryByText('2 concept', { exact: false })).toBeTruthy();
  });

  it('supports remove from cart', async () => {
    // Arrange
    renderSelector();
    // Act
    const user = userEvent.setup();
    // add
    await user.click(screen.getByLabelText(`${firstChild.name}`));
    // remove
    await user.click(screen.getByLabelText(`${firstChild.name}`));
    // Assert
    expect(screen.queryByText(actionText)).toBeFalsy();
    expect(screen.queryByText('1 concept', { exact: false })).toBeFalsy();
  });

  it('supports remove from cart, when previously in cart', async () => {
    // Arrange
    renderSelector([firstChild]);
    // Act
    const user = userEvent.setup();
    // remove
    await user.click(screen.getByLabelText(`${firstChild.name}`));
    // Assert
    expect(screen.queryByText(actionText)).toBeFalsy();
    expect(screen.queryByText('1 concept', { exact: false })).toBeFalsy();
  });

  it('calls commit on action', async () => {
    // Arrange
    renderSelector();
    // Act
    const user = userEvent.setup();
    // add
    await user.click(screen.getByLabelText(`${firstChild.name}`));
    await user.click(screen.getByText(actionText));
    // Assert
    expect(onCommit).toHaveBeenCalledWith([firstChild]);
  });

  it('calls cancel on cancel', async () => {
    // Arrange
    renderSelector();
    // Act
    const user = userEvent.setup();
    await user.click(screen.getByLabelText('cancel'));
    // Assert
    expect(onCancel).toHaveBeenCalled();
  });

  it('calls ajax API to expand a row', async () => {
    // Arrange
    renderSelector();

    const mockDataRepoContract: DataRepoContract = {
      snapshot: (_snapshotId) =>
        ({
          getConceptChildren: () => Promise.resolve({ result: [dummyGetConceptForId(103)] }),
        } as Partial<DataRepoContract['snapshot']>),
    } as Partial<DataRepoContract> as DataRepoContract;
    asMockedFn(DataRepo).mockImplementation(() => mockDataRepoContract as DataRepoContract);
    // Act
    const user = userEvent.setup();
    await user.click(screen.getByLabelText(`expand ${firstChild.id}`));
    // Assert
    // Concept with ID 102 corresponds to Disease
    expect(screen.getByText('Disease')).toBeTruthy();
  });

  it('supports multiple add to cart', async () => {
    // Arrange
    renderSelector();
    const expandConcept = dummyGetConceptForId(103);
    const mockDataRepoContract: DataRepoContract = {
      snapshot: (_datasetId) =>
        ({
          getConceptChildren: () => Promise.resolve({ result: [expandConcept] }),
        } as Partial<DataRepoContract['snapshot']>),
    } as Partial<DataRepoContract> as DataRepoContract;
    asMockedFn(DataRepo).mockImplementation(() => mockDataRepoContract as DataRepoContract);
    // Act
    const user = userEvent.setup();
    await user.click(screen.getByLabelText(`expand ${firstChild.id}`));
    // add
    await user.click(screen.getAllByLabelText(`${firstChild.name}`)[0]);
    // remove
    await user.click(screen.getAllByLabelText(`${expandConcept.name}`)[0]);
    // Assert
    expect(screen.getByText('2 concepts', { exact: false })).toBeTruthy();
  });

  it('finds the root concept', () => {
    // Arrange
    const parents = [
      { parentId: 101, children: [dummyGetConceptForId(102)] },
      { parentId: 0, children: [dummyGetConceptForId(101)] },
    ];
    // Act
    const root = findRoot(parents);
    // Assert
    expect(root).toEqual(0);
  });
});
