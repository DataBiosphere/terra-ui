import { asMockedFn } from '@terra-ui-packages/test-utils';
import { fireEvent, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { div, h } from 'react-hyperscript-helpers';
import { MenuTrigger } from 'src/components/PopupTrigger';
import { Ajax } from 'src/libs/ajax';
import Events, { extractWorkspaceDetails } from 'src/libs/events';
import { isFeaturePreviewEnabled } from 'src/libs/feature-previews';
import { GCP_BUCKET_LIFECYCLE_RULES } from 'src/libs/feature-previews-config';
import { renderWithAppContexts as render } from 'src/testing/test-utils';
import { defaultGoogleWorkspace, protectedDataPolicy } from 'src/testing/workspace-fixtures';
import { useWorkspaceDetails } from 'src/workspaces/common/state/useWorkspaceDetails';
import { tooltipText, WorkspaceMenu } from 'src/workspaces/common/WorkspaceMenu';
import * as WorkspaceUtils from 'src/workspaces/utils';
import { AzureWorkspace, GoogleWorkspace, WorkspaceAccessLevel } from 'src/workspaces/utils';

type AjaxContract = ReturnType<typeof Ajax>;

jest.mock('src/libs/ajax');

type UseWorkspaceDetailsExports = typeof import('src/workspaces/common/state/useWorkspaceDetails');
jest.mock('src/workspaces/common/state/useWorkspaceDetails', (): UseWorkspaceDetailsExports => {
  return {
    ...jest.requireActual<UseWorkspaceDetailsExports>('src/workspaces/common/state/useWorkspaceDetails'),
    useWorkspaceDetails: jest.fn(),
  };
});

// Mocking PopupTrigger to avoid test environment issues with React Portal's requirement to use
// DOM measure services which are not available in jest environment
jest.mock('src/components/PopupTrigger', () => {
  const originalModule = jest.requireActual('src/components/PopupTrigger');
  return {
    ...originalModule,
    MenuTrigger: jest.fn(),
  };
});

type FeaturePreviewsExports = typeof import('src/libs/feature-previews');
jest.mock('src/libs/feature-previews', (): FeaturePreviewsExports => {
  return {
    ...jest.requireActual<FeaturePreviewsExports>('src/libs/feature-previews'),
    isFeaturePreviewEnabled: jest.fn(),
  };
});

const workspaceMenuProps = {
  iconSize: 20,
  popupLocation: 'left',
  callbacks: {
    onClone: () => {},
    onShare: () => {},
    onLock: () => {},
    onDelete: () => {},
    onLeave: () => {},
    onShowSettings: () => {},
  },
  workspaceInfo: { name: 'example1', namespace: 'example-billing-project' },
};

const descriptionText =
  'This description is longer then two hundred and fifty five characters, to ensure we can test that all two hundred and fifty five characters actually get copied over during a cloning event. If they are not copied over then it is indeed a bug that needs to fail the test. (280chars)';
const googleWorkspace: GoogleWorkspace = {
  // @ts-expect-error - Limit return values based on what is requested
  workspace: {
    cloudPlatform: 'Gcp',
    googleProject: 'googleProjectName',
    bucketName: 'fc-bucketname',
    isLocked: false,
    state: 'Ready',
    attributes: {
      description: descriptionText,
    },
  },
  accessLevel: 'OWNER',
  canShare: true,
  policies: [],
};

const azureWorkspace: AzureWorkspace = {
  // @ts-expect-error - Limit return values based on what is requested
  workspace: {
    cloudPlatform: 'Azure',
    isLocked: false,
    state: 'Ready',
    attributes: {
      description: descriptionText,
    },
  },
  accessLevel: 'OWNER',
  canShare: true,
  policies: [protectedDataPolicy],
};

beforeEach(() => {
  asMockedFn(MenuTrigger).mockImplementation(({ content }) => {
    return div({ role: 'menu' }, [content]);
  });
});

describe('WorkspaceMenu - undefined workspace', () => {
  beforeEach(() => {
    // Arrange
    asMockedFn(useWorkspaceDetails).mockReturnValue({ workspace: undefined, loading: false, refresh: jest.fn() });
    // Enable feature flag for Settings menu (check to be removed when soft delete option is added).
    asMockedFn(isFeaturePreviewEnabled).mockImplementation((id) => id === GCP_BUCKET_LIFECYCLE_RULES);
  });

  it('should not fail any accessibility tests', async () => {
    // Act
    const { container } = render(h(WorkspaceMenu, workspaceMenuProps));
    // Assert
    expect(await axe(container)).toHaveNoViolations();
  });

  it.each(['Clone', 'Share', 'Lock', 'Leave', 'Delete', 'Settings'])('renders menu item %s as disabled', (menuText) => {
    // Act
    render(h(WorkspaceMenu, workspaceMenuProps));
    const menuItem = screen.getByText(menuText);
    // Assert
    expect(menuItem).toHaveAttribute('disabled');
  });

  it.each([
    { menuText: 'Share', tooltipText: tooltipText.shareNoPermission },
    { menuText: 'Delete', tooltipText: tooltipText.deleteLocked },
    { menuText: 'Delete', tooltipText: tooltipText.deleteNoPermission },
    { menuText: 'Lock', tooltipText: tooltipText.lockNoPermission },
    { menuText: 'Settings', tooltipText: tooltipText.azureWorkspaceNoSettings },
  ])('does not render tooltip text "$tooltipText" for menu item $menuText', ({ menuText, tooltipText }) => {
    // Act
    render(h(WorkspaceMenu, workspaceMenuProps));
    fireEvent.mouseOver(screen.getByText(menuText));
    // Assert
    expect(screen.queryByText(tooltipText)).toBeNull();
  });
});

describe('WorkspaceMenu - defined workspace (GCP or Azure)', () => {
  beforeEach(() => {
    // Enable feature flag for Settings menu (check to be removed when soft delete option is added).
    asMockedFn(isFeaturePreviewEnabled).mockImplementation((id) => id === GCP_BUCKET_LIFECYCLE_RULES);
  });

  it('should not fail any accessibility tests', async () => {
    // Arrange
    asMockedFn(useWorkspaceDetails).mockReturnValue({
      workspace: defaultGoogleWorkspace,
      refresh: jest.fn(),
      loading: false,
    }); // Act
    const { container } = render(h(WorkspaceMenu, workspaceMenuProps));
    // Assert
    expect(await axe(container)).toHaveNoViolations();
  });

  it('renders menu item Clone as enabled', () => {
    // Arrange
    asMockedFn(useWorkspaceDetails).mockReturnValue({
      workspace: defaultGoogleWorkspace,
      refresh: jest.fn(),
      loading: false,
    });
    // Act
    render(h(WorkspaceMenu, workspaceMenuProps));
    const menuItem = screen.getByText('Clone');
    // Assert
    expect(menuItem).not.toHaveAttribute('disabled');
  });

  it('renders menu item Leave as enabled', () => {
    // Arrange
    asMockedFn(useWorkspaceDetails).mockReturnValue({
      workspace: defaultGoogleWorkspace,
      refresh: jest.fn(),
      loading: false,
    });
    // Act
    render(h(WorkspaceMenu, workspaceMenuProps));
    const menuItem = screen.getByText('Leave');
    // Assert
    expect(menuItem).not.toHaveAttribute('disabled');
  });

  it.each([true, false])('enables/disables Share menu item based on canShare: %s', (canShare) => {
    // Arrange
    asMockedFn(useWorkspaceDetails).mockReturnValue({
      workspace: { ...defaultGoogleWorkspace, canShare },
      refresh: jest.fn(),
      loading: false,
    });
    // Act
    render(h(WorkspaceMenu, workspaceMenuProps));
    const menuItem = screen.getByText('Share');
    // Assert
    if (canShare) {
      expect(menuItem).not.toHaveAttribute('disabled');
    } else {
      expect(menuItem).toHaveAttribute('disabled');
    }
  });

  it('disables all items except Share for a workspace that is deleting', () => {
    // Arrange
    asMockedFn(useWorkspaceDetails).mockReturnValue({
      workspace: {
        ...defaultGoogleWorkspace,
        workspace: {
          ...defaultGoogleWorkspace.workspace,
          state: 'Deleting',
        },
      },
      refresh: jest.fn(),
      loading: false,
    });
    // Act
    render(h(WorkspaceMenu, workspaceMenuProps));
    // Assert
    const share = screen.getByText('Share');
    expect(share).not.toHaveAttribute('disabled');

    const clone = screen.getByText('Clone');
    expect(clone).toHaveAttribute('disabled');

    const lock = screen.getByText('Lock');
    expect(lock).toHaveAttribute('disabled');

    const leave = screen.getByText('Leave');
    expect(leave).toHaveAttribute('disabled');

    const deleteItem = screen.getByText('Delete');
    expect(deleteItem).toHaveAttribute('disabled');

    const settingsItem = screen.getByText('Settings');
    expect(settingsItem).toHaveAttribute('disabled');
  });

  it('disables all items except Share and Delete for a workspace in state DeleteFailed', () => {
    // Arrange
    asMockedFn(useWorkspaceDetails).mockReturnValue({
      workspace: {
        ...defaultGoogleWorkspace,
        workspace: {
          ...defaultGoogleWorkspace.workspace,
          state: 'DeleteFailed',
        },
      },
      refresh: jest.fn(),
      loading: false,
    });
    // Act
    render(h(WorkspaceMenu, workspaceMenuProps));

    // Assert
    const share = screen.getByText('Share');
    expect(share).not.toHaveAttribute('disabled');

    const deleteItem = screen.getByText('Delete');
    expect(deleteItem).not.toHaveAttribute('disabled');

    const clone = screen.getByText('Clone');
    expect(clone).toHaveAttribute('disabled');

    const lock = screen.getByText('Lock');
    expect(lock).toHaveAttribute('disabled');

    const leave = screen.getByText('Leave');
    expect(leave).toHaveAttribute('disabled');

    const settingsItem = screen.getByText('Settings');
    expect(settingsItem).toHaveAttribute('disabled');
  });

  it.each([true, false])('renders Share tooltip based on canShare: %s', (canShare) => {
    // Arrange
    asMockedFn(useWorkspaceDetails).mockReturnValue({
      workspace: { ...defaultGoogleWorkspace, canShare },
      refresh: jest.fn(),
      loading: false,
    }); // Act
    render(h(WorkspaceMenu, workspaceMenuProps));
    const menuItem = screen.getByText('Share');
    fireEvent.mouseOver(menuItem);
    // Assert
    if (canShare) {
      expect(screen.queryByRole('tooltip', { name: tooltipText.shareNoPermission })).toBeNull();
    } else {
      expect(screen.queryByRole('tooltip', { name: tooltipText.shareNoPermission })).not.toBeNull();
    }
  });

  it.each([
    { menuText: 'Lock', accessLevel: 'OWNER' },
    { menuText: 'Lock', accessLevel: 'READER' },
    { menuText: 'Unlock', accessLevel: 'OWNER' },
    { menuText: 'Unlock', accessLevel: 'READER' },
  ] as { menuText: string; accessLevel: WorkspaceAccessLevel }[])(
    'enables/disables $menuText menu item based on access level $accessLevel',
    ({ menuText, accessLevel }) => {
      // Arrange
      asMockedFn(useWorkspaceDetails).mockReturnValue({
        workspace: {
          ...defaultGoogleWorkspace,
          accessLevel: accessLevel as WorkspaceAccessLevel,
          workspace: {
            ...defaultGoogleWorkspace.workspace,
            isLocked: menuText === 'Unlock',
          },
        },
        refresh: jest.fn(),
        loading: false,
      });
      // Act
      render(h(WorkspaceMenu, workspaceMenuProps));
      const menuItem = screen.getByText(menuText);
      // Assert
      if (WorkspaceUtils.isOwner(accessLevel)) {
        expect(menuItem).not.toHaveAttribute('disabled');
      } else {
        expect(menuItem).toHaveAttribute('disabled');
      }
    }
  );

  it.each([
    { menuText: 'Unlock', tooltipText: tooltipText.unlockNoPermission },
    { menuText: 'Lock', tooltipText: tooltipText.lockNoPermission },
  ])('renders $menuText menu item tooltip "$tooltipText" for access level READER', ({ menuText, tooltipText }) => {
    // Arrange
    asMockedFn(useWorkspaceDetails).mockReturnValue({
      workspace: {
        ...defaultGoogleWorkspace,
        accessLevel: 'READER',
        workspace: {
          ...defaultGoogleWorkspace.workspace,
          isLocked: menuText === 'Unlock',
        },
      },
      refresh: jest.fn(),
      loading: false,
    });
    // Act
    render(h(WorkspaceMenu, workspaceMenuProps));
    fireEvent.mouseOver(screen.getByText(menuText));
    // Assert
    expect(screen.queryByRole('tooltip', { name: tooltipText })).not.toBeNull();
  });

  it.each([
    { accessLevel: 'READER', locked: true },
    { accessLevel: 'OWNER', locked: true },
    { accessLevel: 'READER', locked: false },
    { accessLevel: 'OWNER', locked: false },
  ] as { accessLevel: WorkspaceAccessLevel; locked: boolean }[])(
    'renders Delete menu item as enabled/disabled for access level $accessLevel and locked status $locked',
    ({ accessLevel, locked }) => {
      // Arrange
      asMockedFn(useWorkspaceDetails).mockReturnValue({
        workspace: {
          ...defaultGoogleWorkspace,
          accessLevel,
          workspace: {
            ...defaultGoogleWorkspace.workspace,
            isLocked: locked,
          },
        },
        refresh: jest.fn(),
        loading: false,
      });
      // Act
      render(h(WorkspaceMenu, workspaceMenuProps));
      const menuItem = screen.getByText('Delete');
      // Assert
      if (!locked && WorkspaceUtils.isOwner(accessLevel as WorkspaceAccessLevel)) {
        expect(menuItem).not.toHaveAttribute('disabled');
      } else {
        expect(menuItem).toHaveAttribute('disabled');
      }
    }
  );

  it.each([
    { accessLevel: 'READER', locked: true },
    { accessLevel: 'OWNER', locked: true },
    { accessLevel: 'READER', locked: false },
    { accessLevel: 'OWNER', locked: false },
  ] as { accessLevel: WorkspaceAccessLevel; locked: boolean }[])(
    'renders Delete tooltip for access level $accessLevel and locked status $locked',
    ({ accessLevel, locked }) => {
      // Arrange
      asMockedFn(useWorkspaceDetails).mockReturnValue({
        workspace: {
          ...defaultGoogleWorkspace,
          accessLevel,
          workspace: {
            ...defaultGoogleWorkspace.workspace,
            isLocked: locked,
          },
        },
        refresh: jest.fn(),
        loading: false,
      });
      // Act
      render(h(WorkspaceMenu, workspaceMenuProps));
      fireEvent.mouseOver(screen.getByText('Delete'));
      // Assert
      if (!locked && WorkspaceUtils.isOwner(accessLevel as WorkspaceAccessLevel)) {
        expect(screen.queryByRole('tooltip', { name: tooltipText.deleteLocked })).toBeNull();
        expect(screen.queryByRole('tooltip', { name: tooltipText.deleteNoPermission })).toBeNull();
      } else if (locked) {
        expect(screen.queryByRole('tooltip', { name: tooltipText.deleteLocked })).not.toBeNull();
      } else {
        expect(screen.queryByRole('tooltip', { name: tooltipText.deleteNoPermission })).not.toBeNull();
      }
    }
  );

  it.each([
    { menuText: 'Share' },
    { menuText: 'Delete' },
    { menuText: 'Delete' },
    { menuText: 'Lock' },
    { menuText: 'Settings' },
  ])('events when the menu item $menuText is clicked', async ({ menuText }) => {
    // Arrange
    const user = userEvent.setup();
    asMockedFn(useWorkspaceDetails).mockReturnValue({
      workspace: {
        ...defaultGoogleWorkspace,
        accessLevel: 'OWNER' as WorkspaceAccessLevel,
        workspace: {
          ...defaultGoogleWorkspace.workspace,
          isLocked: false,
        },
      },
      refresh: jest.fn(),
      loading: false,
    });
    const captureEvent = jest.fn();
    asMockedFn(Ajax).mockImplementation(
      () =>
        ({
          Metrics: { captureEvent } as Partial<AjaxContract['Metrics']>,
        } as Partial<AjaxContract> as AjaxContract)
    );

    // Act
    render(h(WorkspaceMenu, workspaceMenuProps));
    const menuItem = screen.getByText(menuText);
    await user.click(menuItem);

    // Assert
    expect(captureEvent).toHaveBeenCalledWith(Events.workspaceMenu, {
      action: menuText,
      origin: 'list',
      ...extractWorkspaceDetails({
        namespace: workspaceMenuProps.workspaceInfo.namespace,
        name: workspaceMenuProps.workspaceInfo.name,
        cloudPlatform: 'Gcp',
      }),
    });
  });
});

describe('Settings menu item (GCP or Azure workspace)', () => {
  it('does not show the settings menu item if the feature flag is disabled', () => {
    asMockedFn(useWorkspaceDetails).mockReturnValue({
      workspace: googleWorkspace,
      refresh: jest.fn(),
      loading: false,
    });
    asMockedFn(isFeaturePreviewEnabled).mockReturnValue(false);

    // Act
    render(h(WorkspaceMenu, workspaceMenuProps));

    // Assert
    expect(screen.queryByText('Settings')).toBeNull();
  });

  it('Shows an enabled settings menu item for GCP workspaces if the feature flag is enabled', () => {
    asMockedFn(useWorkspaceDetails).mockReturnValue({
      workspace: googleWorkspace,
      refresh: jest.fn(),
      loading: false,
    });
    asMockedFn(isFeaturePreviewEnabled).mockImplementation((id) => id === GCP_BUCKET_LIFECYCLE_RULES);

    // Act
    render(h(WorkspaceMenu, workspaceMenuProps));

    // Assert
    const menuItem = screen.getByText('Settings');
    expect(menuItem).not.toHaveAttribute('disabled');
  });

  it('shows a disabled settings menu item with a tooltip for Azure workspaces if feature flag is enabled', () => {
    asMockedFn(useWorkspaceDetails).mockReturnValue({
      workspace: azureWorkspace,
      refresh: jest.fn(),
      loading: false,
    });
    asMockedFn(isFeaturePreviewEnabled).mockImplementation((id) => id === GCP_BUCKET_LIFECYCLE_RULES);

    // Act
    render(h(WorkspaceMenu, workspaceMenuProps));

    // Assert
    const menuItem = screen.getByText('Settings');
    expect(menuItem).toHaveAttribute('disabled');
    // Verify tooltip text
    screen.getByText(tooltipText.azureWorkspaceNoSettings);
  });
});

describe('DynamicWorkspaceMenuContent fetches specific workspace details', () => {
  const onClone = jest.fn((_policies, _bucketName, _description, _googleProject) => {});
  const onShare = jest.fn((_policies, _bucketName) => {});
  const namespace = 'test-namespace';
  const name = 'test-name';

  const workspaceMenuProps = {
    iconSize: 20,
    popupLocation: 'left',
    callbacks: {
      onClone,
      onShare,
      onLock: jest.fn(),
      onDelete: jest.fn(),
      onLeave: jest.fn(),
      onShowSettings: jest.fn(),
    },
    workspaceInfo: { namespace, name },
  };

  it('requests expected fields', async () => {
    // Arrange
    const workspaceDetails = asMockedFn(useWorkspaceDetails).mockReturnValue({
      workspace: googleWorkspace,
      refresh: jest.fn(),
      loading: false,
    });

    // cloudPlatform is necessary to determine if a workspace is a Google Workspace.
    const expectedRequestedFields = [
      'accessLevel',
      'canShare',
      'policies',
      'workspace.bucketName',
      'workspace.attributes.description',
      'workspace.cloudPlatform',
      'workspace.googleProject',
      'workspace.isLocked',
      'workspace.state',
    ];

    // Act
    render(h(WorkspaceMenu, workspaceMenuProps));

    // Assert
    expect(workspaceDetails).toHaveBeenCalledWith({ namespace, name }, expectedRequestedFields);
  });

  it('passes onClone the bucketName, description, and googleProject for a Google workspace', async () => {
    // Arrange
    const user = userEvent.setup();
    asMockedFn(useWorkspaceDetails).mockReturnValue({
      workspace: googleWorkspace,
      refresh: jest.fn(),
      loading: false,
    });
    const captureEvent = jest.fn();
    asMockedFn(Ajax).mockImplementation(
      () =>
        ({
          Metrics: { captureEvent } as Partial<AjaxContract['Metrics']>,
        } as Partial<AjaxContract> as AjaxContract)
    );

    // Act
    render(h(WorkspaceMenu, workspaceMenuProps));

    // Assert
    const menuItem = screen.getByText('Clone');
    await user.click(menuItem);
    expect(onClone).toBeCalledWith([], 'fc-bucketname', descriptionText, 'googleProjectName');
    expect(captureEvent).toHaveBeenCalledWith(Events.workspaceMenu, {
      action: 'Clone',
      origin: 'list',
      ...extractWorkspaceDetails({ namespace, name, cloudPlatform: 'Gcp' }),
    });
  });

  it('passes onClone the policies and description for an Azure workspace', async () => {
    // Arrange
    const user = userEvent.setup();
    asMockedFn(useWorkspaceDetails).mockReturnValue({
      workspace: azureWorkspace,
      refresh: jest.fn(),
      loading: false,
    });
    const captureEvent = jest.fn();
    asMockedFn(Ajax).mockImplementation(
      () =>
        ({
          Metrics: { captureEvent } as Partial<AjaxContract['Metrics']>,
        } as Partial<AjaxContract> as AjaxContract)
    );

    // Act
    render(h(WorkspaceMenu, workspaceMenuProps));

    // Assert
    const menuItem = screen.getByText('Clone');
    await user.click(menuItem);
    expect(onClone).toBeCalledWith([protectedDataPolicy], undefined, descriptionText, undefined);
    expect(captureEvent).toHaveBeenCalledWith(Events.workspaceMenu, {
      action: 'Clone',
      origin: 'list',
      ...extractWorkspaceDetails({ namespace, name, cloudPlatform: 'Azure' }),
    });
  });

  it('passes onShare the bucketName for a Google workspace', async () => {
    // Arrange
    const user = userEvent.setup();
    asMockedFn(useWorkspaceDetails).mockReturnValue({
      workspace: googleWorkspace,
      refresh: jest.fn(),
      loading: false,
    });

    // Act
    render(h(WorkspaceMenu, workspaceMenuProps));

    // Assert
    const menuItem = screen.getByText('Share');
    await user.click(menuItem);
    expect(onShare).toBeCalledWith([], 'fc-bucketname');
  });

  it('passes onShare the policies for an Azure workspace', async () => {
    // Arrange
    const user = userEvent.setup();
    asMockedFn(useWorkspaceDetails).mockReturnValue({
      workspace: azureWorkspace,
      refresh: jest.fn(),
      loading: false,
    });

    // Act
    render(h(WorkspaceMenu, workspaceMenuProps));

    // Assert
    const menuItem = screen.getByText('Share');
    await user.click(menuItem);
    expect(onShare).toBeCalledWith([protectedDataPolicy], undefined);
  });
});
