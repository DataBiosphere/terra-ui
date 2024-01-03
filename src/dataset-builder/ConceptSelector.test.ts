import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { h } from 'react-hyperscript-helpers';
import { dummyGetConceptForId } from 'src/dataset-builder/TestConstants';
import { DataRepo, DataRepoContract } from 'src/libs/ajax/DataRepo';
import { asMockedFn, renderWithAppContexts as render } from 'src/testing/test-utils';

import { ConceptSelector } from './ConceptSelector';

jest.mock('src/libs/ajax/GoogleStorage');
type DataRepoExports = typeof import('src/libs/ajax/DataRepo');
jest.mock('src/libs/ajax/DataRepo', (): DataRepoExports => {
  return {
    ...jest.requireActual('src/libs/ajax/DataRepo'),
    DataRepo: jest.fn(),
  };
});

describe('ConceptSelector', () => {
  const onCancel = jest.fn();
  const onCommit = jest.fn();
  const title = 'title';
  const actionText = 'action text';
  const datasetId = '0';
  // Using 101 so the ID doesn't match the count.
  const initialRows = [dummyGetConceptForId(101)];
  const renderSelector = () => {
    render(h(ConceptSelector, { actionText, initialRows, onCancel, onCommit, title, datasetId }));
  };

  it('renders the concept selector', () => {
    // Arrange
    renderSelector();
    // Assert
    expect(screen.queryByText(title)).toBeTruthy();
    expect(screen.queryByText(initialRows[0].name)).toBeTruthy();
    expect(screen.queryByText(initialRows[0].id)).toBeTruthy();
    expect(screen.queryByText(initialRows[0].count || 0)).toBeTruthy();
    // Action text not visible until a row is selected.
    expect(screen.queryByText(actionText)).toBeFalsy();
  });

  it('supports add to cart', async () => {
    // Arrange
    renderSelector();
    // Act
    const user = userEvent.setup();
    await user.click(screen.getByLabelText('add'));
    // Assert
    expect(screen.queryByText(actionText)).toBeTruthy();
    expect(screen.queryByText('1 concept', { exact: false })).toBeTruthy();
  });

  it('supports remove from cart', async () => {
    // Arrange
    renderSelector();
    // Act
    const user = userEvent.setup();
    await user.click(screen.getByLabelText('add'));
    await user.click(screen.getByLabelText('remove'));
    // Assert
    expect(screen.queryByText(actionText)).toBeFalsy();
    expect(screen.queryByText('1 concept', { exact: false })).toBeFalsy();
  });

  it('calls commit on action', async () => {
    // Arrange
    renderSelector();
    // Act
    const user = userEvent.setup();
    await user.click(screen.getByLabelText('add'));
    await user.click(screen.getByText(actionText));
    // Assert
    expect(onCommit).toHaveBeenCalledWith(initialRows);
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
      dataset: (_datasetId) =>
        ({
          getConcepts: () => Promise.resolve({ result: [dummyGetConceptForId(102)] }),
        } as Partial<DataRepoContract['dataset']>),
    } as Partial<DataRepoContract> as DataRepoContract;
    asMockedFn(DataRepo).mockImplementation(() => mockDataRepoContract as DataRepoContract);
    // Act
    const user = userEvent.setup();
    await user.click(screen.getByLabelText('expand'));
    // Assert
    // Concept with ID 102 corresponds to Disease
    expect(screen.getByText('Disease')).toBeTruthy();
  });

  it('supports multiple add to cart', async () => {
    // Arrange
    renderSelector();
    const mockDataRepoContract: DataRepoContract = {
      dataset: (_datasetId) =>
        ({
          getConcepts: () => Promise.resolve({ result: [dummyGetConceptForId(102)] }),
        } as Partial<DataRepoContract['dataset']>),
    } as Partial<DataRepoContract> as DataRepoContract;
    asMockedFn(DataRepo).mockImplementation(() => mockDataRepoContract as DataRepoContract);
    // Act
    const user = userEvent.setup();
    await user.click(screen.getByLabelText('expand'));
    await user.click(screen.getAllByLabelText('add')[0]);
    await user.click(screen.getAllByLabelText('add')[0]);
    // Assert
    expect(screen.getByText('2 concepts', { exact: false })).toBeTruthy();
  });
});
