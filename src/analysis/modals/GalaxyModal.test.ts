import { fireEvent, screen, waitFor } from '@testing-library/react';
import { h } from 'react-hyperscript-helpers';
import { GalaxyModalBase } from 'src/analysis/modals/GalaxyModal';
import { renderWithAppContexts as render } from 'src/testing/test-utils';
import * as workspaceUtils from 'src/workspaces/utils';

const defaultWorkspace = {
  workspace: {
    namespace: 'test-ns',
    bucketName: 'test-bucket',
    name: 'test-workspace',
    googleProject: 'test-project',
    isLocked: false,
  },
};

const defaultProps = {
  onDismiss: jest.fn(),
  onError: jest.fn(),
  onSuccess: jest.fn(),
  apps: [],
  appDataDisks: [],
  workspace: defaultWorkspace,
};

it('disables Next button when workspace is locked', async () => {
  const lockedMessage = 'This workspace is locked';
  jest.spyOn(workspaceUtils, 'canEditWorkspace').mockReturnValue({ value: false, message: lockedMessage });
  render(h(GalaxyModalBase, defaultProps));
  const nextButton = screen.getByRole('button', { name: /next/i });
  expect(nextButton).toHaveAttribute('aria-disabled', 'true');
  // Hover over the button
  fireEvent.mouseEnter(nextButton);

  // Look for tooltip text in the document
  await waitFor(() => {
    const tooltipElements = screen.getAllByText('This workspace is locked');
    expect(tooltipElements.length).toBeGreaterThan(0);
  });
});
