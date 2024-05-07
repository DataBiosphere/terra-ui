import { fireEvent, screen } from '@testing-library/react';
import { h } from 'react-hyperscript-helpers';
import { ListRuntimeItem, runtimeStatuses } from 'src/libs/ajax/leonardo/models/runtime-models';
import { renderWithAppContexts as render } from 'src/testing/test-utils';

import { generateTestListGoogleRuntime } from '../_testData/testData';
import { LeoResourcePermissionsProvider } from './Environments.models';
import { PauseButton, PauseButtonProps } from './PauseButton';

const mockPermissions: LeoResourcePermissionsProvider = {
  hasDeletePermission: jest.fn(),
  hasPausePermission: jest.fn(),
  isAppInDeletableState: jest.fn(),
  isResourceInDeletableState: jest.fn(),
};

const defaultPauseProps: PauseButtonProps = {
  cloudEnvironment: generateTestListGoogleRuntime(),
  permissions: mockPermissions,
  pauseComputeAndRefresh: jest.fn(),
};

describe('PauseButton', () => {
  it.each([
    {
      cloudEnvironment: { ...generateTestListGoogleRuntime(), status: runtimeStatuses.error.leoLabel },
      isPauseEnabled: false,
    },
    {
      cloudEnvironment: { ...generateTestListGoogleRuntime(), status: runtimeStatuses.running.leoLabel },
      isPauseEnabled: true,
    },
  ] as { cloudEnvironment: ListRuntimeItem; isPauseEnabled: boolean }[])(
    'Renders pause button enabled/disabled properly when user has permission, depending on resource status',
    ({ cloudEnvironment, isPauseEnabled }) => {
      // Arrange
      const permissions = { ...mockPermissions, hasPausePermission: jest.fn().mockReturnValue(true) };
      const pauseProps: PauseButtonProps = { ...defaultPauseProps, permissions, cloudEnvironment };

      // Act
      render(h(PauseButton, pauseProps));

      // Assert
      const pauseButton = screen.getByText('Pause');
      expect(pauseButton.getAttribute('aria-disabled')).toBe(`${!isPauseEnabled}`);
      expect(pauseButton).toBeVisible();
    }
  );

  it('Hides pause button when user doesnt have permission', () => {
    // Arrange
    const permissions = { ...mockPermissions, hasPausePermission: jest.fn().mockReturnValue(false) };
    const pauseProps: PauseButtonProps = {
      ...defaultPauseProps,
      permissions,
      cloudEnvironment: generateTestListGoogleRuntime(),
    };

    // Act
    render(h(PauseButton, pauseProps));

    // Assert
    const pauseButton = screen.getByText('Pause');
    expect(pauseButton).not.toBeVisible();
  });

  it('Calls pause function when clicked', () => {
    // Arrange
    const permissions = { ...mockPermissions, hasPausePermission: jest.fn().mockReturnValue(true) };
    const pauseFn = jest.fn();
    const cloudEnvironment = generateTestListGoogleRuntime();
    const pauseProps: PauseButtonProps = { permissions, cloudEnvironment, pauseComputeAndRefresh: pauseFn };

    // Act
    render(h(PauseButton, pauseProps));
    const pauseButton = screen.getByText('Pause');
    fireEvent.click(pauseButton);

    // Assert
    expect(pauseFn).toBeCalledTimes(1);
    expect(pauseFn).toBeCalledWith(cloudEnvironment);
  });
});
