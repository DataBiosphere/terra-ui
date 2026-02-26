import { render, screen } from '@testing-library/react';
import React from 'react';

import { BucketConsoleLink } from './BucketConsoleLink';

describe('BucketConsoleLink', () => {
  it('renders nothing when cloudPath is undefined', () => {
    const { container } = render(<BucketConsoleLink />);
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing when cloudPath is empty string', () => {
    const { container } = render(<BucketConsoleLink cloudPath='' />);
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing when cloudPath does not have a slash after bucket name', () => {
    const { container } = render(<BucketConsoleLink cloudPath='gs://my-bucket' />);
    expect(container.firstChild).toBeNull();
  });

  it('renders console link when cloudPath is valid', () => {
    render(<BucketConsoleLink cloudPath='gs://my-bucket/path/to/file' />);
    const link = screen.getByText(/View bucket in Google Cloud Console/);
    expect(link).toBeInTheDocument();
  });

  it('creates correct Google Cloud Console URL', () => {
    render(<BucketConsoleLink cloudPath='gs://my-bucket/path/to/file' />);
    const link = screen.getByRole('link') as HTMLAnchorElement;
    expect(link.href).toBe('https://console.cloud.google.com/storage/browser/my-bucket');
  });
});
