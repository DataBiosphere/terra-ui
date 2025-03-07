import { act, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { h } from 'react-hyperscript-helpers';
import { renderWithAppContexts as render } from 'src/testing/test-utils';

import { RenameTableModal } from './RenameTableModal';

jest.mock('src/libs/ajax/Metrics');
jest.mock('src/libs/ajax/workspaces/Workspaces');

describe('RenameTableModal', () => {
  const validTableNames = ['aliquot', 'Some-Name_With_123-789-Chars'];
  const invalidCharacters = [
    'unknownprefix:sample',
    'disallowed/characters',
    'space character',
    'or 1=1; drop table users; --',
  ];
  validTableNames.forEach((newName) => {
    it(`passes validation for "${newName}"`, async () => {
      // Act
      await act(async () => {
        render(
          h(RenameTableModal, {
            onDismiss: jest.fn(),
            onUpdateSuccess: jest.fn(),
            getAllSavedColumnSettings: jest.fn(),
            updateAllSavedColumnSettings: jest.fn(),
            setTableNames: [],
            namespace: 'namespace',
            name: 'name',
            selectedDataType: 'selectedDataType',
          })
        );
      });

      const input = screen.getByLabelText(/New Name/);
      await userEvent.type(input, newName);

      const submitButton = screen.getByRole('button', { name: /Rename/ });

      // Assert
      expect(submitButton).not.toHaveAttribute('disabled');
      expect(screen.queryByText(/Table name may only/)).toBeNull();
      expect(screen.queryByText(/Table name is required/)).toBeNull();
    });
  });

  invalidCharacters.forEach((newName) => {
    it(`fails validation for "${newName}"`, async () => {
      // Act
      await act(async () => {
        render(
          h(RenameTableModal, {
            onDismiss: jest.fn(),
            onUpdateSuccess: jest.fn(),
            getAllSavedColumnSettings: jest.fn(),
            updateAllSavedColumnSettings: jest.fn(),
            setTableNames: [],
            namespace: 'namespace',
            name: 'name',
            selectedDataType: 'selectedDataType',
          })
        );
      });

      const input = screen.getByLabelText(/New Name/);
      await userEvent.type(input, newName);

      const submitButton = screen.getByRole('button', { name: /Rename/ });

      // Assert
      expect(submitButton).toHaveAttribute('disabled');
      expect(screen.queryByText(/Table name may only/)).not.toBeNull();
      expect(screen.queryByText(/Table name is required/)).toBeNull();
    });
  });

  it('requires table name', async () => {
    // Act
    await act(async () => {
      render(
        h(RenameTableModal, {
          onDismiss: jest.fn(),
          onUpdateSuccess: jest.fn(),
          getAllSavedColumnSettings: jest.fn(),
          updateAllSavedColumnSettings: jest.fn(),
          setTableNames: [],
          namespace: 'namespace',
          name: 'name',
          selectedDataType: 'selectedDataType',
        })
      );
    });

    const input = screen.getByLabelText(/New Name/);
    await userEvent.type(input, 'anewname');

    const submitButton = screen.getByRole('button', { name: /Rename/ });

    // Assert
    expect(submitButton).not.toHaveAttribute('disabled');
    expect(screen.queryByText(/Table name may only/)).toBeNull();
    expect(screen.queryByText(/Table name is required/)).toBeNull();

    await userEvent.clear(input);
    expect(submitButton).toHaveAttribute('disabled');
    expect(screen.queryByText(/Table name may only/)).toBeNull();
    expect(screen.queryByText(/Table name is required/)).not.toBeNull();
  });
});
