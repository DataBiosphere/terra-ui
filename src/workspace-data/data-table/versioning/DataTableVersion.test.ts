import { fireEvent } from '@testing-library/react';
import { h } from 'react-hyperscript-helpers';
import { renderWithAppContexts as render } from 'src/testing/test-utils';

import { DataTableVersion } from './DataTableVersion';

describe('DataTableVersion', () => {
  const testVersion = {
    url: 'gs://workspace-bucket/.data-table-versions/sample/sample.1664568527960.zip',
    createdBy: 'user@example.com',
    entityType: 'sample',
    includedSetEntityTypes: ['sample_set'],
    timestamp: 1664568527960,
    description: 'A version of samples',
  };

  describe('renders version information', () => {
    let renderResult;

    beforeEach(() => {
      renderResult = render(h(DataTableVersion, { version: testVersion, onDelete: jest.fn(), onImport: jest.fn() }));
    });

    it('renders entity type and timestamp', () => {
      const { getByRole } = renderResult;
      const heading = getByRole('heading');
      expect(heading).toHaveTextContent('sample (Sep 30, 2022, 8:08 PM)');
    });

    it('renders included set tables', () => {
      const { getByLabelText } = renderResult;
      const setTableList = getByLabelText('Included set tables:');
      expect(setTableList).toHaveTextContent('sample_set');
    });

    it('renders creator', () => {
      const { getByText } = renderResult;
      expect(getByText('Created by: user@example.com')).toBeTruthy();
    });

    it('renders description', () => {
      const { getByText } = renderResult;
      expect(getByText('A version of samples')).toBeTruthy();
    });
  });

  it('renders import button and confirms import', () => {
    const onImport = jest.fn();
    const { getByTestId, getByText } = render(
      h(DataTableVersion, { version: testVersion, onDelete: jest.fn(), onImport })
    );

    const importButton = getByText('Import');
    fireEvent.click(importButton);

    expect(getByText(/This version will be imported to a new data table/)).toBeTruthy();

    const confirmImportButton = getByTestId('confirm-import');
    fireEvent.click(confirmImportButton);

    expect(onImport).toHaveBeenCalled();
  });

  it('renders delete button and confirms delete', () => {
    const onDelete = jest.fn();
    const { getByTestId, getByText } = render(
      h(DataTableVersion, { version: testVersion, onDelete, onImport: jest.fn() })
    );

    const deleteButton = getByText('Delete');
    fireEvent.click(deleteButton);

    expect(getByText(/Are you sure you want to delete the version/)).toBeTruthy();

    const confirmDeleteButton = getByTestId('confirm-delete');
    fireEvent.click(confirmDeleteButton);

    expect(onDelete).toHaveBeenCalled();
  });
});
