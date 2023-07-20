import { getAllByRole, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { h } from 'react-hyperscript-helpers';
import { defaultAzureWorkspace, defaultGoogleWorkspace } from 'src/analysis/_testData/testData';

import { ImportDataDestination, ImportDataOverview, isProtectedSource, isProtectedWorkspace } from './ImportData';

const protectedUrls = [
  { url: 'https://prod.anvil.gi.ucsc.edu/file', format: 'pfb' },
  { url: 'https://anvilproject.org/file2', format: 'PFB' },
  { url: 'https://dev.anvil.gi.ucsc.edu/manifest/files', format: 'pFb' },
  { url: 'https://gen3.biodatacatalyst.nhlbi.nih.gov/explorer', format: 'PFB' },
  { url: 'https://gen3-biodatacatalyst-nhlbi-nih-gov-pfb-export.s3.amazonaws.com/dataset', format: 'pfB' },
  { url: 'https://gen3-theanvil-io-pfb-export.s3.amazonaws.com/export_2023-07-07.avro', format: 'PFB' },
];
const nonProtectedUrls = [
  { url: 'https://nonanvil.site.org/file', format: 'pfb' },
  { url: 'https://prod.anvil.gi.ucsc.edu/file', format: 'entitiesJson' },
  { url: 'https://google.com/file.pfb', format: 'PFB' },
  { url: 'https://nonanvil.site.org/file', format: 'tdrexport' },
  { url: 'https://prod.anvil.gi.ucsc.edu/file', format: 'snapshot' },
  { url: 'https://anvilproject.org/', format: 'catalog' },
  { url: 'https://gen3.biodatacatalyst.nhlbi.nih.gov/explorer', format: 'snapShot' },
  { url: 'http://localhost:3000', format: '' },
  { url: '', format: 'pfb' },
  { url: null, format: 'PFB' },
];

describe('isProtectedSource', () => {
  it.each(protectedUrls)('%o should  be protected', ({ url, format }) => {
    expect(isProtectedSource(url, format)).toBe(true);
  });

  it.each(nonProtectedUrls)('%o should not be protected', ({ url, format }) => {
    expect(isProtectedSource(url, format)).toBe(false);
  });
});

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

describe('ImportDataOverview', () => {
  const header = 'Linking data to a workspace';
  const snapshots = [];
  const isDataset = true;
  const snapshotResponses = [];

  it('should render warning about protected data', () => {
    render(
      h(ImportDataOverview, {
        header,
        snapshots,
        isDataset,
        snapshotResponses,
        url: 'https://gen3-theanvil-io-pfb-export.s3.amazonaws.com/export_2023-07-07.avro',
        isProtectedData: true,
      })
    );

    const protectedWarning = screen.queryByText('The data you chose to import to Terra are identified as protected', { exact: false });
    expect(protectedWarning).not.toBeNull();
    const noWarning = screen.queryByText('The dataset(s) you just chose to import to Terra will be made available to you', { exact: false });
    expect(noWarning).toBeNull();
  });

  it('should not render warning about unprotected data', () => {
    render(h(ImportDataOverview, { header, snapshots, isDataset, snapshotResponses, url: 'https://google.com/file.pfb', isProtectedData: false }));
    const protectedWarning = screen.queryByText('The data you chose to import to Terra are identified as protected', { exact: false });
    expect(protectedWarning).toBeNull();
    const noWarning = screen.queryByText('The dataset(s) you just chose to import to Terra will be made available to you', { exact: false });
    expect(noWarning).not.toBeNull();
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

describe('ImportDataDestination', () => {
  it('should explain protected data restricts eligible workspaces', async () => {
    render(
      h(ImportDataDestination, {
        workspaceId: null,
        templateWorkspaces: [],
        template: [],
        userHasBillingProjects: true,
        importMayTakeTime: true,
        authorizationDomain: '',
        onImport: () => {},
        isImporting: false,
        isProtectedData: true,
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
      h(ImportDataDestination, {
        workspaceId: null,
        templateWorkspaces: [],
        template: [],
        userHasBillingProjects: true,
        importMayTakeTime: true,
        authorizationDomain: '',
        onImport: () => {},
        isImporting: false,
        isProtectedData: false,
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
      h(ImportDataDestination, {
        workspaceId: null,
        templateWorkspaces: [],
        template: [],
        userHasBillingProjects: true,
        importMayTakeTime: true,
        authorizationDomain: '',
        onImport: () => {},
        isImporting: false,
        isProtectedData: true,
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
});
