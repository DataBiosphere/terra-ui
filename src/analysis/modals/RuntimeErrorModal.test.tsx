import { act, screen } from '@testing-library/react';
import React from 'react';
import { RuntimeBasics } from 'src/libs/ajax/leonardo/providers/LeoRuntimeProvider';
import { asMockedFn, mockNotifications, renderWithAppContexts as render } from 'src/testing/test-utils';

import { RuntimeErrorModal, RuntimeErrorProvider, text } from './RuntimeErrorModal';

describe('RuntimeErrorModal', () => {
  it('renders basic error', async () => {
    const runtime: RuntimeBasics = {
      cloudContext: {
        cloudProvider: 'GCP',
        cloudResource: 'myCloudResource',
      },
      runtimeName: 'myRuntime',
      googleProject: 'myProject',
      workspaceId: 'myWorkspace',
    };
    const errorProvider: RuntimeErrorProvider = {
      errorInfo: jest.fn(),
    };
    asMockedFn(errorProvider.errorInfo).mockResolvedValue({
      errorType: 'ErrorList',
      errors: [{ errorMessage: 'Runtime went BOOM!', errorCode: 123, timestamp: '0' }],
    });
    const onDismiss = jest.fn();

    // Act
    await act(() =>
      render(<RuntimeErrorModal runtime={runtime} onDismiss={onDismiss} errorProvider={errorProvider} />)
    );

    // Assert
    screen.getByText(text.error.title.standard);
    screen.getByText('Runtime went BOOM!');
  });

  it('renders unknown error', async () => {
    const runtime: RuntimeBasics = {
      cloudContext: {
        cloudProvider: 'GCP',
        cloudResource: 'myCloudResource',
      },
      runtimeName: 'myRuntime',
      googleProject: 'myProject',
      workspaceId: 'myWorkspace',
    };
    const errorProvider: RuntimeErrorProvider = {
      errorInfo: jest.fn(),
    };
    asMockedFn(errorProvider.errorInfo).mockResolvedValue({
      errorType: 'ErrorList',
      errors: [],
    });
    const onDismiss = jest.fn();

    // Act
    await act(() =>
      render(<RuntimeErrorModal runtime={runtime} onDismiss={onDismiss} errorProvider={errorProvider} />)
    );

    // Assert
    screen.getByText(text.error.title.standard);
    screen.getByText(text.error.unknown);
  });

  it('renders cannot retrieve error', async () => {
    const runtime: RuntimeBasics = {
      cloudContext: {
        cloudProvider: 'GCP',
        cloudResource: 'myCloudResource',
      },
      runtimeName: 'myRuntime',
      googleProject: 'myProject',
      workspaceId: 'myWorkspace',
    };
    const errorProvider: RuntimeErrorProvider = {
      errorInfo: jest.fn(),
    };
    asMockedFn(errorProvider.errorInfo).mockRejectedValue(new Error('BOOM!'));
    const onDismiss = jest.fn();

    // Act
    await act(() =>
      render(<RuntimeErrorModal runtime={runtime} onDismiss={onDismiss} errorProvider={errorProvider} />)
    );

    // Assert
    screen.getByText(text.error.title.standard);
    expect(mockNotifications.notify).toBeCalledTimes(1);
    expect(mockNotifications.notify).toBeCalledWith('error', text.error.cantRetrieve, { detail: new Error('BOOM!') });
  });

  it('renders user script error', async () => {
    const runtime: RuntimeBasics = {
      cloudContext: {
        cloudProvider: 'GCP',
        cloudResource: 'myCloudResource',
      },
      runtimeName: 'myRuntime',
      googleProject: 'myProject',
      workspaceId: 'myWorkspace',
    };
    const errorProvider: RuntimeErrorProvider = {
      errorInfo: jest.fn(),
    };
    asMockedFn(errorProvider.errorInfo).mockResolvedValue({
      errorType: 'UserScriptError',
      detail: 'user script error detail',
    });
    const onDismiss = jest.fn();

    // Act
    await act(() =>
      render(<RuntimeErrorModal runtime={runtime} onDismiss={onDismiss} errorProvider={errorProvider} />)
    );

    // Assert
    screen.getByText(text.error.title.userScript);
    screen.getByText('user script error detail');
  });
});
