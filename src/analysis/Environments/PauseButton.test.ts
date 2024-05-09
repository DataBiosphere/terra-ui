import { fireEvent, screen } from '@testing-library/react';
import { h } from 'react-hyperscript-helpers';
import { appStatuses } from 'src/libs/ajax/leonardo/models/app-models';
import { ListRuntimeItem, runtimeStatuses } from 'src/libs/ajax/leonardo/models/runtime-models';
import { asMockedFn, renderWithAppContexts as render } from 'src/testing/test-utils';

import { generateTestApp, generateTestListGoogleRuntime } from '../_testData/testData';
import { isPauseSupported } from '../utils/tool-utils';
import { LeoResourcePermissionsProvider } from './Environments.models';
import {
  isComputePausable,
  pauseableAppStatuses,
  pauseableRuntimeStatuses,
  PauseButton,
  PauseButtonProps,
} from './PauseButton';

type ToolUtilsExports = typeof import('src/analysis/utils/tool-utils');
jest.mock('src/analysis/utils/tool-utils', (): ToolUtilsExports => {
  return {
    ...jest.requireActual<ToolUtilsExports>('src/analysis/utils/tool-utils'),
    isPauseSupported: jest.fn(),
  };
});

const mockPermissions: LeoResourcePermissionsProvider = {
  hasDeleteDiskPermission: jest.fn(),
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
  beforeEach(() => {
    asMockedFn(isPauseSupported).mockReturnValue(true);
  });
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

  // TODO: change it so we don't hide when they don't have permission and only hide when disallowed?
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
    const pauseButton = screen.queryByText('Pause');
    expect(pauseButton).toBeNull();
  });

  it('Hides pause button when pause is not supported', () => {
    // Arrange
    const permissions = { ...mockPermissions, hasPausePermission: jest.fn().mockReturnValue(true) };
    const pauseProps: PauseButtonProps = {
      ...defaultPauseProps,
      permissions,
      cloudEnvironment: generateTestListGoogleRuntime(),
    };
    asMockedFn(isPauseSupported).mockReturnValue(false);

    // Act
    render(h(PauseButton, pauseProps));

    // Assert
    const pauseButton = screen.queryByText('Pause');
    expect(pauseButton).toBeNull();
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

  it.each(pauseableRuntimeStatuses)('Says the appropriate runtime statuses are pausable', (status) => {
    // Assert
    expect(isComputePausable({ ...generateTestListGoogleRuntime(), status })).toBe(true);
  });

  it.each([runtimeStatuses.deleted.leoLabel, runtimeStatuses.deleting.leoLabel, runtimeStatuses.error.leoLabel])(
    'Says the appropriate runtime statuses are not pausable',
    (status) => {
      // Assert
      expect(isComputePausable({ ...generateTestListGoogleRuntime(), status })).toBe(false);
    }
  );

  it.each([appStatuses.deleted.status, appStatuses.deleting.status, appStatuses.error.status])(
    'Says the appropriate app statuses are not pausable',
    (status) => {
      // Assert
      expect(isComputePausable({ ...generateTestApp(), status })).toBe(false);
    }
  );

  it.each(pauseableAppStatuses)('Says the appropriate app statuses are pausable', (status) => {
    // Assert
    expect(isComputePausable({ ...generateTestApp(), status })).toBe(true);
  });
});
