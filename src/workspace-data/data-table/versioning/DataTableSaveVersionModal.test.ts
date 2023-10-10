import { fireEvent } from '@testing-library/react';
import _ from 'lodash/fp';
import { h } from 'react-hyperscript-helpers';
import { renderWithAppContexts as render } from 'src/testing/test-utils';

import { DataTableSaveVersionModal } from './DataTableSaveVersionModal';

describe('DataTableSaveVersionModal', () => {
  it('renders input for description', () => {
    const { getByLabelText } = render(
      h(DataTableSaveVersionModal, {
        entityType: 'sample',
        allEntityTypes: ['sample'],
        onDismiss: _.noop,
        onSubmit: _.noop,
      })
    );

    const descriptionInput = getByLabelText('Description');
    expect(descriptionInput).toBeTruthy();
  });

  it('renders checkboxes to include related set tables', () => {
    const { getAllByRole } = render(
      h(DataTableSaveVersionModal, {
        entityType: 'sample',
        allEntityTypes: ['sample', 'sample_set', 'sample_set_set', 'participant'],
        onDismiss: _.noop,
        onSubmit: _.noop,
      })
    );

    const setTableCheckboxes = getAllByRole('checkbox');
    expect(setTableCheckboxes.length).toBe(2);

    expect(setTableCheckboxes[0].parentElement).toHaveTextContent('sample_set');
    expect(setTableCheckboxes[0].getAttribute('aria-checked')).toBe('false');

    expect(setTableCheckboxes[1].parentElement).toHaveTextContent('sample_set_set');
    expect(setTableCheckboxes[1].getAttribute('aria-checked')).toBe('false');
  });

  it('calls onSubmit with entered description and selected set tables', () => {
    const onSubmit = jest.fn();

    const { getAllByRole, getByLabelText, getByText } = render(
      h(DataTableSaveVersionModal, {
        entityType: 'sample',
        allEntityTypes: ['sample', 'sample_set', 'sample_set_set', 'participant'],
        onDismiss: _.noop,
        onSubmit,
      })
    );

    const descriptionInput = getByLabelText('Description');
    fireEvent.change(descriptionInput, { target: { value: 'this is a version' } });

    const setTableCheckboxes = getAllByRole('checkbox');
    fireEvent.click(setTableCheckboxes[0]);

    const saveButton = getByText('Save');
    fireEvent.click(saveButton);

    expect(onSubmit).toHaveBeenCalledWith({
      description: 'this is a version',
      includedSetEntityTypes: ['sample_set'],
    });
  });
});
