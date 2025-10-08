import { screen } from '@testing-library/react';
import { h } from 'react-hyperscript-helpers';
import { GalaxyModalBase } from 'src/analysis/modals/GalaxyModal';
import { renderWithAppContexts as render } from 'src/testing/test-utils';

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

it('disables Next button when workspace is locked', () => {
  const lockedWorkspace = {
    ...defaultWorkspace,
    workspace: { ...defaultWorkspace.workspace, isLocked: true },
  };
  render(h(GalaxyModalBase, { ...defaultProps, workspace: lockedWorkspace }));
  const nextButton = screen.getByRole('button', { name: /next/i });
  expect(nextButton).toHaveAttribute('aria-disabled', 'true');
});
