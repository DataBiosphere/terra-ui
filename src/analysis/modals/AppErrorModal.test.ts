import { act, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { h } from 'react-hyperscript-helpers';
import {
  appError,
  generateTestAppWithAzureWorkspace,
  generateTestAppWithGoogleWorkspace,
  listAppToGetApp,
} from 'src/analysis/_testData/testData';
import { AppErrorModal, AppErrorModalProps } from 'src/analysis/modals/AppErrorModal';
import { LeoAppProvider } from 'src/libs/ajax/leonardo/providers/LeoAppProvider';
import { asMockedFn, renderWithAppContexts as render } from 'src/testing/test-utils';
import { defaultAzureWorkspace, defaultGoogleWorkspace } from 'src/testing/workspace-fixtures';

jest.mock('src/libs/notifications', () => ({
  notify: jest.fn(),
}));

type ModalMockExports = typeof import('src/components/Modal.mock');
jest.mock('src/components/Modal', () => {
  const mockModal = jest.requireActual<ModalMockExports>('src/components/Modal.mock');
  return mockModal.mockModalModule();
});

const getMockLeoAppProvider = (overrides?: Partial<LeoAppProvider>): LeoAppProvider => {
  const defaultProvider: LeoAppProvider = {
    listWithoutProject: jest.fn(),
    pause: jest.fn(),
    delete: jest.fn(),
    get: jest.fn(),
  };
  asMockedFn(defaultProvider.listWithoutProject).mockResolvedValue([]);

  return { ...defaultProvider, ...overrides };
};

describe('AppErrorModal', () => {
  it.each([
    { app: generateTestAppWithAzureWorkspace({ errors: [appError] }, defaultAzureWorkspace) },
    { app: generateTestAppWithGoogleWorkspace({ errors: [appError] }, defaultGoogleWorkspace) },
  ])(
    'displays an error for an app and calls the app provider for cloud: ($app.cloudContext.cloudProvider)',
    async ({ app }) => {
      // Arrange
      const providerOverrides = { get: jest.fn(() => Promise.resolve(listAppToGetApp(app))) };
      const appProvider = getMockLeoAppProvider(providerOverrides);

      const props: AppErrorModalProps = {
        appProvider,
        onDismiss: jest.fn(),
        app,
      };

      // Act
      await act(async () => {
        render(h(AppErrorModal, props));
      });

      // Assert
      screen.getByText(appError.errorMessage);
      expect(appProvider.get).toHaveBeenCalledTimes(1);
      expect(appProvider.get).toHaveBeenCalledWith(app);
    }
  );

  it('calls on dismiss', async () => {
    // Arrange
    const user = userEvent.setup();
    const app = generateTestAppWithAzureWorkspace({ errors: [appError] }, defaultAzureWorkspace);
    const providerOverrides = { get: jest.fn(() => Promise.resolve(listAppToGetApp(app))) };
    const appProvider = getMockLeoAppProvider(providerOverrides);
    const onDismiss = jest.fn();

    const props: AppErrorModalProps = {
      appProvider,
      onDismiss,
      app,
    };

    // Act
    await act(async () => {
      render(h(AppErrorModal, props));
    });
    const okButton = screen.getByText('OK');
    await user.click(okButton);

    // Assert
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('displays no error messages found if there is no return from provider', async () => {
    const app = generateTestAppWithAzureWorkspace({ errors: [appError] }, defaultAzureWorkspace);
    const appProvider = getMockLeoAppProvider();

    const props: AppErrorModalProps = {
      appProvider,
      onDismiss: jest.fn(),
      app,
    };

    // Act
    await act(async () => {
      render(h(AppErrorModal, props));
    });

    // Assert
    screen.getByText('No error messages found for app.');
  });
});
