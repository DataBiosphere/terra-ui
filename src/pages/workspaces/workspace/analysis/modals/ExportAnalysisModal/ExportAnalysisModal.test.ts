import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { h } from 'react-hyperscript-helpers';
import { WorkspaceInfo, WorkspaceWrapper } from 'src/libs/workspace-utils';
import { useAnalysisExportState } from 'src/pages/workspaces/workspace/analysis/modals/ExportAnalysisModal/useAnalysisExportState';
import { AnalysisFile } from 'src/pages/workspaces/workspace/analysis/useAnalysisFiles';
import {
  AbsolutePath,
  DisplayName,
  FileExtension,
  FileName,
} from 'src/pages/workspaces/workspace/analysis/utils/file-utils';
import { runtimeToolLabels } from 'src/pages/workspaces/workspace/analysis/utils/tool-utils';
import { asMockedFn, setUpAutoSizerTesting } from 'src/testing/test-utils';

import { ExportAnalysisModal } from './ExportAnalysisModal';

const analysis1: AnalysisFile = {
  name: 'myDir/Analysis1.ipynb' as AbsolutePath,
  ext: 'ipynb' as FileExtension,
  displayName: 'Analysis1.ipynb' as DisplayName,
  fileName: 'Analysis1.ipynb' as FileName,
  lastModified: 0,
  tool: runtimeToolLabels.Jupyter,
  cloudProvider: 'GCP',
};

type ModalExports = typeof import('src/components/Modal');
jest.mock('src/components/Modal', (): ModalExports => {
  const modalMock = jest.requireActual('src/components/Modal.mock');
  return modalMock.mockModalModule();
});

type ExportAnalysisModalStateExports = typeof import('./useAnalysisExportState');
jest.mock(
  './useAnalysisExportState',
  (): ExportAnalysisModalStateExports => ({
    ...jest.requireActual('./useAnalysisExportState'),
    useAnalysisExportState: jest.fn(),
  })
);

type UtilsExports = typeof import('src/libs/utils');
type LodashFpExports = typeof import('lodash/fp');
jest.mock('src/libs/utils', (): UtilsExports => {
  const _ = jest.requireActual<LodashFpExports>('lodash/fp');
  return {
    ...jest.requireActual('src/libs/utils'),
    isValidWsExportTarget: jest.fn().mockImplementation(
      _.curry((sourceWs: WorkspaceWrapper, destWs: WorkspaceWrapper) => {
        // mock this to have a much simpler check then the real implementation
        return sourceWs.workspace.workspaceId !== destWs.workspace.workspaceId;
      })
    ),
  };
});

setUpAutoSizerTesting();

const mockWorkspaces: Partial<WorkspaceWrapper>[] = [
  {
    workspace: {
      workspaceId: 'Workspace1',
      name: 'name1',
      namespace: 'namespace1',
      cloudPlatform: '',
      authorizationDomain: [],
      createdDate: '2023-02-15T19:17:15.711Z',
      createdBy: 'groot@gmail.com',
    },
  },
  {
    workspace: {
      workspaceId: 'Workspace2',
      name: 'name2',
      namespace: 'namespace2',
      cloudPlatform: '',
      authorizationDomain: [],
      createdDate: '2023-02-15T19:17:15.711Z',
      createdBy: 'groot@gmail.com',
    },
  },
  {
    workspace: {
      workspaceId: 'Workspace3',
      name: 'name3',
      namespace: 'namespace3',
      cloudPlatform: '',
      authorizationDomain: [],
      createdDate: '2023-02-15T19:17:15.711Z',
      createdBy: 'groot@gmail.com',
    },
  },
];

describe('ExportAnalysisModal', () => {
  it('renders initial state', () => {
    // Arrange
    const workspaceInfo: Partial<WorkspaceInfo> = {};
    const workspace: Partial<WorkspaceWrapper> = {
      workspace: workspaceInfo as WorkspaceInfo,
    };
    asMockedFn(useAnalysisExportState).mockReturnValue({
      workspaces: mockWorkspaces as WorkspaceWrapper[],
      existingAnalysisFiles: { status: 'None' },
      selectedWorkspace: null,
      pendingCopy: { status: 'None' },
      copyAnalysis: jest.fn(),
      selectWorkspace: jest.fn(),
    });

    // Act
    render(
      h(ExportAnalysisModal, {
        workspace: workspace as WorkspaceWrapper,
        printName: 'PrintName123',
        onDismiss: () => {},
        toolLabel: runtimeToolLabels.Jupyter,
      })
    );

    // Assert
    screen.getByText('Copy to Workspace');
    screen.getByLabelText('Destination *');
    screen.getByText('Select a workspace');
    screen.getByLabelText('Name *');
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBe(2);
    within(buttons[0]).getByText('Cancel');
    expect(buttons[0]).not.toHaveAttribute('disabled');
    within(buttons[1]).getByText('Copy');
    expect(buttons[1]).toHaveAttribute('disabled');
    expect(screen.queryAllByTestId('loading-spinner').length).toBe(0);
  });

  it('calls selectWorkspace() on workspace dropdown select', async () => {
    // Arrange
    const user = userEvent.setup();
    const workspaceInfo: Partial<WorkspaceInfo> = {
      workspaceId: 'Workspace1',
      name: 'name1',
    };
    const workspace: Partial<WorkspaceWrapper> = {
      workspace: workspaceInfo as WorkspaceInfo,
    };
    const selectWorkspaceWatcher = jest.fn();
    asMockedFn(useAnalysisExportState).mockReturnValue({
      workspaces: mockWorkspaces as WorkspaceWrapper[],
      existingAnalysisFiles: { status: 'None' },
      selectedWorkspace: null,
      pendingCopy: { status: 'None' },
      copyAnalysis: jest.fn(),
      selectWorkspace: selectWorkspaceWatcher,
    });

    render(
      h(ExportAnalysisModal, {
        workspace: workspace as WorkspaceWrapper,
        printName: 'PrintName123',
        onDismiss: () => {},
        toolLabel: runtimeToolLabels.Jupyter,
      })
    );

    // Act
    const destDropdown = screen.getByLabelText('Destination *');
    await user.click(destDropdown);
    const destOptions = screen.getAllByRole('option').map((el: HTMLElement) => el.textContent);
    const destOption = screen.getByText('name2');
    await user.click(destOption);

    // Assert
    // drop-down should only list options that are not same as source workspace (name1)
    expect(destOptions).toEqual(['name2', 'name3']);
    expect(selectWorkspaceWatcher).toBeCalledTimes(1);
    expect(selectWorkspaceWatcher).toBeCalledWith('Workspace2');
  });
  it('enables copy button and calls copyAnalysis() when form is ready and submitted', async () => {
    // Arrange
    const user = userEvent.setup();
    const workspaceInfo: Partial<WorkspaceInfo> = {
      workspaceId: 'Workspace1',
      name: 'name1',
    };
    const workspace: Partial<WorkspaceWrapper> = {
      workspace: workspaceInfo as WorkspaceInfo,
    };
    const copyWatcher = jest.fn();
    asMockedFn(useAnalysisExportState).mockReturnValue({
      workspaces: mockWorkspaces as WorkspaceWrapper[],
      existingAnalysisFiles: { status: 'None' },
      selectedWorkspace: (mockWorkspaces[1] as WorkspaceWrapper).workspace,
      pendingCopy: { status: 'None' },
      copyAnalysis: copyWatcher,
      selectWorkspace: jest.fn(),
    });

    render(
      h(ExportAnalysisModal, {
        workspace: workspace as WorkspaceWrapper,
        printName: 'PrintName123',
        onDismiss: () => {},
        toolLabel: runtimeToolLabels.Jupyter,
      })
    );

    // Act
    // complete the form
    const nameInput = screen.getByLabelText('Name *');
    await user.type(nameInput, 'newName7');
    // copy button should now be enabled and clickable
    const copyButton = screen.getAllByRole('button')[1];
    await user.click(copyButton);

    // Assert
    expect(copyWatcher).toBeCalledTimes(1);
    expect(copyWatcher).toBeCalledWith('PrintName123newName7');
  });
  it('handles copy pending (loading)', () => {
    const workspaceInfo: Partial<WorkspaceInfo> = {
      workspaceId: 'Workspace1',
      name: 'name1',
    };
    const workspace: Partial<WorkspaceWrapper> = {
      workspace: workspaceInfo as WorkspaceInfo,
    };
    const copyWatcher = jest.fn();
    asMockedFn(useAnalysisExportState).mockReturnValue({
      workspaces: mockWorkspaces as WorkspaceWrapper[],
      existingAnalysisFiles: { status: 'None' },
      selectedWorkspace: (mockWorkspaces[1] as WorkspaceWrapper).workspace,
      pendingCopy: { status: 'Loading', state: null },
      copyAnalysis: copyWatcher,
      selectWorkspace: jest.fn(),
    });

    // Act
    render(
      h(ExportAnalysisModal, {
        workspace: workspace as WorkspaceWrapper,
        printName: 'PrintName123',
        onDismiss: () => {},
        toolLabel: runtimeToolLabels.Jupyter,
      })
    );

    // Assert
    expect(screen.queryAllByTestId('loading-spinner').length).toBe(1);
  });

  it('handles copy complete', () => {
    const workspaceInfo: Partial<WorkspaceInfo> = {
      workspaceId: 'Workspace1',
      name: 'name1',
    };
    const workspace: Partial<WorkspaceWrapper> = {
      workspace: workspaceInfo as WorkspaceInfo,
    };
    const copyWatcher = jest.fn();
    asMockedFn(useAnalysisExportState).mockReturnValue({
      workspaces: mockWorkspaces as WorkspaceWrapper[],
      existingAnalysisFiles: { status: 'None' },
      selectedWorkspace: (mockWorkspaces[1] as WorkspaceWrapper).workspace,
      pendingCopy: { status: 'Ready', state: true },
      copyAnalysis: copyWatcher,
      selectWorkspace: jest.fn(),
    });

    // Act
    render(
      h(ExportAnalysisModal, {
        workspace: workspace as WorkspaceWrapper,
        printName: 'PrintName123',
        onDismiss: () => {},
        toolLabel: runtimeToolLabels.Jupyter,
      })
    );

    // Assert
    const modalPanel = screen.getByRole('dialog');
    expect(modalPanel).toHaveTextContent(
      'Successfully copied PrintName123 to name2. Do you want to view the copied analysis?'
    );
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBe(2);
    within(buttons[0]).getByText('Stay Here');
    expect(buttons[0]).not.toHaveAttribute('disabled');
    within(buttons[1]).getByText('Go to copied analysis');
    expect(buttons[1]).not.toHaveAttribute('disabled');
    expect(screen.queryAllByTestId('loading-spinner').length).toBe(0);
  });
  it('handles existing name form error', async () => {
    // Arrange
    const user = userEvent.setup();
    const workspaceInfo: Partial<WorkspaceInfo> = {
      workspaceId: 'Workspace1',
      name: 'name1',
    };
    const workspace: Partial<WorkspaceWrapper> = {
      workspace: workspaceInfo as WorkspaceInfo,
    };
    const copyWatcher = jest.fn();
    asMockedFn(useAnalysisExportState).mockReturnValue({
      workspaces: mockWorkspaces as WorkspaceWrapper[],
      existingAnalysisFiles: { status: 'Ready', state: [analysis1] },
      selectedWorkspace: (mockWorkspaces[1] as WorkspaceWrapper).workspace,
      pendingCopy: { status: 'None' },
      copyAnalysis: copyWatcher,
      selectWorkspace: jest.fn(),
    });

    render(
      h(ExportAnalysisModal, {
        workspace: workspace as WorkspaceWrapper,
        printName: 'PrintName123',
        onDismiss: () => {},
        toolLabel: runtimeToolLabels.Jupyter,
      })
    );

    // Act
    // complete the form
    const nameInput = screen.getByLabelText('Name *');
    await user.clear(nameInput);
    await user.type(nameInput, analysis1.displayName);

    // Assert
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBe(2);
    within(buttons[0]).getByText('Cancel');
    expect(buttons[0]).not.toHaveAttribute('disabled');
    within(buttons[1]).getByText('Copy');
    expect(buttons[1]).toHaveAttribute('disabled');
    expect(screen.queryAllByTestId('loading-spinner').length).toBe(0);
    expect(screen.getAllByText('Name already exists').length).toBeGreaterThanOrEqual(1);
  });
  it('handles copy error', () => {
    const workspaceInfo: Partial<WorkspaceInfo> = {
      workspaceId: 'Workspace1',
      name: 'name1',
    };
    const workspace: Partial<WorkspaceWrapper> = {
      workspace: workspaceInfo as WorkspaceInfo,
    };
    asMockedFn(useAnalysisExportState).mockReturnValue({
      workspaces: mockWorkspaces as WorkspaceWrapper[],
      existingAnalysisFiles: { status: 'None' },
      selectedWorkspace: (mockWorkspaces[1] as WorkspaceWrapper).workspace,
      pendingCopy: { status: 'Error', state: null, error: Error('BOOM!') },
      copyAnalysis: jest.fn(),
      selectWorkspace: jest.fn(),
    });

    // Act
    render(
      h(ExportAnalysisModal, {
        workspace: workspace as WorkspaceWrapper,
        printName: 'PrintName123',
        onDismiss: () => {},
        toolLabel: runtimeToolLabels.Jupyter,
      })
    );

    // Assert
    const modalPanel = screen.getByRole('dialog');
    expect(modalPanel).toHaveTextContent('BOOM!');
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBe(2);
    within(buttons[0]).getByText('Cancel');
    expect(buttons[0]).not.toHaveAttribute('disabled');
    within(buttons[1]).getByText('Copy');
    expect(buttons[1]).not.toHaveAttribute('disabled');
    expect(screen.queryAllByTestId('loading-spinner').length).toBe(0);
  });
});
