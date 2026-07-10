import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { renderWithAppContexts as render } from 'src/testing/test-utils';

import { CitationView } from './CitationView';

describe('CitationView', () => {
  const mockCitation =
    'Data Science Services at Broad Clinical Laboratories. (2026, Jul 9). *All of Us + AnVIL Array Imputation* (v1). https://services.terra.bio/';

  const mockClipboard = {
    writeText: jest.fn(() => Promise.resolve()),
  };

  beforeEach(() => {
    // Mock clipboard API
    Object.defineProperty(navigator, 'clipboard', {
      value: mockClipboard,
      writable: true,
      configurable: true,
    });
    mockClipboard.writeText.mockClear();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders citation text', () => {
    render(<CitationView citation={mockCitation} />);

    expect(screen.getByText('Citation')).toBeInTheDocument();
    expect(screen.getByText(/Data Science Services at Broad Clinical Laboratories/)).toBeInTheDocument();
  });

  it('renders copy button', () => {
    render(<CitationView citation={mockCitation} />);

    expect(screen.getByRole('button', { name: /copy citation/i })).toBeInTheDocument();
  });

  it('shows "Copied!" text after copying', async () => {
    const user = userEvent.setup();
    render(<CitationView citation={mockCitation} />);

    const copyButton = screen.getByRole('button', { name: /copy citation/i });
    await user.click(copyButton);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /copied!/i })).toBeInTheDocument();
    });
  });

  it('renders markdown formatted citation', () => {
    const markdownCitation = 'Author Name. (2026, Jul 9). *Pipeline Name* (v1). https://example.com/';
    render(<CitationView citation={markdownCitation} />);

    // Check that markdown is rendered (the italic text should be in an em tag)
    const emElements = document.querySelectorAll('em');
    expect(emElements.length).toBeGreaterThan(0);
  });
});
