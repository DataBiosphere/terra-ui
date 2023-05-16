import { render, screen } from '@testing-library/react';
import { h } from 'react-hyperscript-helpers';
import { SamplesInput } from 'src/pages/library/data-catalog/CreateDataset/CustomInputs/SamplesInput';

describe('SamplesInput', () => {
  it('Renders a SamplesInput with all fields', () => {
    render(
      h(SamplesInput, {
        title: 'Title',
        samples: {
          disease: ['disease one', 'disease two'],
          species: ['species one', 'species two'],
        },
        onChange: () => {},
      })
    );
    expect(screen.getByLabelText('disease one').closest('input')?.value).toBe('disease one');
    expect(screen.getByLabelText('disease two').closest('input')?.value).toBe('disease two');
    expect(screen.getByLabelText('species one').closest('input')?.value).toBe('species one');
    expect(screen.getByLabelText('species two').closest('input')?.value).toBe('species two');
  });
});
