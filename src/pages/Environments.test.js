import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { h } from 'react-hyperscript-helpers';
import { PauseButton } from 'src/pages/Environments';
import { cloudProviders } from 'src/pages/workspaces/workspace/analysis/utils/runtime-utils';

describe('Environments', () => {
  it.each([
    { cloudContext: cloudProviders.gcp.label, label: 'Cromwell' },
    { cloudContext: cloudProviders.azure.label, label: 'CromwellOnAzure' },
  ])('should enable pause for azure and google', async ({ cloudContext, label }) => {
    // Arrange
    const pauseComputeAndRefresh = jest.fn();
    const testCompute = {
      appName: 'test-app',
      cloudContext,
      kubernetesRuntimeConfig: { numNodes: 1, machineType: 'n1-highmem-8', autoscalingEnabled: false },
      errors: [],
      status: 'RUNNING',
      proxyUrls: {},
      customEnvironmentVariables: {},
      auditInfo: {
        creator: 'Jake',
        createdDate: '2022-01-24T15:27:28.740880Z',
        dateAccessed: '2022-02-24T15:27:28.740880Z',
      },
      appType: label,
      labels: { tool: '' },
    };

    await act(async () => { render(h(PauseButton, { computeType: 'app', cloudEnvironment: testCompute, currentUser: 'Jake', pauseComputeAndRefresh })) }) //eslint-disable-line
    // Act
    const pauseButton = screen.getByText('Pause');
    // Assert
    expect(pauseButton).toBeEnabled();
    // Act
    await userEvent.click(pauseButton);
    // Assert
    expect(pauseComputeAndRefresh).toHaveBeenCalled();
  });
});
