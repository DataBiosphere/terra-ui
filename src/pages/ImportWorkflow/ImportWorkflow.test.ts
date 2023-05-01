import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { h } from 'react-hyperscript-helpers';
import { useWorkspaces } from 'src/components/workspace-utils';
import { WorkspaceWrapper } from 'src/libs/workspace-utils';
import { asMockedFn } from 'src/testing/test-utils';

import { importDockstoreWorkflow } from './importDockstoreWorkflow';
import { ImportWorkflow } from './ImportWorkflow';
import { useDockstoreWdl } from './useDockstoreWdl';

type WorkspaceUtilsExports = typeof import('src/components/workspace-utils');
jest.mock('src/components/workspace-utils', (): WorkspaceUtilsExports => {
  const { h } = jest.requireActual('react-hyperscript-helpers');

  const useWorkspaces = jest.fn();
  return {
    ...jest.requireActual('src/components/workspace-utils'),
    useWorkspaces,
    // WorkspaceImporter is wrapped in withWorkspaces to fetch the list of workspaces.
    // withWorkspaces calls useWorkspaces.
    // However, since withWorkspaces and useWorkspaces are in the same module, simply
    // mocking useWorkspaces won't work: withWorkspaces will use the unmocked version.
    // So we have to mock withWorkspaces.
    // And since WorkspaceImporter calls withWorkspaces at the module level, it must
    // be mocked here, not in a before... block.
    // Thus, we also mock useWorkspaces to allow tests to control the returned workspaces.
    withWorkspaces: (Component) => {
      return (props) => {
        const { workspaces, refresh, loading } = useWorkspaces();
        return h(Component, {
          ...props,
          workspaces,
          refreshWorkspaces: refresh,
          loadingWorkspaces: loading,
        });
      };
    },
  };
});

jest.mock('./importDockstoreWorkflow', () => ({
  importDockstoreWorkflow: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('./useDockstoreWdl', () => ({
  useDockstoreWdl: jest.fn().mockReturnValue({
    status: 'Ready',
    wdl: 'workflow TestWorkflow {}',
  }),
}));

jest.mock('src/libs/nav', () => ({
  ...jest.requireActual('src/libs/nav'),
  goToPath: jest.fn(),
}));

// The workspace menu uses react-virtualized's AutoSizer to size the options menu.
// This makes the virtualized window large enough for options to be rendered.
jest.mock('react-virtualized', () => ({
  ...jest.requireActual('react-virtualized'),
  AutoSizer: ({ children }) => children({ width: 300 }),
}));

describe('ImportWorkflow', () => {
  beforeAll(() => {
    // Arrange
    asMockedFn(useWorkspaces).mockReturnValue({
      workspaces: [
        {
          workspace: { namespace: 'test', name: 'workspace1', workspaceId: '6771d2c8-cd58-47da-a54c-6cdafacc4175' },
          accessLevel: 'WRITER',
        },
        {
          workspace: { namespace: 'test', name: 'workspace2', workspaceId: '5cfa16d8-d604-4de8-8e8a-acde05d71b99' },
          accessLevel: 'WRITER',
        },
      ] as WorkspaceWrapper[],
      refresh: () => Promise.resolve(),
      loading: false,
    });
  });

  it('fetches and renders WDL', () => {
    // Act
    render(
      h(ImportWorkflow, {
        path: 'github.com/DataBiosphere/test-workflows/test-workflow',
        version: 'v1.0.0',
        source: 'dockstore',
      })
    );

    // Assert
    expect(useDockstoreWdl).toHaveBeenCalledWith({
      path: 'github.com/DataBiosphere/test-workflows/test-workflow',
      version: 'v1.0.0',
      isTool: false,
    });

    const wdlContainer = document.querySelector('code')!;
    expect(wdlContainer).toHaveTextContent('workflow TestWorkflow {}');
  });

  describe('workflow name', () => {
    it('defaults workflow name based on path', () => {
      // Act
      render(
        h(ImportWorkflow, {
          path: 'github.com/DataBiosphere/test-workflows/test-workflow',
          version: 'v1.0.0',
          source: 'dockstore',
        })
      );

      // Assert
      const nameInput = screen.getByLabelText('Workflow Name');
      expect(nameInput).toHaveValue('test-workflow');
    });

    it('validates name', async () => {
      // Arrange
      const user = userEvent.setup();

      render(
        h(ImportWorkflow, {
          path: 'github.com/DataBiosphere/test-workflows/test-workflow',
          version: 'v1.0.0',
          source: 'dockstore',
        })
      );

      const nameInput = screen.getByLabelText('Workflow Name');

      // Act
      await user.clear(nameInput);
      await user.type(nameInput, 'a new workflow name');

      // Assert
      screen.getByText('Workflow name can only contain letters, numbers, underscores, dashes, and periods');
    });
  });

  it('it imports the workflow into the selected workspace', async () => {
    // Arrange
    const user = userEvent.setup();

    const testWorkflow = {
      path: 'github.com/DataBiosphere/test-workflows/test-workflow',
      version: 'v1.0.0',
      source: 'dockstore',
    };

    render(h(ImportWorkflow, { ...testWorkflow }));

    // Act
    const workspaceMenu = screen.getByLabelText('Destination Workspace');
    await user.click(workspaceMenu);
    const option = screen.getAllByRole('option').find((el) => el.textContent === 'workspace1')!;
    await user.click(option);

    const importButton = screen.getByText('Import');
    await act(() => user.click(importButton));

    // Assert
    expect(importDockstoreWorkflow).toHaveBeenCalledWith(
      expect.objectContaining({
        workspace: expect.objectContaining({ namespace: 'test', name: 'workspace1' }),
        workflow: testWorkflow,
      }),
      { overwrite: false }
    );
  });

  it('confirms overwrite if workflow already exists', async () => {
    // Arrange
    const user = userEvent.setup();

    asMockedFn(importDockstoreWorkflow).mockRejectedValueOnce(new Response('{}', { status: 409 }));

    const testWorkflow = {
      path: 'github.com/DataBiosphere/test-workflows/test-workflow',
      version: 'v1.0.0',
      source: 'dockstore',
    };

    render(h(ImportWorkflow, { ...testWorkflow }));

    // Act
    const workspaceMenu = screen.getByLabelText('Destination Workspace');
    await user.click(workspaceMenu);
    const option = screen.getAllByRole('option').find((el) => el.textContent === 'workspace1')!;
    await user.click(option);

    const importButton = screen.getByText('Import');
    await act(() => user.click(importButton));
    const firstImportDockstoreWorkflowCallArgs = asMockedFn(importDockstoreWorkflow).mock.calls[0];

    const confirmationMessageShown = !!screen.queryByText(
      'The selected workspace already contains a workflow named "test-workflow". Are you sure you want to overwrite it?'
    );
    const confirmButton = screen.getByText('Overwrite');
    await act(() => user.click(confirmButton));
    const secondImportDockstoreWorkflowCallArgs = asMockedFn(importDockstoreWorkflow).mock.calls[1];

    // Assert
    expect(firstImportDockstoreWorkflowCallArgs).toEqual([
      expect.objectContaining({
        workspace: expect.objectContaining({ namespace: 'test', name: 'workspace1' }),
        workflow: testWorkflow,
      }),
      { overwrite: false },
    ]);

    expect(confirmationMessageShown).toBe(true);

    expect(secondImportDockstoreWorkflowCallArgs).toEqual([
      expect.objectContaining({
        workspace: expect.objectContaining({ namespace: 'test', name: 'workspace1' }),
        workflow: testWorkflow,
      }),
      { overwrite: true },
    ]);
  });
});
