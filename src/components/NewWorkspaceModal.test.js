import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { h } from 'react-hyperscript-helpers';
import { mockModalModule } from 'src/components/Modal.mock';
import { Ajax } from 'src/libs/ajax';

import NewWorkspaceModal from './NewWorkspaceModal';

jest.mock('src/components/Modal', () => {
  return mockModalModule();
});

jest.mock('src/libs/ajax');

jest.mock('src/libs/nav', () => ({
  ...jest.requireActual('src/libs/nav'),
  getLink: jest.fn().mockReturnValue(''),
}));

const gcpBillingProject = {
  billingAccount: 'billingAccounts/FOO-BAR-BAZ',
  cloudPlatform: 'GCP',
  invalidBillingAccount: false,
  projectName: 'Google Billing Project',
  roles: ['Owner'],
  status: 'Ready',
};

const azureBillingProject = {
  billingAccount: 'billingAccounts/BAA-RAM-EWE',
  cloudPlatform: 'AZURE',
  invalidBillingAccount: false,
  projectName: 'Azure Billing Project',
  roles: ['Owner'],
  status: 'Ready',
};

const nonBillingAjax = {
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

    Ajax.mockImplementation(() => ({
      Billing: {
        listProjects: async () => [gcpBillingProject, azureBillingProject],
      },
      ...nonBillingAjax,
    }));

    await act(async () => {
      // eslint-disable-line require-await
      render(
        h(NewWorkspaceModal, {
          cloneWorkspace: false,
          onSuccess: () => null,
          onDismiss: () => null,
          customMessage: null,
          requiredAuthDomain: false,
          title: null,
          buttonText: null,
          // workflowImport: false <== Not specified. False should be the default
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

  it('Hides azure billing projects if part of workflow import', async () => {
    // Arrange
    const user = userEvent.setup();

    Ajax.mockImplementation(() => ({
      Billing: {
        listProjects: async () => [gcpBillingProject, azureBillingProject],
      },
      ...nonBillingAjax,
    }));

    await act(async () => {
      // eslint-disable-line require-await
      render(
        h(NewWorkspaceModal, {
          cloneWorkspace: false,
          onSuccess: () => null,
          onDismiss: () => null,
          customMessage: null,
          requiredAuthDomain: false,
          title: null,
          buttonText: null,
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

    Ajax.mockImplementation(() => ({
      Billing: {
        listProjects: async () => [gcpBillingProject],
      },
      ...nonBillingAjax,
    }));

    await act(async () => {
      // eslint-disable-line require-await
      render(
        h(NewWorkspaceModal, {
          cloneWorkspace: false,
          onSuccess: () => null,
          onDismiss: () => null,
          customMessage: null,
          requiredAuthDomain: false,
          title: null,
          buttonText: null,
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

  it('shows an option for Enhanced Bucket Logging if a Google billing project is selected', async () => {
    // Arrange
    const user = userEvent.setup();

    Ajax.mockImplementation(() => ({
      Billing: {
        listProjects: async () => [gcpBillingProject, azureBillingProject],
      },
      ...nonBillingAjax,
    }));

    await act(async () => {
      // eslint-disable-line require-await
      render(
        h(NewWorkspaceModal, {
          cloneWorkspace: false,
          onSuccess: () => null,
          onDismiss: () => null,
          customMessage: null,
          requiredAuthDomain: false,
          title: null,
          buttonText: null,
          // workflowImport: false <== Not specified. False should be the default
        })
      );
    });

    const projectSelector = screen.getByText('Select a billing project');
    await user.click(projectSelector);

    const googleBillingProject = screen.getByText('Google Billing Project');
    await user.click(googleBillingProject);

    // Assert
    // getByText throws an error if the element is not found:
    screen.getByText('Enhanced Bucket Logging');
  });

  it('does not let the user disable Enhanced Bucket Logging if its required', async () => {
    // Arrange
    const user = userEvent.setup();

    Ajax.mockImplementation(() => ({
      Billing: {
        listProjects: async () => [gcpBillingProject, azureBillingProject],
      },
      ...nonBillingAjax,
    }));

    await act(async () => {
      // eslint-disable-line require-await
      render(
        h(NewWorkspaceModal, {
          cloneWorkspace: false,
          onSuccess: () => null,
          onDismiss: () => null,
          customMessage: null,
          requiredAuthDomain: false,
          requireEnhancedBucketLogging: true,
          title: null,
          buttonText: null,
          // workflowImport: false <== Not specified. False should be the default
        })
      );
    });

    const projectSelector = screen.getByText('Select a billing project');
    await user.click(projectSelector);

    const googleBillingProject = screen.getByText('Google Billing Project');
    await user.click(googleBillingProject);

    // Assert
    // getByText throws an error if the element is not found:
    expect(screen.getByRole('checkbox')).toHaveAttribute('disabled');
  });

  it('checks and disables Enhanced Bucket Logging if an auth domain is chosen', async () => {
    // Arrange
    const user = userEvent.setup();

    Ajax.mockImplementation(() => ({
      Billing: {
        listProjects: async () => [gcpBillingProject, azureBillingProject],
      },
      ...hasGroupsAjax,
    }));

    await act(async () => {
      // eslint-disable-line require-await
      render(
        h(NewWorkspaceModal, {
          cloneWorkspace: false,
          onSuccess: () => null,
          onDismiss: () => null,
          customMessage: null,
          requiredAuthDomain: false,
          requireEnhancedBucketLogging: true,
          title: null,
          buttonText: null,
          // workflowImport: false <== Not specified. False should be the default
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
    // getByText throws an error if the element is not found:
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toHaveAttribute('disabled');
    expect(checkbox).toBeChecked();
  });
});
