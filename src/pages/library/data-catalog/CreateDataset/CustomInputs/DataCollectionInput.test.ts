import { render, screen } from '@testing-library/react';
import { h } from 'react-hyperscript-helpers';
import { DataCollectionInput } from 'src/pages/library/data-catalog/CreateDataset/CustomInputs/DataCollectionInput';

describe('DataCollectionInput', () => {
  it('Renders a DataCollectionInput with all fields', () => {
    render(
      h(DataCollectionInput, {
        title: 'Title',
        dataCollection: {
          'dct:identifier': 'id',
          'dct:title': 'title',
          'dct:description': 'description',
          'dct:creator': 'creator',
          'dct:publisher': 'publisher',
          'dct:issued': 'issued',
          'dct:modified': 'modified',
        },
        onChange: () => {},
      })
    );
    expect(screen.getByLabelText('Identifier').closest('input')?.value).toBe('id');
    expect(screen.getByLabelText('Title').closest('input')?.value).toBe('title');
    expect(screen.getByLabelText('Description').closest('input')?.value).toBe('description');
    expect(screen.getByLabelText('Creator').closest('input')?.value).toBe('creator');
    expect(screen.getByLabelText('Publisher').closest('input')?.value).toBe('publisher');
    expect(screen.getByLabelText('Issued').closest('input')?.value).toBe('issued');
    expect(screen.getByLabelText('Modified').closest('input')?.value).toBe('modified');
  });
});
