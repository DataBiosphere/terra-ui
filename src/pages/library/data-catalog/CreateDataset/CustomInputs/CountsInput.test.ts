import { render, screen } from '@testing-library/react';
import { h } from 'react-hyperscript-helpers';
import { CountsInput } from 'src/pages/library/data-catalog/CreateDataset/CustomInputs/CountsInput';
import { describe, expect, it } from 'vitest';

describe('CountsInput', () => {
  it('Renders a CountsInput with all fields', () => {
    render(
      h(CountsInput, {
        title: 'Title',
        counts: {
          donors: 1,
          samples: 2,
          files: 3,
        },
        onChange: () => {},
      })
    );
    expect(screen.getByLabelText('Donors').closest('input')?.value).toBe('1');
    expect(screen.getByLabelText('Samples').closest('input')?.value).toBe('2');
    expect(screen.getByLabelText('Files').closest('input')?.value).toBe('3');
  });
});
