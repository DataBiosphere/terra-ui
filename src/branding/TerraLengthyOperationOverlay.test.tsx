import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { TerraLengthyOperationOverlay } from 'src/branding/TerraLengthyOperationOverlay';

describe('TerraLengthyOperationOverlay', () => {
  it('renders the message and default content', async () => {
    render(<TerraLengthyOperationOverlay message='Processing your request.' size={150} />);
    await waitFor(() => {
      expect(screen.getByText('Please stand by...')).not.toBeNull();
      expect(screen.getByText('Processing your request.')).not.toBeNull();
      expect(screen.getByText('This may take a few minutes.')).not.toBeNull();
      expect(screen.getByText('Loading...')).not.toBeNull();
    });
  });

  it('renders the tip when provided', async () => {
    render(
      <TerraLengthyOperationOverlay
        message='Processing your request.'
        tip='You can continue working in another tab.'
        size={150}
      />
    );
    await waitFor(() => {
      expect(screen.getByText('Tip:')).not.toBeNull();
      expect(screen.getByText('You can continue working in another tab.')).not.toBeNull();
    });
  });

  it('does not render the tip when not provided', async () => {
    render(<TerraLengthyOperationOverlay message='Processing your request.' size={150} />);
    await waitFor(() => {
      expect(screen.queryByText('Tip:')).toBeNull();
    });
  });
});
