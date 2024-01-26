import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { h } from 'react-hyperscript-helpers';
import { renderWithAppContexts as render } from 'src/testing/test-utils';

import { RenameColumnModal, RenameColumnModalProps } from './RenameColumnModal';

const defaultRenameColumnModalProps: RenameColumnModalProps = {
  onDismiss: () => {},
  onSuccess: () => {},
  workspace: {},
  entityType: 'defaultEntityType',
  attributeNames: ['attribute1', 'attribute2'],
  oldAttributeName: 'attribute1',
  dataProvider: {},
};

describe('RenameColumnModal', () => {
  it('Errors on invalid characters in column name', async () => {
    // Arrange
    const renameProps = { ...defaultRenameColumnModalProps };
    // const user = userEvent.setup();
    // Act
    const renameModal = render(h(RenameColumnModal, renameProps));
    // User enters name with %^#@
    const input = screen.getByLabelText(/New Name/);
    await userEvent.type(input, 'b@d ch@r@cter$');
    // Assert
    expect(renameModal.getByText(/Column name may only contain alphanumeric characters/));
  });

  it('Errors on reserved word for column name', async () => {
    // Arrange
    const renameProps = { ...defaultRenameColumnModalProps };
    // Act
    const renameModal = render(h(RenameColumnModal, renameProps));
    // User enters defaultEntityType_id
    const input = screen.getByLabelText(/New Name/);
    await userEvent.type(input, 'defaultEntityType_id');
    // Assert
    expect(renameModal.getByText(/Column name may only contain alphanumeric characters/));
  });

  it('Errors on existing name for column name', async () => {
    // Arrange
    const renameProps = { ...defaultRenameColumnModalProps };
    // Act
    const renameModal = render(h(RenameColumnModal, renameProps));
    // User enters 'attribute2'
    const input = screen.getByLabelText(/New Name/);
    await userEvent.type(input, 'attribute2');
    // Assert
    expect(renameModal.getByText(/already exists as an attribute name/));
  });
});
