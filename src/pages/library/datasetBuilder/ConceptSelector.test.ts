import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { h } from 'react-hyperscript-helpers';
import { DatasetBuilder, DatasetBuilderContract, getConceptForId } from 'src/libs/ajax/DatasetBuilder';
import { ConceptSelector } from 'src/pages/library/datasetBuilder/ConceptSelector';
import { asMockedFn } from 'src/testing/test-utils';

type DatasetBuilderExports = typeof import('src/libs/ajax/DatasetBuilder');
jest.mock('src/libs/ajax/DatasetBuilder', (): DatasetBuilderExports => {
  return {
    ...jest.requireActual('src/libs/ajax/DatasetBuilder'),
    DatasetBuilder: jest.fn(),
  };
});

describe('ConceptSelector', () => {
  const onCancel = jest.fn();
  const onCommit = jest.fn();
  const title = 'title';
  const actionText = 'action text';
  // Using 101 so the ID doesn't match the count.
  const initialRows = [getConceptForId(101)];
  const renderSelector = () => {
    render(h(ConceptSelector, { actionText, initialRows, onCancel, onCommit, title }));
  };

  it('renders the concept selector', () => {
    // Arrange
    renderSelector();
    // Assert
    expect(screen.queryByText(title)).toBeTruthy();
    expect(screen.queryByText(initialRows[0].name)).toBeTruthy();
    expect(screen.queryByText(initialRows[0].id)).toBeTruthy();
    expect(screen.queryByText(initialRows[0].count)).toBeTruthy();
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
    const mockDatasetResponse: Partial<DatasetBuilderContract> = {
      getConcepts: jest.fn(),
    };
    const getConceptsMock = (mockDatasetResponse as DatasetBuilderContract).getConcepts;
    asMockedFn(getConceptsMock).mockResolvedValue({ result: [] });
    asMockedFn(DatasetBuilder).mockImplementation(() => mockDatasetResponse as DatasetBuilderContract);
    // Act
    const user = userEvent.setup();
    await user.click(screen.getByLabelText('expand'));
    // Assert
    expect(getConceptsMock).toHaveBeenCalledWith(initialRows[0]);
  });

  it('supports multiple add to cart', async () => {
    // Arrange
    renderSelector();
    const mockDatasetResponse: Partial<DatasetBuilderContract> = {
      getConcepts: jest.fn(),
    };
    const getConceptsMock = (mockDatasetResponse as DatasetBuilderContract).getConcepts;
    asMockedFn(getConceptsMock).mockResolvedValue({ result: [getConceptForId(102)] });
    asMockedFn(DatasetBuilder).mockImplementation(() => mockDatasetResponse as DatasetBuilderContract);
    // Act
    const user = userEvent.setup();
    await user.click(screen.getByLabelText('expand'));
    await user.click(screen.getAllByLabelText('add')[0]);
    await user.click(screen.getAllByLabelText('add')[0]);
    // Assert
    expect(screen.getByText('2 concepts', { exact: false })).toBeTruthy();
  });
});
