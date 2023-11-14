import { abandonedPromise, DeepPartial } from '@terra-ui-packages/core-utils';
import { asMockedFn } from '@terra-ui-packages/test-utils';
import { act, fireEvent, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { h } from 'react-hyperscript-helpers';
import { Ajax } from 'src/libs/ajax';
import { AzureWorkspaceInfo, GoogleWorkspaceInfo, WorkspaceInfo } from 'src/libs/workspace-utils';
import { BillingProject, CloudPlatform } from 'src/pages/billing/models/BillingProject';
import { renderWithAppContexts as render, SelectHelper } from 'src/testing/test-utils';

import NewWorkspaceModal from './NewWorkspaceModal';

jest.mock('src/libs/ajax');

jest.mock('src/libs/nav', () => ({
  ...jest.requireActual('src/libs/nav'),
  getLink: jest.fn().mockReturnValue(''),
}));

const gcpBillingProject: BillingProject = {
  billingAccount: 'billingAccounts/FOO-BAR-BAZ',
  cloudPlatform: 'GCP',
  invalidBillingAccount: false,
  projectName: 'Google Billing Project',
  roles: ['Owner'],
  status: 'Ready',
};

const azureBillingProject: BillingProject = {
  cloudPlatform: 'AZURE',
  landingZoneId: 'aaaabbbb-cccc-dddd-0000-111122223333',
  managedAppCoordinates: {
    tenantId: 'aaaabbbb-cccc-dddd-0000-111122223333',
    subscriptionId: 'aaaabbbb-cccc-dddd-0000-111122223333',
    managedResourceGroupId: 'aaaabbbb-cccc-dddd-0000-111122223333',
  },
  invalidBillingAccount: false,
  projectName: 'Azure Billing Project',
  roles: ['Owner'],
  status: 'Ready',
};

type AjaxContract = ReturnType<typeof Ajax>;

const nonBillingAjax: DeepPartial<AjaxContract> = {
  Groups: {
    list: async () => {
      return [];
    },
    group: (_groupName) => {
      return {
        isMember: async () => {
          return true;
        },
      };
    },
  },
  Metrics: {
    captureEvent: async (_name, _details) => {
      // Do nothing
    },
  },
};

const hasGroupsAjax = {
  Groups: {
    list: async () => {
      return [
        {
          groupEmail: 'AuthDomain@test.firecloud.org',
          groupName: 'AuthDomain',
          role: 'member',
        },
      ];
    },
    group: (_groupName) => {
      return {
        isMember: async () => {
          return true;
        },
      };
    },
  },
  Metrics: {
    captureEvent: async (_name, _details) => {
      // Do nothing
    },
  },
};

describe('NewWorkspaceModal', () => {
  it('Shows all available billing projects by default', async () => {
    // Arrange
    const user = userEvent.setup();

    asMockedFn(Ajax).mockImplementation(
      () =>
        ({
          Billing: {
            listProjects: async () => [gcpBillingProject, azureBillingProject],
          },
          ...nonBillingAjax,
        } as AjaxContract)
    );

    await act(async () => {
      render(
        h(NewWorkspaceModal, {
          onSuccess: () => {},
          onDismiss: () => {},
        })
      );
    });

    const projectSelector = screen.getByText('Select a billing project');
    await user.click(projectSelector);

    // Assert
    // getByText throws an error if the element is not found:
    screen.getByText('Google Billing Project');
    screen.getByText('Azure Billing Project');
    // queryByText returns null if the element is not found:
    expect(screen.queryByText('Importing directly into new Azure workspaces is not currently supported.')).toBeNull();
  });

  it.each([
    { cloudPlatform: 'AZURE', expectedBillingProjects: ['Azure Billing Project'] },
    { cloudPlatform: 'GCP', expectedBillingProjects: ['Google Billing Project'] },
  ] as { cloudPlatform: CloudPlatform; expectedBillingProjects: string[] }[])(
    'can limit billing projects to one cloud platform',
    async ({ cloudPlatform, expectedBillingProjects }) => {
      // Arrange
      const user = userEvent.setup();

      asMockedFn(Ajax).mockImplementation(
        () =>
          ({
            Billing: {
              listProjects: async () => [gcpBillingProject, azureBillingProject],
            },
            ...nonBillingAjax,
          } as AjaxContract)
      );

      // Act
      await act(async () => {
        render(
          h(NewWorkspaceModal, {
            cloudPlatform,
            onDismiss: () => {},
            onSuccess: () => {},
          })
        );
      });

      const projectSelect = new SelectHelper(screen.getByLabelText('Billing project *'), user);
      const availableBillingProjectOptions = await projectSelect.getOptions();
      // Remove icon name from option label.
      // The icon names are only present in tests. They're the result of a configured transform.
      const availableBillingProjects = availableBillingProjectOptions.map((opt) => opt.split('.svg')[1]);

      // Assert
      expect(availableBillingProjects).toEqual(expectedBillingProjects);
    }
  );

  it('Hides azure billing projects if part of workflow import', async () => {
    // Arrange
    const user = userEvent.setup();

    asMockedFn(Ajax).mockImplementation(
      () =>
        ({
          Billing: {
            listProjects: async () => [gcpBillingProject, azureBillingProject],
          },
          ...nonBillingAjax,
        } as AjaxContract)
    );

    await act(async () => {
      render(
        h(NewWorkspaceModal, {
          onSuccess: () => {},
          onDismiss: () => {},
          workflowImport: true,
        })
      );
    });

    const projectSelector = screen.getByText('Select a billing project');
    await user.click(projectSelector);

    // Assert
    screen.getByText('Google Billing Project');
    expect(screen.queryByText('Azure Billing Project')).toBeNull();
    screen.getByText(
      'Importing directly into new Azure workspaces is not currently supported. To create a new workspace with an Azure billing project, visit the main',
      { exact: false }
    );
  });

  it('Does not warn about no Azure support if no billing projects were hidden', async () => {
    // Arrange
    const user = userEvent.setup();

    asMockedFn(Ajax).mockImplementation(
      () =>
        ({
          Billing: {
            listProjects: async () => [gcpBillingProject],
          },
          ...nonBillingAjax,
        } as AjaxContract)
    );

    await act(async () => {
      render(
        h(NewWorkspaceModal, {
          onSuccess: () => {},
          onDismiss: () => {},
          workflowImport: true,
        })
      );
    });

    const projectSelector = screen.getByText('Select a billing project');
    await user.click(projectSelector);

    // Assert
    screen.getByText('Google Billing Project');
    expect(screen.queryByText('Azure Billing Project')).toBeNull();
    expect(
      screen.queryByText(
        'Importing directly into new Azure workspaces is not currently supported. To create a new workspace with an Azure billing project, visit the main',
        { exact: false }
      )
    ).toBeNull();
  });

  it('shows an option for "Workspace will have protected data" (enhanced bucket logging) if a Google billing project is selected', async () => {
    // Arrange
    const user = userEvent.setup();

    asMockedFn(Ajax).mockImplementation(
      () =>
        ({
          Billing: {
            listProjects: async () => [gcpBillingProject, azureBillingProject],
          },
          ...nonBillingAjax,
        } as AjaxContract)
    );

    await act(async () => {
      render(
        h(NewWorkspaceModal, {
          onSuccess: () => {},
          onDismiss: () => {},
        })
      );
    });

    const projectSelector = screen.getByText('Select a billing project');
    await user.click(projectSelector);

    const googleBillingProject = screen.getByText('Google Billing Project');
    await user.click(googleBillingProject);

    // Assert
    // getByText throws an error if the element is not found:
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toHaveAccessibleName('Workspace will have protected data');
    expect(checkbox).not.toHaveAttribute('disabled');
  });

  it('does not show an option for "Workspace will have protected data" (enhanced bucket logging) if an Azure billing project is selected', async () => {
    // Arrange
    const user = userEvent.setup();

    asMockedFn(Ajax).mockImplementation(
      () =>
        ({
          Billing: {
            listProjects: async () => [gcpBillingProject, azureBillingProject],
          },
          ...nonBillingAjax,
        } as AjaxContract)
    );

    await act(async () => {
      render(
        h(NewWorkspaceModal, {
          onSuccess: () => {},
          onDismiss: () => {},
        })
      );
    });

    const projectSelector = screen.getByText('Select a billing project');
    await user.click(projectSelector);

    const azureBillingProject1 = screen.getByText('Azure Billing Project');
    await user.click(azureBillingProject1);

    // Assert
    expect(screen.queryByText('Workspace will have protected data')).toBeNull();
  });

  it('does not let the user uncheck "Workspace will have protected data" (enhanced bucket logging) if its required', async () => {
    // Arrange
    const user = userEvent.setup();

    asMockedFn(Ajax).mockImplementation(
      () =>
        ({
          Billing: {
            listProjects: async () => [gcpBillingProject, azureBillingProject],
          },
          ...nonBillingAjax,
        } as AjaxContract)
    );

    await act(async () => {
      render(
        h(NewWorkspaceModal, {
          onSuccess: () => {},
          onDismiss: () => {},
          requireEnhancedBucketLogging: true,
        })
      );
    });

    const projectSelector = screen.getByText('Select a billing project');
    await user.click(projectSelector);

    const googleBillingProject = screen.getByText('Google Billing Project');
    await user.click(googleBillingProject);

    // Assert
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toHaveAccessibleName('Workspace will have protected data');
    expect(checkbox).toHaveAttribute('disabled');
  });

  it('checks and disables "Workspace will have protected data" (enhanced bucket logging) if an auth domain is chosen', async () => {
    // Arrange
    const user = userEvent.setup();

    asMockedFn(Ajax).mockImplementation(
      () =>
        ({
          Billing: {
            listProjects: async () => [gcpBillingProject, azureBillingProject],
          },
          ...hasGroupsAjax,
        } as AjaxContract)
    );

    await act(async () => {
      render(
        h(NewWorkspaceModal, {
          onSuccess: () => {},
          onDismiss: () => {},
        })
      );
    });

    const projectSelector = screen.getByText('Select a billing project');
    await user.click(projectSelector);

    const googleBillingProject = screen.getByText('Google Billing Project');
    await user.click(googleBillingProject);

    const groupsSelector = screen.getByText('Select groups');
    await user.click(groupsSelector);

    const authDomain = screen.getByText('AuthDomain');
    await user.click(authDomain);

    // Assert
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toHaveAccessibleName('Workspace will have protected data');
    expect(checkbox).toHaveAttribute('disabled');
    expect(checkbox).toBeChecked();
  });

  it('Hides azure billing projects for enhanced bucket logging', async () => {
    // Arrange
    const user = userEvent.setup();

    asMockedFn(Ajax).mockImplementation(
      () =>
        ({
          Billing: {
            listProjects: async () => [gcpBillingProject, azureBillingProject],
          },
          ...nonBillingAjax,
        } as AjaxContract)
    );

    await act(async () => {
      render(
        h(NewWorkspaceModal, {
          onSuccess: () => {},
          onDismiss: () => {},
          requireEnhancedBucketLogging: true,
        })
      );
    });

    const projectSelector = screen.getByText('Select a billing project');
    await user.click(projectSelector);

    // Assert
    screen.getByText('Google Billing Project');
    expect(screen.queryByText('Azure Billing Project')).toBeNull();
  });

  describe('while creating a workspace', () => {
    beforeEach(async () => {
      // Arrange
      const user = userEvent.setup();

      const createWorkspace = jest.fn().mockReturnValue(abandonedPromise());

      asMockedFn(Ajax).mockImplementation(
        () =>
          ({
            Billing: {
              listProjects: async () => [gcpBillingProject, azureBillingProject],
            },
            Workspaces: {
              create: createWorkspace,
            },
            ...nonBillingAjax,
          } as AjaxContract)
      );

      await act(async () => {
        render(
          h(NewWorkspaceModal, {
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

      const createWorkspaceButton = screen.getByRole('button', { name: 'Create Workspace' });
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
  });

  it.each([
    { billingProjectName: azureBillingProject.projectName, cloudPlatform: 'Azure' },
    { billingProjectName: gcpBillingProject.projectName, cloudPlatform: 'Gcp' },
  ] as { billingProjectName: string; cloudPlatform: WorkspaceInfo['cloudPlatform'] }[])(
    'adds $cloudPlatform cloud platform to workspace',
    async ({ billingProjectName, cloudPlatform }) => {
      // Arrange
      const user = userEvent.setup();

      // Create workspace response does not include cloudPlatform.
      // The modal should add it to the workspace passed to onSuccess.
      const mockWorkspaces: {
        Azure: Omit<AzureWorkspaceInfo, 'cloudPlatform'>;
        Gcp: Omit<GoogleWorkspaceInfo, 'cloudPlatform'>;
      } = {
        Azure: {
          namespace: azureBillingProject.projectName,
          name: 'test-workspace',
          workspaceId: 'aaaabbbb-cccc-dddd-0000-111122223333',
          createdBy: 'user@example.com',
          createdDate: '2023-11-13T18:39:32.267Z',
          lastModified: '2023-11-13T18:39:32.267Z',
          authorizationDomain: [],
        },
        Gcp: {
          namespace: gcpBillingProject.projectName,
          name: 'test-workspace',
          workspaceId: 'aaaabbbb-cccc-dddd-0000-111122223333',
          googleProject: 'test-project',
          bucketName: 'fc-aaaabbbb-cccc-dddd-0000-111122223333',
          createdBy: 'user@example.com',
          createdDate: '2023-11-13T18:39:32.267Z',
          lastModified: '2023-11-13T18:39:32.267Z',
          authorizationDomain: [],
        },
      };
      const createdWorkspace = mockWorkspaces[cloudPlatform];

      const createWorkspace = jest.fn().mockResolvedValue(createdWorkspace);

      asMockedFn(Ajax).mockImplementation(
        () =>
          ({
            Billing: {
              listProjects: async () => [azureBillingProject, gcpBillingProject],
            },
            Workspaces: {
              create: createWorkspace,
            },
            ...nonBillingAjax,
          } as AjaxContract)
      );

      const onSuccess = jest.fn();
      await act(async () => {
        render(
          h(NewWorkspaceModal, {
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
      await projectSelect.selectOption(new RegExp(billingProjectName));

      const createWorkspaceButton = screen.getByRole('button', { name: 'Create Workspace' });
      await user.click(createWorkspaceButton);

      // Assert
      expect(onSuccess).toHaveBeenCalledWith({
        ...createdWorkspace,
        cloudPlatform,
      });
    }
  );
});
