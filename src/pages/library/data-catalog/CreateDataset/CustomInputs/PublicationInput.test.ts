import { render, screen } from '@testing-library/react';
import { h } from 'react-hyperscript-helpers';
import { PublicationInput } from 'src/pages/library/data-catalog/CreateDataset/CustomInputs/PublicationInput';
import { describe, expect, it } from 'vitest';

describe('PublicationInput', () => {
  it('Renders a PublicationInput with all fields and url validation', () => {
    render(
      h(PublicationInput, {
        title: 'Title',
        publication: {
          'dct:title': 'title',
          'dcat:accessURL': 'url',
        },
        onChange: () => {},
      })
    );
    expect(screen.getByLabelText('Title').closest('input')?.value).toBe('title');
    expect(screen.getByLabelText('Access URL').closest('input')?.value).toBe('url');
    expect(screen.getByText('Dcat:access url is not a valid url')).toBeTruthy();
  });

  it('Renders a PublicationInput with no error for proper url', () => {
    render(
      h(PublicationInput, {
        title: 'Title',
        publication: {
          'dct:title': 'title',
          'dcat:accessURL': 'https://url.com',
        },
        onChange: () => {},
      })
    );
    expect(screen.queryByText('Dcat:access url is not a valid url')).toBeFalsy();
  });
});
