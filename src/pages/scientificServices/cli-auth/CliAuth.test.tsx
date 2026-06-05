import { render, screen } from '@testing-library/react';
import React from 'react';

import { CliAuth } from './CliAuth';

describe('CliAuth', () => {
  it('renders page with expected text', () => {
    window.location.hash = '#some-path?code=test-auth-code-123';

    render(<CliAuth />);

    expect(screen.getByText('Sign in to the terralab CLI')).toBeInTheDocument();
    expect(screen.getByText(/You have reached this page because you ran/)).toBeInTheDocument();
    expect(screen.getByText('terralab login')).toBeInTheDocument();
    expect(screen.getByText(/similar to your password/)).toBeInTheDocument();
    expect(screen.getByText(/You can close this tab when you're done/)).toBeInTheDocument();
    expect(screen.getByAltText('Broad Clinical Laboratories')).toBeInTheDocument();
  });

  it('displays the auth code with a copy button', () => {
    window.location.hash = '#some-path?code=test-auth-code-123';

    render(<CliAuth />);

    expect(screen.getByText('test-auth-code-123')).toBeInTheDocument();

    const clipboardButton = screen.getByRole('button');
    expect(clipboardButton).toBeInTheDocument();
    expect(clipboardButton).toHaveTextContent('Copy');

    expect(screen.queryByText(/Error: no verification code found/)).not.toBeInTheDocument();
  });

  it('displays an error message when there is no code present in the query params', () => {
    window.location.hash = '#some-path';

    render(<CliAuth />);

    expect(screen.getByText(/Error: no verification code found. Please try again/)).toBeInTheDocument();
  });
});
