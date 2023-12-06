import { abandonedPromise, DeepPartial } from '@terra-ui-packages/core-utils';
import { asMockedFn, withFakeTimers } from '@terra-ui-packages/test-utils';
import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { h } from 'react-hyperscript-helpers';
import { Ajax } from 'src/libs/ajax';
import { ListAppItem } from 'src/libs/ajax/leonardo/models/app-models';
import { goToPath } from 'src/libs/nav';
import { AzureWorkspaceInfo, GoogleWorkspaceInfo, WorkspaceInfo } from 'src/libs/workspace-utils';
import { CloudPlatform } from 'src/pages/billing/models/BillingProject';
import {
  azureBillingProject,
  azureProtectedDataBillingProject,
  gcpBillingProject,
} from 'src/testing/billing-project-fixtures';
import { renderWithAppContexts as render, SelectHelper } from 'src/testing/test-utils';
import { defaultAzureWorkspace, defaultGoogleWorkspace, protectedAzureWorkspace } from 'src/testing/workspace-fixtures';

import NewWorkspaceModal from './NewWorkspaceModal';

jest.mock('src/libs/ajax');

type NavExports = typeof import('src/libs/nav');
jest.mock(
  'src/libs/nav',
  (): NavExports => ({
    ...jest.requireActual<NavExports>('src/libs/nav'),
    getLink: jest.fn(() => '/'),
    goToPath: jest.fn(),
  })
);

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
  const getAvailableBillingProjects = async (user) => {
    const projectSelect = new SelectHelper(screen.getByLabelText('Billing project *'), user);
    const availableBillingProjectOptions = await projectSelect.getOptions();
    // Remove icon name from option label.
    // The icon names are only present in tests. They're the result of a configured transform.
    return availableBillingProjectOptions.map((opt) => opt.split('.svg')[1]);
  };

  describe('handles when no appropriate billing projects are available', () => {
    it('shows a message if there are no billing projects to use for creation', async () => {
      // Arrange
      asMockedFn(Ajax).mockImplementation(
        () =>
          ({
            Billing: {
              listProjects: async () => [],
            },
            ...nonBillingAjax,
          } as AjaxContract)
      );

      // Act
      await act(async () => {
        render(
          h(NewWorkspaceModal, {
            onSuccess: () => {},
            onDismiss: () => {},
          })
        );
      });

      // Assert
      screen.getByText('You need a billing project to create a new workspace.');
    });

    it('shows a message if there are no protected billing projects to use for creating a workspace with additional security monitoring ', async () => {
      // Arrange
      asMockedFn(Ajax).mockImplementation(
        () =>
          ({
            Billing: {
              listProjects: async () => [azureBillingProject],
            },
            ...nonBillingAjax,
          } as AjaxContract)
      );

      // Act
      await act(async () => {
        render(
          h(NewWorkspaceModal, {
            requireEnhancedBucketLogging: true,
            onSuccess: () => {},
            onDismiss: () => {},
          })
        );
      });

      // Assert
      screen.getByText('You do not have access to a billing project that supports additional security monitoring.');
    });

    it('shows a message if there are no billing projects to use for cloning', async () => {
      // Arrange
      asMockedFn(Ajax).mockImplementation(
        () =>
          ({
            Billing: {
              listProjects: async () => [],
            },
            ...nonBillingAjax,
          } as AjaxContract)
      );

      // Act
      await act(async () => {
        render(
          h(NewWorkspaceModal, {
            cloneWorkspace: defaultAzureWorkspace,
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
      asMockedFn(Ajax).mockImplementation(
        () =>
          ({
            Billing: {
              listProjects: async () => [],
            },
            ...nonBillingAjax,
          } as AjaxContract)
      );

      // Arrange
      await act(async () => {
        render(
          h(NewWorkspaceModal, {
            cloneWorkspace: defaultAzureWorkspace,
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

  describe('handles the requireEnhancedBucketLogging option', () => {
    it('hides unprotected Azure billing projects when additional security monitoring is required', async () => {
      // Arrange
      const user = userEvent.setup();

      asMockedFn(Ajax).mockImplementation(
        () =>
          ({
            Billing: {
              listProjects: async () => [gcpBillingProject, azureBillingProject, azureProtectedDataBillingProject],
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

      // Assert
      expect(await getAvailableBillingProjects(user)).toEqual([
        'Google Billing Project',
        'Protected Azure Billing Project',
      ]);
    });

    it.each([
      {
        cloudPlatform: 'AZURE',
        expectedBillingProjects: ['Azure Billing Project', 'Protected Azure Billing Project'],
        requireEnhancedBucketLogging: false,
      },
      {
        cloudPlatform: 'AZURE',
        expectedBillingProjects: ['Protected Azure Billing Project'],
        requireEnhancedBucketLogging: true,
      },
      {
        cloudPlatform: 'GCP',
        expectedBillingProjects: ['Google Billing Project'],
        requireEnhancedBucketLogging: false,
      },
      { cloudPlatform: 'GCP', expectedBillingProjects: ['Google Billing Project'], requireEnhancedBucketLogging: true },
    ] as { cloudPlatform: CloudPlatform; expectedBillingProjects: string[]; requireEnhancedBucketLogging: boolean }[])(
      'can limit billing projects to $cloudPlatform with requireEnhancedBucketLogging=$requireEnhancedBucketLogging',
      async ({ cloudPlatform, expectedBillingProjects, requireEnhancedBucketLogging }) => {
        // Arrange
        const user = userEvent.setup();

        asMockedFn(Ajax).mockImplementation(
          () =>
            ({
              Billing: {
                listProjects: async () => [gcpBillingProject, azureBillingProject, azureProtectedDataBillingProject],
              },
              ...nonBillingAjax,
            } as AjaxContract)
        );

        // Act
        await act(async () => {
          render(
            h(NewWorkspaceModal, {
              cloudPlatform,
              requireEnhancedBucketLogging,
              onDismiss: () => {},
              onSuccess: () => {},
            })
          );
        });

        // Assert
        expect(await getAvailableBillingProjects(user)).toEqual(expectedBillingProjects);
      }
    );
  });
  describe('filters billing projects when cloning a workspace ', () => {
    it('Hides Azure billing projects when cloning a GCP workspace', async () => {
      const user = userEvent.setup();
      const mockAjax: DeepPartial<AjaxContract> = {
        Workspaces: {
          workspace: () => ({
            checkBucketLocation: jest.fn().mockResolvedValue({
              location: 'US-CENTRAL1',
              locationType: 'location-type',
            }),
          }),
        },
        Billing: {
          listProjects: async () => [gcpBillingProject, azureBillingProject],
        },
        ...nonBillingAjax,
      };
      asMockedFn(Ajax).mockImplementation(() => mockAjax as AjaxContract);

      // Act
      await act(async () => {
        render(
          h(NewWorkspaceModal, {
            cloneWorkspace: defaultGoogleWorkspace,
            onDismiss: () => {},
            onSuccess: () => {},
          })
        );
      });

      // Assert
      expect(await getAvailableBillingProjects(user)).toEqual(['Google Billing Project']);
    });

    it('Hides GCP billing projects when cloning an Azure workspace', async () => {
      const user = userEvent.setup();

      asMockedFn(Ajax).mockImplementation(
        () =>
          ({
            Billing: {
              listProjects: async () => [gcpBillingProject, azureBillingProject, azureProtectedDataBillingProject],
            },
            ...nonBillingAjax,
          } as AjaxContract)
      );

      // Act
      await act(async () => {
        render(
          h(NewWorkspaceModal, {
            cloneWorkspace: defaultAzureWorkspace,
            onDismiss: () => {},
            onSuccess: () => {},
          })
        );
      });

      // Assert
      expect(await getAvailableBillingProjects(user)).toEqual([
        'Azure Billing Project',
        'Protected Azure Billing Project',
      ]);
    });

    it('Hides billing projects that cannot be used for cloning a protected data Azure workspace', async () => {
      const user = userEvent.setup();

      asMockedFn(Ajax).mockImplementation(
        () =>
          ({
            Billing: {
              listProjects: async () => [gcpBillingProject, azureBillingProject, azureProtectedDataBillingProject],
            },
            ...nonBillingAjax,
          } as AjaxContract)
      );

      // Act
      await act(async () => {
        render(
          h(NewWorkspaceModal, {
            cloneWorkspace: protectedAzureWorkspace,
            onDismiss: () => {},
            onSuccess: () => {},
          })
        );
      });

      // Assert
      expect(await getAvailableBillingProjects(user)).toEqual(['Protected Azure Billing Project']);
    });
  });

  describe('decides when to show a policy section ', () => {
    const clonePolicyLabel = 'The cloned workspace will inherit:';

    it('Shows a policy section when cloning an Azure workspace with polices', async () => {
      asMockedFn(Ajax).mockImplementation(
        () =>
          ({
            Billing: {
              listProjects: async () => [azureProtectedDataBillingProject],
            },
            ...nonBillingAjax,
          } as AjaxContract)
      );

      // Act
      await act(async () => {
        render(
          h(NewWorkspaceModal, {
            cloneWorkspace: protectedAzureWorkspace,
            onDismiss: () => {},
            onSuccess: () => {},
          })
        );
      });

      // Assert
      screen.getByText('Policies');
      screen.getByText(clonePolicyLabel);
    });

    it('Does not show a policy section when cloning an Azure workspace without polices', async () => {
      asMockedFn(Ajax).mockImplementation(
        () =>
          ({
            Billing: {
              listProjects: async () => [azureBillingProject],
            },
            ...nonBillingAjax,
          } as AjaxContract)
      );

      // Act
      await act(async () => {
        render(
          h(NewWorkspaceModal, {
            cloneWorkspace: defaultAzureWorkspace,
            onDismiss: () => {},
            onSuccess: () => {},
          })
        );
      });

      // Assert
      expect(screen.queryByText('Policies')).toBeNull();
      expect(screen.queryByText(clonePolicyLabel)).toBeNull();
    });

    it('Does not show a policy section when cloning a protected GCP workspace', async () => {
      // Arrange
      const protectedWorkspace = { ...defaultGoogleWorkspace };
      protectedWorkspace.workspace.bucketName = `fc-secure-${defaultGoogleWorkspace.workspace.bucketName}`;
      asMockedFn(Ajax).mockImplementation(
        () =>
          ({
            Workspaces: {
              workspace: () => ({
                checkBucketLocation: jest.fn().mockResolvedValue({
                  location: 'US-CENTRAL1',
                  locationType: 'location-type',
                }),
              }),
            },
            Billing: {
              listProjects: async () => [gcpBillingProject],
            },
            ...nonBillingAjax,
          } as AjaxContract)
      );

      // Act
      await act(async () => {
        render(
          h(NewWorkspaceModal, {
            cloneWorkspace: protectedWorkspace,
            onDismiss: () => {},
            onSuccess: () => {},
          })
        );
      });

      // Assert
      expect(screen.queryByText('Policies')).toBeNull();
      expect(screen.queryByText(clonePolicyLabel)).toBeNull();
    });
  });

  describe('respects the workflowImport option ', () => {
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
  });

  describe('handles Additional Security Monitoring for GCP billing projects/workspaces ', () => {
    const additionalSecurityMonitoring = 'Enable additional security monitoring';

    it.each([{ selectCheckbox: true }, { selectCheckbox: false }] as { selectCheckbox: boolean }[])(
      'shows the checkbox if a Google billing project is selected, and correctly passes the value $selectCheckbox on create',
      async ({ selectCheckbox }) => {
        // Arrange
        const user = userEvent.setup();
        const createWorkspace = jest.fn();
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

        const workspaceNameInput = screen.getByLabelText('Workspace name *');
        act(() => {
          fireEvent.change(workspaceNameInput, { target: { value: 'Test workspace' } });
        });

        const projectSelector = screen.getByText('Select a billing project');
        await user.click(projectSelector);

        const googleBillingProject = screen.getByText('Google Billing Project');
        await user.click(googleBillingProject);

        const createWorkspaceButton = screen.getByRole('button', { name: 'Create Workspace' });

        // Assert
        // getByText throws an error if the element is not found:
        const checkbox = screen.getByRole('checkbox');
        expect(checkbox).toHaveAccessibleName(additionalSecurityMonitoring);
        expect(checkbox).not.toHaveAttribute('disabled');
        expect(checkbox).not.toBeChecked();

        // Act
        if (selectCheckbox) {
          await user.click(checkbox);
          expect(checkbox).toBeChecked();
        }
        expect(createWorkspaceButton).not.toHaveAttribute('disabled');
        await user.click(createWorkspaceButton);

        expect(createWorkspace).toBeCalledWith({
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

    it('does not show the checkbox if an Azure billing project is selected', async () => {
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
      expect(screen.queryByText(additionalSecurityMonitoring)).toBeNull();
    });

    it('does not let the user uncheck the option if requireEnhancedBucketLogging is passed in as true', async () => {
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
      expect(checkbox).toHaveAccessibleName(additionalSecurityMonitoring);
      expect(checkbox).toHaveAttribute('disabled');
      expect(checkbox).toBeChecked();
    });

    it('does not let the user uncheck the option if cloning a GCP protected data workspace', async () => {
      // Arrange
      const user = userEvent.setup();
      const protectedWorkspace = { ...defaultGoogleWorkspace };
      protectedWorkspace.workspace.bucketName = `fc-secure-${defaultGoogleWorkspace.workspace.bucketName}`;
      asMockedFn(Ajax).mockImplementation(
        () =>
          ({
            Workspaces: {
              workspace: () => ({
                checkBucketLocation: jest.fn().mockResolvedValue({
                  location: 'US-CENTRAL1',
                  locationType: 'location-type',
                }),
              }),
            },
            Billing: {
              listProjects: async () => [gcpBillingProject],
            },
            ...nonBillingAjax,
          } as AjaxContract)
      );

      // Act
      await act(async () => {
        render(
          h(NewWorkspaceModal, {
            cloneWorkspace: protectedWorkspace,
            onDismiss: () => {},
            onSuccess: () => {},
          })
        );
      });

      const projectSelector = screen.getByText('Select a billing project');
      await user.click(projectSelector);

      const googleBillingProject = screen.getByText('Google Billing Project');
      await user.click(googleBillingProject);

      // Assert
      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toHaveAccessibleName(additionalSecurityMonitoring);
      expect(checkbox).toHaveAttribute('disabled');
      expect(checkbox).toBeChecked();
    });

    it('checks and disables the option if an auth domain is chosen', async () => {
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
      expect(checkbox).toHaveAccessibleName(additionalSecurityMonitoring);
      expect(checkbox).toHaveAttribute('disabled');
      expect(checkbox).toBeChecked();
    });
  });

  it('allows showing a notice based on the selected billing project', async () => {
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

    const renderNotice = jest.fn().mockImplementation(({ selectedBillingProject }) => {
      return selectedBillingProject
        ? `Selected billing project: ${selectedBillingProject.projectName}`
        : 'No selected billing project';
    });

    // Act
    await act(async () => {
      render(
        h(NewWorkspaceModal, {
          renderNotice,
          onSuccess: () => {},
          onDismiss: () => {},
        })
      );
    });

    // Assert
    expect(renderNotice).toHaveBeenCalledWith({ selectedBillingProject: undefined });
    screen.getByText('No selected billing project');

    // Act
    const projectSelect = new SelectHelper(screen.getByLabelText('Billing project *'), user);
    await projectSelect.selectOption(/Google Billing Project/);

    // Assert
    expect(renderNotice).toHaveBeenCalledWith({ selectedBillingProject: gcpBillingProject });
    screen.getByText('Selected billing project: Google Billing Project');
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

        const createWorkspace = jest.fn().mockRejectedValue(response);

        asMockedFn(Ajax).mockImplementation(
          () =>
            ({
              Billing: {
                listProjects: async () => [azureBillingProject],
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
        await projectSelect.selectOption(/Azure Billing Project/);

        const createWorkspaceButton = screen.getByRole('button', { name: 'Create Workspace' });
        await user.click(createWorkspaceButton);

        // Assert
        screen.getByText(expectedMessage);
      }
    );

    it('shows an error message if creating a workspace throws an error', async () => {
      // Arrange
      const user = userEvent.setup();

      const createWorkspace = jest.fn().mockImplementation(() => {
        throw new Error('Something went wrong.');
      });

      asMockedFn(Ajax).mockImplementation(
        () =>
          ({
            Billing: {
              listProjects: async () => [azureBillingProject],
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
      await projectSelect.selectOption(/Azure Billing Project/);

      const createWorkspaceButton = screen.getByRole('button', { name: 'Create Workspace' });
      await user.click(createWorkspaceButton);

      // Assert
      screen.getByText('Something went wrong.');
    });
  });

  describe('has logic for WDS starting', () => {
    it(
      'can wait for WDS to start for Azure workspaces',
      withFakeTimers(async () => {
        // Arrange
        const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

        // Create workspace endpoint response does not include cloudPlatform.
        const newWorkspace: Omit<AzureWorkspaceInfo, 'cloudPlatform'> = {
          namespace: azureBillingProject.projectName,
          name: 'test-workspace',
          workspaceId: 'aaaabbbb-cccc-dddd-0000-111122223333',
          createdBy: 'user@example.com',
          createdDate: '2023-11-13T18:39:32.267Z',
          lastModified: '2023-11-13T18:39:32.267Z',
          authorizationDomain: [],
        };
        const createWorkspace = jest.fn().mockResolvedValue(newWorkspace);

        const wdsApp: ListAppItem = {
          workspaceId: 'aaaabbbb-cccc-dddd-0000-111122223333',
          cloudContext: {
            cloudProvider: 'AZURE',
            cloudResource:
              '0cb7a640-45a2-4ed6-be9f-63519f86e04b/ffd1069e-e34f-4d87-a8b8-44abfcba39af/mrg-terra-dev-previ-20230623095104',
          },
          kubernetesRuntimeConfig: {
            numNodes: 1,
            machineType: 'Standard_A2_v2',
            autoscalingEnabled: false,
          },
          errors: [],
          status: 'RUNNING',
          proxyUrls: {
            wds: 'https://lz34dd00bf3fdaa72f755eeea8f928bab7cd135043043d59d5.servicebus.windows.net/wds-aaaabbbb-cccc-dddd-0000-111122223333-aaaabbbb-cccc-dddd-0000-111122223333/',
          },
          appName: 'wds-aaaabbbb-cccc-dddd-0000-111122223333',
          appType: 'WDS',
          diskName: null,
          auditInfo: {
            creator: 'user@example.com',
            createdDate: '2023-11-13T18:41:32.267Z',
            destroyedDate: null,
            dateAccessed: '2023-11-13T18:41:32.267Z',
          },
          accessScope: 'WORKSPACE_SHARED',
          labels: {},
          region: 'us-central1',
        };

        const listAppsV2 = jest
          .fn()
          .mockResolvedValue([wdsApp])
          .mockResolvedValueOnce([{ ...wdsApp, status: 'PROVISIONING', proxyUrls: {} }]);

        const listInstances = jest
          .fn()
          .mockResolvedValue(['aaaabbbb-cccc-dddd-0000-111122223333'])
          .mockResolvedValueOnce([]);

        asMockedFn(Ajax).mockImplementation(
          () =>
            ({
              Apps: {
                listAppsV2,
              },
              Billing: {
                listProjects: async () => [azureBillingProject],
              },
              Workspaces: {
                create: createWorkspace,
              },
              WorkspaceData: {
                listInstances,
              },
              ...nonBillingAjax,
            } as AjaxContract)
        );

        const onSuccess = jest.fn();

        await act(async () => {
          render(
            h(NewWorkspaceModal, {
              waitForServices: {
                wds: true,
              },
              onSuccess,
              onDismiss: () => {},
            })
          );
        });

        // Act
        const workspaceNameInput = screen.getByLabelText('Workspace name *');
        await user.type(workspaceNameInput, newWorkspace.name);

        const projectSelect = new SelectHelper(screen.getByLabelText('Billing project *'), user);
        await projectSelect.selectOption(/Azure Billing Project/);

        const createWorkspaceButton = screen.getByRole('button', { name: 'Create Workspace' });
        await user.click(createWorkspaceButton);

        // Assert
        expect(onSuccess).not.toHaveBeenCalled();

        // Act
        await act(() => jest.advanceTimersByTime(30000));

        // Assert
        expect(listAppsV2).toHaveBeenCalledTimes(1);
        expect(onSuccess).not.toHaveBeenCalled();

        // Act
        await act(() => jest.advanceTimersByTime(15000));

        // Assert
        expect(listAppsV2).toHaveBeenCalledTimes(2);
        expect(listInstances).toHaveBeenCalledTimes(1);
        expect(onSuccess).not.toHaveBeenCalled();

        // Act
        await act(() => jest.advanceTimersByTime(5000));

        // Assert
        expect(listAppsV2).toHaveBeenCalledTimes(2);
        expect(listInstances).toHaveBeenCalledTimes(2);

        expect(onSuccess).toHaveBeenCalled();
      })
    );

    it(
      'shows an error if WDS fails to start',
      withFakeTimers(async () => {
        // Arrange
        const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

        // Create workspace endpoint response does not include cloudPlatform.
        const newWorkspace: Omit<AzureWorkspaceInfo, 'cloudPlatform'> = {
          namespace: azureBillingProject.projectName,
          name: 'test-workspace',
          workspaceId: 'aaaabbbb-cccc-dddd-0000-111122223333',
          createdBy: 'user@example.com',
          createdDate: '2023-11-13T18:39:32.267Z',
          lastModified: '2023-11-13T18:39:32.267Z',
          authorizationDomain: [],
        };
        const createWorkspace = jest.fn().mockResolvedValue(newWorkspace);

        const wdsApp: ListAppItem = {
          workspaceId: 'aaaabbbb-cccc-dddd-0000-111122223333',
          cloudContext: {
            cloudProvider: 'AZURE',
            cloudResource:
              '0cb7a640-45a2-4ed6-be9f-63519f86e04b/ffd1069e-e34f-4d87-a8b8-44abfcba39af/mrg-terra-dev-previ-20230623095104',
          },
          kubernetesRuntimeConfig: {
            numNodes: 1,
            machineType: 'Standard_A2_v2',
            autoscalingEnabled: false,
          },
          errors: [],
          status: 'ERROR',
          proxyUrls: {},
          appName: 'wds-aaaabbbb-cccc-dddd-0000-111122223333',
          appType: 'WDS',
          diskName: null,
          auditInfo: {
            creator: 'user@example.com',
            createdDate: '2023-11-13T18:41:32.267Z',
            destroyedDate: null,
            dateAccessed: '2023-11-13T18:41:32.267Z',
          },
          accessScope: 'WORKSPACE_SHARED',
          labels: {},
          region: 'us-central1',
        };

        const listAppsV2 = jest
          .fn()
          .mockResolvedValue([wdsApp])
          .mockResolvedValueOnce([{ ...wdsApp, status: 'PROVISIONING', proxyUrls: {} }]);

        asMockedFn(Ajax).mockImplementation(
          () =>
            ({
              Apps: {
                listAppsV2,
              },
              Billing: {
                listProjects: async () => [azureBillingProject],
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
              waitForServices: {
                wds: true,
              },
              onSuccess: () => {},
              onDismiss: () => {},
            })
          );
        });

        // Act
        const workspaceNameInput = screen.getByLabelText('Workspace name *');
        await user.type(workspaceNameInput, newWorkspace.name);

        const projectSelect = new SelectHelper(screen.getByLabelText('Billing project *'), user);
        await projectSelect.selectOption(/Azure Billing Project/);

        const createWorkspaceButton = screen.getByRole('button', { name: 'Create Workspace' });
        await user.click(createWorkspaceButton);

        // Act
        await act(() => jest.advanceTimersByTime(30000));
        await act(() => jest.advanceTimersByTime(15000));

        // Assert
        expect(listAppsV2).toHaveBeenCalledTimes(2);

        screen.getByText('Failed to provision data services for new workspace.');
      })
    );
  });
});
