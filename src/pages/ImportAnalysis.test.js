import { getAllByRole, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { h } from 'react-hyperscript-helpers';
import { defaultAzureWorkspace, defaultGoogleWorkspace } from 'src/analysis/_testData/testData';

import { importAnalysisFile, ImportDestination, ImportOverview, isProtectedWorkspace } from './ImportAnalysis';

describe('isProtectedWorkspace', () => {
  const unprotectedWorkspaces = [defaultAzureWorkspace, defaultGoogleWorkspace];

  it.each(unprotectedWorkspaces)('%o should not be protected', (workspace) => {
    expect(isProtectedWorkspace(workspace)).toBe(false);
  });

  it('should recognize a protected workspace', () => {
    const protectedWorkspace = { ...defaultGoogleWorkspace };
    protectedWorkspace.workspace.bucketName = `fc-secure-${defaultGoogleWorkspace.workspace.bucketName}`;

    expect(isProtectedWorkspace(protectedWorkspace)).toBe(true);
  });
});

describe('ImportOverview', () => {
  const header = 'Analysis (Jupyter)';

  it('should render warning about protected data', () => {
    render(
      h(ImportOverview, {
        header,
        url: 'https://storage.googleapis.com/export-bucket/generated.ipynb?x-goog-signature=123456signedurl',
        requireProtectedWorkspace: true,
        referrer: 'Tanagra Data Explorer',
      })
    );

    const protectedWarning = screen.queryByText('The analysis you chose to import to Terra is identified as protected', { exact: false });
    expect(protectedWarning).not.toBeNull();
    const noWarning = screen.queryByText(
      'The analysis you just chose to import to Terra will be made available to you within a workspace of your choice where you can then open it.',
      { exact: false }
    );
    expect(noWarning).toBeNull();
  });

  it('should not render warning about unprotected data', () => {
    render(
      h(ImportOverview, {
        header,
        url: 'https://storage.googleapis.com/export-bucket/generated.ipynb?x-goog-signature=123456signedurl',
        requireProtectedWorkspace: false,
        referrer: 'Tanagra Data Explorer',
      })
    );
    const protectedWarning = screen.queryByText(
      'The analysis you chose to import to Terra is identified as protected and requires additional security settings. Please select a workspace that has an Authorization Domain and/or protected data setting.',
      { exact: false }
    );
    expect(protectedWarning).toBeNull();
    const noWarning = screen.queryByText(
      'The analysis you just chose to import to Terra will be made available to you within a workspace of your choice where you can then open it.',
      { exact: false }
    );
    expect(noWarning).not.toBeNull();
  });

  it('should display the referrer', () => {
    render(
      h(ImportOverview, {
        header,
        url: 'https://storage.googleapis.com/export-bucket/generated.ipynb?x-goog-signature=123456signedurl',
        requireProtectedWorkspace: false,
        referrer: 'Tanagra Data Explorer',
      })
    );
    const fromReferrer = screen.queryByText('From: Tanagra Data Explorer', { exact: false });
    expect(fromReferrer).not.toBeNull();
  });

  it('should display the hostname', () => {
    render(
      h(ImportOverview, {
        header,
        url: 'https://storage.googleapis.com/export-bucket/generated.ipynb?x-goog-signature=123456signedurl',
        requireProtectedWorkspace: false,
      })
    );
    const fromHostname = screen.queryByText('From: storage.googleapis.com', { exact: false });
    expect(fromHostname).not.toBeNull();
  });
});

jest.mock('src/components/workspace-utils', () => ({
  ...jest.requireActual('src/components/workspace-utils'),
  useWorkspaces: jest.fn().mockReturnValue({
    loading: false,
    workspaces: [
      {
        workspace: {
          namespace: 'test-namespace',
          name: 'protected-google',
          cloudPlatform: 'Gcp',
          googleProject: 'test-project-1',
          workspaceId: 'ws-1',
          bucketName: 'fc-secure-ws-1',
        },
        accessLevel: 'PROJECT_OWNER',
      },
      {
        workspace: {
          namespace: 'test-namespace',
          name: 'unprotected-google',
          cloudPlatform: 'Gcp',
          googleProject: 'test-project-2',
          workspaceId: 'ws-2',
          bucketName: 'fc-ws-2',
        },
        accessLevel: 'OWNER',
      },
      {
        workspace: { namespace: 'test-namespace', name: 'azure', cloudPlatform: 'Azure', workspaceId: 'ws-3' },
        accessLevel: 'WRITER',
      },
    ],
  }),
}));

describe('ImportDestination', () => {
  it('should explain protected data restricts eligible workspaces', async () => {
    render(
      h(ImportDestination, {
        workspaceId: null,
        templateWorkspaces: [],
        template: [],
        userHasBillingProjects: true,
        importMayTakeTime: true,
        authorizationDomain: '',
        onImport: () => {},
        isImporting: false,
        requireProtectedWorkspace: true,
      })
    );
    const existingWorkspace = screen.queryByText('Start with an existing workspace', { exact: false });
    await userEvent.click(existingWorkspace); // select start with existing workspace

    const protectedWarning = screen.queryByText('You may only import to workspaces with an Authorization Domain and/or protected data setting.', {
      exact: false,
    });
    expect(protectedWarning).not.toBeNull();
  });

  it('should not inform about protected data', async () => {
    render(
      h(ImportDestination, {
        workspaceId: null,
        templateWorkspaces: [],
        template: [],
        userHasBillingProjects: true,
        importMayTakeTime: true,
        authorizationDomain: '',
        onImport: () => {},
        isImporting: false,
        requireProtectedWorkspace: false,
      })
    );
    const existingWorkspace = screen.queryByText('Start with an existing workspace', { exact: false });
    await userEvent.click(existingWorkspace); // select start with existing workspace
    const protectedWarning = screen.queryByText('You may only import to workspaces with an Authorization Domain and/or protected data setting.', {
      exact: false,
    });
    expect(protectedWarning).toBeNull();
  });

  it('should disable noncompliant workspaces', async () => {
    render(
      h(ImportDestination, {
        workspaceId: null,
        templateWorkspaces: [],
        template: [],
        userHasBillingProjects: true,
        importMayTakeTime: true,
        authorizationDomain: '',
        onImport: () => {},
        isImporting: false,
        requireProtectedWorkspace: true,
      })
    );
    const user = userEvent.setup();
    const existingWorkspace = screen.queryByText('Start with an existing workspace', { exact: false });
    await userEvent.click(existingWorkspace); // select start with existing workspace

    const selectInput = screen.getByLabelText('Select a workspace');
    await user.click(selectInput);

    const listboxId = selectInput.getAttribute('aria-controls');
    const listbox = document.getElementById(listboxId);

    const options = getAllByRole(listbox, 'option');

    // only the google protected workspace should be enabled
    const protectedOpt = options.find((opt) => opt.textContent === 'protected-google');
    expect(protectedOpt).not.toBeNull();
    expect(protectedOpt.getAttribute('aria-disabled')).toBe('false');

    const unprotected1 = options.find((opt) => opt.textContent === 'unprotected-google');
    expect(unprotected1).not.toBeNull();
    expect(unprotected1.getAttribute('aria-disabled')).toBe('true');

    const unprotected2 = options.find((opt) => opt.textContent === 'azure');
    expect(unprotected2).not.toBeNull();
    expect(unprotected2.getAttribute('aria-disabled')).toBe('true');
  });

  it('should throw for an invalid runtime', () => {
    const invalidRuntime = 'JupyterINVALID';
    const url = 'https://storage.googleapis.com/export-bucket/generated.ipynb?x-goog-signature=123456signedurl';
    const filename = 'test.ipynb';
    render(
      h(ImportDestination, {
        workspaceId: null,
        templateWorkspaces: [],
        template: [],
        userHasBillingProjects: true,
        importMayTakeTime: true,
        authorizationDomain: '',
        onImport: importAnalysisFile(defaultGoogleWorkspace.namespace, defaultGoogleWorkspace.name, url, filename, invalidRuntime),
        isImporting: false,
        requireProtectedWorkspace: true,
      })
    );
  });

  it('should not throw for a valid runtime', () => {
    const validRuntime = 'Jupyter';
    const url = 'https://storage.googleapis.com/export-bucket/generated.ipynb?x-goog-signature=123456signedurl';
    const filename = 'test.ipynb';
    render(
      h(ImportDestination, {
        workspaceId: null,
        templateWorkspaces: [],
        template: [],
        userHasBillingProjects: true,
        importMayTakeTime: true,
        authorizationDomain: '',
        onImport: importAnalysisFile(defaultGoogleWorkspace.namespace, defaultGoogleWorkspace.name, url, filename, validRuntime),
        isImporting: false,
        requireProtectedWorkspace: true,
      })
    );
  });
});
