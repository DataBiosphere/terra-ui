import { abandonedPromise } from '@terra-ui-packages/core-utils';
import { asMockedFn, partial } from '@terra-ui-packages/test-utils';
import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { h } from 'react-hyperscript-helpers';
import { BillingProject } from 'src/billing-core/models';
import { Billing, BillingContract } from 'src/libs/ajax/billing/Billing';
import { FirecloudBucket, FirecloudBucketAjaxContract } from 'src/libs/ajax/firecloud/FirecloudBucket';
import { CurrentUserGroupMembership, GroupContract, Groups, GroupsContract } from 'src/libs/ajax/Groups';
import { Apps, AppsAjaxContract } from 'src/libs/ajax/leonardo/Apps';
import { Metrics, MetricsContract } from 'src/libs/ajax/Metrics';
import { WorkspaceData, WorkspaceDataAjaxContract } from 'src/libs/ajax/WorkspaceDataService';
import {
  WorkspaceContract,
  Workspaces,
  WorkspacesAjaxContract,
  WorkspaceV2Contract,
} from 'src/libs/ajax/workspaces/Workspaces';
import Events from 'src/libs/events';
import { goToPath } from 'src/libs/nav';
import { gcpBillingProject } from 'src/testing/billing-project-fixtures';
import { renderWithAppContexts as render, SelectHelper } from 'src/testing/test-utils';
import {
  defaultGoogleWorkspace,
  makeGoogleWorkspace,
  mockBucketRequesterPaysError,
} from 'src/testing/workspace-fixtures';
import { WorkspaceInfo, WorkspaceWrapper } from 'src/workspaces/utils';

import NewWorkspaceWizard from './NewWorkspaceWizard';

jest.mock('src/libs/ajax/billing/Billing');
jest.mock('src/libs/ajax/firecloud/FirecloudBucket');
jest.mock('src/libs/ajax/Groups');
jest.mock('src/libs/ajax/leonardo/Apps');
jest.mock('src/libs/ajax/Metrics');
jest.mock('src/libs/ajax/WorkspaceDataService');
jest.mock('src/libs/ajax/workspaces/Workspaces');

type NavExports = typeof import('src/libs/nav');
jest.mock(
  'src/libs/nav',
  (): NavExports => ({
    ...jest.requireActual<NavExports>('src/libs/nav'),
    getLink: jest.fn(() => '/'),
    goToPath: jest.fn(),
  })
);

interface SetupOptions {
  billingProjects?: BillingProject[];
  groups?: string[];
}

interface SetupResult {
  captureEvent: jest.MockedFunction<MetricsContract['captureEvent']>;
  checkBucketLocation: jest.MockedFunction<WorkspaceContract['checkBucketLocation']>;
  cloneWorkspace: jest.MockedFunction<WorkspaceV2Contract['clone']>;
  createWorkspace: jest.MockedFunction<WorkspacesAjaxContract['create']>;
  getWorkspaceDetails: jest.MockedFunction<WorkspaceContract['details']>;
  listApps: jest.MockedFunction<AppsAjaxContract['listAppsV2']>;
  listWdsCollections: jest.MockedFunction<WorkspaceDataAjaxContract['listCollections']>;
}

const setup = (opts: SetupOptions = {}): SetupResult => {
  const { billingProjects = [gcpBillingProject], groups = [] } = opts;

  const listBillingProjects: jest.MockedFunction<BillingContract['listProjects']> = jest.fn();
  listBillingProjects.mockResolvedValue(billingProjects);
  const checkBucketLocation: jest.MockedFunction<WorkspaceContract['checkBucketLocation']> = jest.fn();
  checkBucketLocation.mockResolvedValue({
    location: 'US-CENTRAL1',
    locationType: 'location-type',
  });
  const cloneWorkspace: jest.MockedFunction<WorkspaceV2Contract['clone']> = jest.fn();
  cloneWorkspace.mockReturnValue(abandonedPromise());
  const createWorkspace: jest.MockedFunction<WorkspacesAjaxContract['create']> = jest.fn();
  createWorkspace.mockReturnValue(abandonedPromise());
  const getWorkspaceDetails: jest.MockedFunction<WorkspaceContract['details']> = jest.fn();
  getWorkspaceDetails.mockResolvedValue(
    partial<WorkspaceWrapper>({
      workspace: partial<WorkspaceInfo>({
        attributes: { description: '' },
      }),
    })
  );
  const captureEvent: jest.MockedFunction<MetricsContract['captureEvent']> = jest.fn();
  const listApps: jest.MockedFunction<AppsAjaxContract['listAppsV2']> = jest.fn();
  listApps.mockResolvedValue([]);
  const listWdsCollections: jest.MockedFunction<WorkspaceDataAjaxContract['listCollections']> = jest.fn();
  listWdsCollections.mockResolvedValue([]);

  asMockedFn(Apps).mockReturnValue(partial<AppsAjaxContract>({ listAppsV2: listApps }));
  asMockedFn(Billing).mockReturnValue(partial<BillingContract>({ listProjects: listBillingProjects }));
  asMockedFn(FirecloudBucket).mockReturnValue(
    partial<FirecloudBucketAjaxContract>({
      getFeaturedWorkspaces: jest.fn().mockResolvedValue([]),
    })
  );
  asMockedFn(Groups).mockReturnValue(
    partial<GroupsContract>({
      list: async () => {
        const groupsResponse = groups.map((groupName) =>
          partial<CurrentUserGroupMembership>({
            groupEmail: `${groupName}@test.firecloud.org`,
            groupName,
            role: 'member',
          })
        );
        return groupsResponse;
      },
      group: (groupName) =>
        partial<GroupContract>({
          isMember: async () => groups.includes(groupName),
        }),
    })
  );
  asMockedFn(Metrics).mockReturnValue(partial<MetricsContract>({ captureEvent }));
  asMockedFn(Workspaces).mockReturnValue(
    partial<WorkspacesAjaxContract>({
      create: createWorkspace,
      workspace: () =>
        partial<WorkspaceContract>({
          checkBucketLocation,
          details: getWorkspaceDetails,
        }),
      workspaceV2: () =>
        partial<WorkspaceV2Contract>({
          clone: cloneWorkspace,
        }),
    })
  );
  asMockedFn(WorkspaceData).mockReturnValue(
    partial<WorkspaceDataAjaxContract>({
      listCollections: listWdsCollections,
    })
  );

  return {
    checkBucketLocation,
    cloneWorkspace,
    createWorkspace,
    getWorkspaceDetails,
    captureEvent,
    listApps,
    listWdsCollections,
  };
};

const egressWarning = /may incur network egress charges/;
const nonRegionSpecificEgressWarning = /Copying data may incur network egress charges/;

const mockWorkspaceDetails: WorkspaceInfo = defaultGoogleWorkspace.workspace;

describe('NewWorkspaceWizard', () => {
  const selectBillingProject = async (user, billingProjectName) => {
    await user.click(screen.getByText('Select a billing project'));
    await user.click(screen.getByText(billingProjectName));
  };

  describe('handles when no appropriate billing projects are available', () => {
    it('shows a message if there are no billing projects to use for creation', async () => {
      // Arrange
      setup({ billingProjects: [] });

      // Act
      await act(async () => {
        render(
          h(NewWorkspaceWizard, {
            onSuccess: () => {},
            onDismiss: () => {},
          })
        );
      });

      // Assert
      screen.getByText('You need a billing project to create a new workspace.');
    });

    it('shows a message if there are no billing projects to use for cloning', async () => {
      // Arrange
      setup({ billingProjects: [] });

      // Act
      await act(async () => {
        render(
          h(NewWorkspaceWizard, {
            cloneWorkspace: defaultGoogleWorkspace,
            onSuccess: () => {},
            onDismiss: () => {},
          })
        );
      });

      // Assert
      screen.getByText('You do not have a billing project that is able to clone this workspace.');
    });

    it('redirects to billing if there are no suitable billing projects', async () => {
      // Arrange
      const user = userEvent.setup();
      setup({ billingProjects: [] });

      // Act
      await act(async () => {
        render(
          h(NewWorkspaceWizard, {
            cloneWorkspace: defaultGoogleWorkspace,
            onSuccess: () => {},
            onDismiss: () => {},
          })
        );
      });
      const goToBilling = screen.getByText('Go to Billing');
      await user.click(goToBilling);

      // Assert
      await waitFor(() => expect(goToPath).toBeCalledWith('billing'));
    });
  });

  it('Shows all available billing projects by default', async () => {
    // Arrange
    const user = userEvent.setup();
    setup({ billingProjects: [gcpBillingProject, { ...gcpBillingProject, projectName: 'Second Billing Project' }] });

    // Act
    await act(async () => {
      render(
        h(NewWorkspaceWizard, {
          onSuccess: () => {},
          onDismiss: () => {},
        })
      );
    });

    const projectSelector = screen.getByText('Select a billing project');
    await user.click(projectSelector);

    // Assert
    screen.getByText('Google Billing Project');
    screen.getByText('Second Billing Project');
  });

  describe('decides when to show a policy section ', () => {
    const policyTitle = 'Security and controls on this workspace:';

    it('Does not show a policy section when cloning a protected GCP workspace', async () => {
      // Arrange
      setup({ billingProjects: [gcpBillingProject] });
      const protectedWorkspace = makeGoogleWorkspace({
        workspace: { bucketName: `fc-secure-${defaultGoogleWorkspace.workspace.bucketName}` },
      });

      // Act
      await act(async () => {
        render(
          h(NewWorkspaceWizard, {
            cloneWorkspace: protectedWorkspace,
            onDismiss: () => {},
            onSuccess: () => {},
          })
        );
      });

      // Assert
      expect(screen.queryByText(policyTitle)).toBeNull();
    });
  });

  describe('handles Additional Security Monitoring for GCP billing projects/workspaces ', () => {
    it.each([{ selectCheckbox: true }, { selectCheckbox: false }] as { selectCheckbox: boolean }[])(
      'shows the checkbox if a Google billing project is selected, and correctly passes the value $selectCheckbox on create',
      async ({ selectCheckbox }) => {
        // Arrange
        const user = userEvent.setup();
        const { createWorkspace } = setup();

        // Act
        await act(async () => {
          render(
            h(NewWorkspaceWizard, {
              onSuccess: () => {},
              onDismiss: () => {},
            })
          );
        });

        const workspaceNameInput = screen.getByLabelText('Workspace name *');
        act(() => {
          fireEvent.change(workspaceNameInput, { target: { value: 'Test workspace' } });
        });

        await selectBillingProject(user, 'Google Billing Project');

        const securityTab = screen.getByText('3. Additional Security Options');
        await user.click(securityTab);
        // Assert
        const secureMonitoringSwitch = screen.getByRole('switch');
        expect(secureMonitoringSwitch).not.toHaveAttribute('disabled');
        expect(secureMonitoringSwitch).not.toBeChecked();

        // Act
        if (selectCheckbox) {
          await user.click(secureMonitoringSwitch);
          expect(secureMonitoringSwitch).toBeChecked();
        }

        const createWorkspaceButton = screen.getByRole('button', { name: 'Create workspace' });

        // Assert
        expect(createWorkspaceButton).not.toHaveAttribute('disabled');
        await user.click(createWorkspaceButton);

        // Assert arguments sent to Ajax method for creating a workspace.
        expect(createWorkspace).toBeCalledWith({
          addUsers: [],
          attributes: { description: '' },
          authorizationDomain: [],
          bucketLocation: 'US-CENTRAL1',
          copyFilesWithPrefix: 'notebooks/',
          enhancedBucketLogging: selectCheckbox,
          name: 'Test workspace',
          namespace: 'Google Billing Project',
        });
      }
    );

    it('does not let the user unselect secure monitoring if an auth domain is added', async () => {
      // Arrange
      const user = userEvent.setup();
      setup({ billingProjects: [gcpBillingProject], groups: ['AuthDomain'] });

      // Act
      await act(async () => {
        render(
          h(NewWorkspaceWizard, {
            onSuccess: () => {},
            onDismiss: () => {},
          })
        );
      });

      await selectBillingProject(user, 'Google Billing Project');
      const workspaceNameInput = screen.getByLabelText('Workspace name *');
      act(() => {
        fireEvent.change(workspaceNameInput, { target: { value: 'Test workspace' } });
      });

      const securityTab = screen.getByText('3. Additional Security Options');
      await user.click(securityTab);

      const groupsSelector = screen.getByText('Select groups');
      await user.click(groupsSelector);

      const authDomain = screen.getByText('AuthDomain');
      await user.click(authDomain);

      // Assert
      const secureMonitoringSwitch = screen.getByRole('switch');
      expect(secureMonitoringSwitch).toHaveProperty('checked', true);
      expect(secureMonitoringSwitch).toHaveProperty('disabled', true);
    });

    it('does not let the user uncheck the option if cloning a GCP protected data workspace', async () => {
      // Arrange
      const user = userEvent.setup();
      setup({ billingProjects: [gcpBillingProject] });
      const protectedWorkspace = makeGoogleWorkspace({
        workspace: { bucketName: `fc-secure-${defaultGoogleWorkspace.workspace.bucketName}` },
      });

      // Act
      await act(async () => {
        render(
          h(NewWorkspaceWizard, {
            cloneWorkspace: protectedWorkspace,
            onDismiss: () => {},
            onSuccess: () => {},
          })
        );
      });

      await selectBillingProject(user, 'Google Billing Project');

      const securityTab = screen.getByText('3. Additional Security Options');
      await user.click(securityTab);

      // Assert
      const secureMonitoringSwitch = screen.getByRole('switch');
      expect(secureMonitoringSwitch).toHaveProperty('checked', true);
      expect(secureMonitoringSwitch).toHaveProperty('disabled', true);
    });

    it('checks and disables the option if an auth domain is chosen', async () => {
      // Arrange
      const user = userEvent.setup();
      setup({ billingProjects: [gcpBillingProject], groups: ['AuthDomain'] });

      // Act
      await act(async () => {
        render(
          h(NewWorkspaceWizard, {
            onSuccess: () => {},
            onDismiss: () => {},
          })
        );
      });

      await selectBillingProject(user, 'Google Billing Project');
      const workspaceNameInput = screen.getByLabelText('Workspace name *');
      act(() => {
        fireEvent.change(workspaceNameInput, { target: { value: 'Test workspace' } });
      });

      const securityTab = screen.getByText('3. Additional Security Options');
      await user.click(securityTab);

      const groupsSelector = screen.getByText('Select groups');
      await user.click(groupsSelector);

      const authDomain = screen.getByText('AuthDomain');
      await user.click(authDomain);

      // Assert
      const secureMonitoringSwitch = screen.getByRole('switch');
      expect(secureMonitoringSwitch).toHaveProperty('checked', true);
      expect(secureMonitoringSwitch).toHaveProperty('disabled', true);
    });
  });

  describe('while creating a workspace', () => {
    const workspaceFromCreateResponse = defaultGoogleWorkspace.workspace;
    let createWorkspace: jest.MockedFunction<WorkspacesAjaxContract['create']>;
    let captureEvent: jest.MockedFunction<MetricsContract['captureEvent']>;

    beforeEach(async () => {
      // Arrange
      const user = userEvent.setup();
      const setupResult = setup();
      createWorkspace = setupResult.createWorkspace;
      createWorkspace.mockResolvedValue(workspaceFromCreateResponse);
      captureEvent = setupResult.captureEvent;

      await act(async () => {
        render(
          h(NewWorkspaceWizard, {
            onSuccess: () => {},
            onDismiss: () => {},
          })
        );
      });

      // Act
      const workspaceNameInput = screen.getByLabelText('Workspace name *');
      act(() => {
        fireEvent.change(workspaceNameInput, { target: { value: 'Test workspace' } });
      });

      const projectSelect = new SelectHelper(screen.getByLabelText('Billing project *'), user);
      await projectSelect.selectOption(/Google Billing Project/);

      const createWorkspaceButton = screen.getByRole('button', { name: 'Quick create workspace' });
      await user.click(createWorkspaceButton);
    });

    it('shows message', () => {
      // Assert
      screen.getByText(/Creating and provisioning your workspace./);
      screen.getByText(/This may take a few minutes./);
    });

    it('hides buttons', () => {
      // Assert
      expect(screen.queryByRole('button')).toBeNull();
    });

    it('emits a metrics event for a GCP workspace', async () => {
      // Assert
      expect(createWorkspace).toHaveBeenCalled();
      const expectedEvent = {
        cloudPlatform: 'GCP',
        region: 'US-CENTRAL1',
        workspaceName: workspaceFromCreateResponse.name,
        workspaceNamespace: workspaceFromCreateResponse.namespace,
        hasProtectedData: undefined,
        workspaceAccessLevel: undefined,
      };
      expect(captureEvent).toHaveBeenCalledWith(Events.workspaceCreate, expectedEvent);
    });
  });

  it('includes $cloudPlatform cloud platform from workspace response', async () => {
    // Arrange
    const user = userEvent.setup();

    const createdWorkspace = mockWorkspaceDetails;
    const { createWorkspace } = setup();
    createWorkspace.mockResolvedValue(createdWorkspace);

    const onSuccess = jest.fn();
    await act(async () => {
      render(
        h(NewWorkspaceWizard, {
          onSuccess,
          onDismiss: () => {},
        })
      );
    });

    // Act
    const workspaceNameInput = screen.getByLabelText('Workspace name *');
    act(() => {
      fireEvent.change(workspaceNameInput, { target: { value: createdWorkspace.name } });
    });

    const projectSelect = new SelectHelper(screen.getByLabelText('Billing project *'), user);
    await projectSelect.selectOption(new RegExp(gcpBillingProject.projectName));

    const createWorkspaceButton = screen.getByRole('button', { name: 'Quick create workspace' });
    await user.click(createWorkspaceButton);

    // Assert
    expect(onSuccess).toHaveBeenCalledWith({
      ...createdWorkspace,
      // 'Gcp',
    });
  });

  describe('handles server errors responses from creating a workspace', () => {
    it.each([
      {
        response: new Response('{"message":"Something went wrong."}', { status: 500 }),
        format: 'JSON',
        expectedMessage: 'Something went wrong.',
      },
      {
        response: new Response('Something went wrong.', { status: 500 }),
        format: 'text',
        expectedMessage: 'Unknown error.',
      },
    ] as { response: Response; format: string; expectedMessage: string }[])(
      'shows an error message if create workspace request returns a $format error response',
      async ({ response, expectedMessage }) => {
        // Arrange
        const user = userEvent.setup();
        const { createWorkspace } = setup({ billingProjects: [gcpBillingProject] });
        createWorkspace.mockRejectedValue(response);

        await act(async () => {
          render(
            h(NewWorkspaceWizard, {
              onSuccess: () => {},
              onDismiss: () => {},
            })
          );
        });

        // Act
        const workspaceNameInput = screen.getByLabelText('Workspace name *');
        act(() => {
          fireEvent.change(workspaceNameInput, { target: { value: 'Test workspace' } });
        });

        const projectSelect = new SelectHelper(screen.getByLabelText('Billing project *'), user);
        await projectSelect.selectOption(/Google Billing Project/);

        const createWorkspaceButton = screen.getByRole('button', { name: 'Quick create workspace' });
        await user.click(createWorkspaceButton);

        // Assert
        screen.getByText(expectedMessage);
      }
    );

    it('shows an error message if creating a workspace throws an error', async () => {
      // Arrange
      const user = userEvent.setup();
      const { createWorkspace } = setup({ billingProjects: [gcpBillingProject] });
      createWorkspace.mockRejectedValue(new Error('Something went wrong.'));

      await act(async () => {
        render(
          h(NewWorkspaceWizard, {
            onSuccess: () => {},
            onDismiss: () => {},
          })
        );
      });

      // Act
      const workspaceNameInput = screen.getByLabelText('Workspace name *');
      act(() => {
        fireEvent.change(workspaceNameInput, { target: { value: 'Test workspace' } });
      });

      const projectSelect = new SelectHelper(screen.getByLabelText('Billing project *'), user);
      await projectSelect.selectOption(/Google Billing Project/);

      const createWorkspaceButton = screen.getByRole('button', { name: 'Quick create workspace' });
      await user.click(createWorkspaceButton);

      // Assert
      screen.getByText('Something went wrong.');
    });
  });

  describe('shows egress warnings for cloning GCP workspaces', () => {
    it.each([
      { mockRejectedValue: mockBucketRequesterPaysError },
      { mockRejectedValue: new Response('', { status: 403 }) },
      { mockRejectedValue: new Response('', { status: 500 }) },
    ] as { mockRejectedValue: any }[])(
      'shows a generic message if the source bucket location cannot be obtained ($mockRejectedValue)',
      async ({ mockRejectedValue }) => {
        // Arrange
        const user = userEvent.setup();
        const { checkBucketLocation } = setup({ billingProjects: [gcpBillingProject] });
        checkBucketLocation.mockRejectedValue(mockRejectedValue);
        // Don't show expected message about bucket location not being available
        jest.spyOn(console, 'log').mockImplementation(() => {});

        // Act
        await act(async () => {
          render(
            h(NewWorkspaceWizard, {
              cloneWorkspace: defaultGoogleWorkspace,
              onDismiss: () => {},
              onSuccess: () => {},
            })
          );
        });

        // Verify warning doesn't show up until a destination billing project is selected.
        expect(screen.queryByText(egressWarning)).toBeNull();

        await selectBillingProject(user, 'Google Billing Project');

        // Assert
        screen.getByText(nonRegionSpecificEgressWarning);
      }
    );
  });

  it('loads full description when cloning a workspace', async () => {
    // Arrange
    const cloneWorkspace = makeGoogleWorkspace({
      workspace: { attributes: { description: 'Important: before using this workspace,' } },
    });

    const { getWorkspaceDetails } = setup();
    getWorkspaceDetails.mockResolvedValue(
      makeGoogleWorkspace({
        workspace: {
          attributes: { description: 'Important: before using this workspace, <rest of the instructions>.' },
        },
      })
    );

    // Act
    await act(async () => {
      render(
        h(NewWorkspaceWizard, {
          cloneWorkspace,
          onDismiss: () => {},
          onSuccess: () => {},
        })
      );
    });

    // Assert
    const descriptionInput = screen.getByLabelText('Description');
    expect(descriptionInput).toHaveValue('Important: before using this workspace, <rest of the instructions>.');
  });

  describe('tab navigation', () => {
    it('disallows navigation past first tab until required fields are complete', async () => {
      // Arrange
      const user = userEvent.setup();
      setup();

      await act(async () => {
        render(
          h(NewWorkspaceWizard, {
            onSuccess: () => {},
            onDismiss: () => {},
          })
        );
      });

      const nextButton = screen.getByRole('button', { name: 'Next' });
      expect(nextButton).toHaveAttribute('disabled');
      // Tooltip should tell you to fill in the required fields
      const needBillingProjectTooltip = screen.getAllByText("Billing project can't be blank");
      expect(needBillingProjectTooltip).toBeInTheDocument;

      await selectBillingProject(user, 'Google Billing Project');
      expect(nextButton).toHaveAttribute('disabled');
      // Tooltip should tell you to fill in the required fields
      const needNameTooltip = screen.getAllByText("Name can't be blank");
      expect(needNameTooltip).toBeInTheDocument;

      const workspaceNameInput = screen.getByLabelText('Workspace name *');
      act(() => {
        fireEvent.change(workspaceNameInput, { target: { value: 'Test workspace' } });
      });

      expect(nextButton).not.toHaveAttribute('disabled');
      expect(needBillingProjectTooltip).not.toBeInTheDocument;
      expect(needNameTooltip).not.toBeInTheDocument;

      const quickCreateTooltip = screen.getAllByText(
        'Allows you to quickly create workspace without any sharing or additional security options'
      );

      expect(quickCreateTooltip).not.toBeInTheDocument;
    });
  });
});
