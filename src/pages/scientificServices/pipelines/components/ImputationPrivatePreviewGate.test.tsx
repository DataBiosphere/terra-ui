import { asMockedFn } from '@terra-ui-packages/test-utils';
import { screen } from '@testing-library/react';
import React from 'react';
import { isFeaturePreviewEnabled } from 'src/libs/feature-previews';
import { renderWithAppContexts as render } from 'src/testing/test-utils';

import { ImputationPrivatePreviewGate } from './ImputationPrivatePreviewGate';

jest.mock('src/libs/feature-previews', () => ({
  ...jest.requireActual('src/libs/feature-previews'),
  isFeaturePreviewEnabled: jest.fn(),
}));

describe('ImputationPrivatePreviewGate', () => {
  const PrivateFeature = () => <div data-testid='private-feature'>You have access to see this secret feature!</div>;

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('displays the feature gate text when feature is disabled', () => {
    asMockedFn(isFeaturePreviewEnabled).mockReturnValue(false);

    render(
      <ImputationPrivatePreviewGate>
        <PrivateFeature />
      </ImputationPrivatePreviewGate>
    );

    expect(screen.getByText(/Thank you for registering for the/)).toBeInTheDocument();
    expect(
      screen.getByText(/The All of Us \+ Anvil Imputation Service user interface is currently in private preview/)
    ).toBeInTheDocument();

    // Feature component should not be rendered
    expect(screen.queryByTestId('private-feature')).not.toBeInTheDocument();
  });

  it('displays child component when feature is enabled', () => {
    asMockedFn(isFeaturePreviewEnabled).mockReturnValue(true);

    render(
      <ImputationPrivatePreviewGate>
        <PrivateFeature />
      </ImputationPrivatePreviewGate>
    );

    expect(screen.getByTestId('private-feature')).toBeInTheDocument();
    expect(screen.getByText('You have access to see this secret feature!')).toBeInTheDocument();

    // Feature preview text should not be rendered
    expect(screen.queryByText(/Thank you for registering for the/)).not.toBeInTheDocument();
  });
});
