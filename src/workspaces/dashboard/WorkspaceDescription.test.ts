import { act, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import _ from 'lodash/fp';
import { div, h } from 'react-hyperscript-helpers';
import { MarkdownEditor } from 'src/components/markdown';
import { Metrics, MetricsContract } from 'src/libs/ajax/Metrics';
import { WorkspaceContract, Workspaces, WorkspacesAjaxContract } from 'src/libs/ajax/workspaces/Workspaces';
import Events, { extractWorkspaceDetails } from 'src/libs/events';
import { asMockedFn, partial, renderWithAppContexts as render } from 'src/testing/test-utils';
import { defaultGoogleWorkspace } from 'src/testing/workspace-fixtures';
import { WorkspaceDescription } from 'src/workspaces/dashboard/WorkspaceDescription';
import { canEditWorkspace } from 'src/workspaces/utils';

jest.mock('src/libs/error');

jest.mock('src/libs/ajax/Metrics');
jest.mock('src/libs/ajax/workspaces/Workspaces');

type MockErrorExports = typeof import('src/libs/error.mock');
jest.mock('src/libs/error', () => {
  const errorModule = jest.requireActual('src/libs/error');
  const mockErrorModule = jest.requireActual<MockErrorExports>('src/libs/error.mock');
  return {
    ...errorModule,
    withErrorReporting: mockErrorModule.mockWithErrorReporting,
  };
});

type WorkspaceUtilsExports = typeof import('src/workspaces/utils');

jest.mock(
  'src/workspaces/utils',
  (): WorkspaceUtilsExports => ({
    ...jest.requireActual('src/workspaces/utils'),
    canEditWorkspace: jest.fn(),
  })
);

type MarkdownExports = typeof import('src/components/markdown');
jest.mock(
  'src/components/markdown',
  (): MarkdownExports => ({
    ...jest.requireActual('src/components/markdown'),
    MarkdownEditor: jest.fn(),
  })
);

describe('WorkspaceDescription', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('displays the workspace description', async () => {
    // Arrange
    asMockedFn(canEditWorkspace).mockReturnValue({ value: true });
    const description = 'this is a very descriptive decription';
    const props = {
      workspace: _.merge(defaultGoogleWorkspace, { workspace: { attributes: { description } } }),
      refreshWorkspace: jest.fn(),
    };

    // Act
    const { container } = render(h(WorkspaceDescription, props));

    // Assert
    expect(screen.queryByText(description)).not.toBeNull();
    expect(await axe(container)).toHaveNoViolations();
  });

  it('displays a placeholder for a workspace without a description', () => {
    // Arrange
    asMockedFn(canEditWorkspace).mockReturnValue({ value: true });
    const props = {
      workspace: _.merge(defaultGoogleWorkspace, { workspace: { attributes: { description: undefined } } }),
      refreshWorkspace: jest.fn(),
    };

    // Act
    render(h(WorkspaceDescription, props));
    // Assert
    expect(screen.queryByText('No description added')).not.toBeNull();
  });

  it('allows editing with no existing description', async () => {
    // Arrange
    const user = userEvent.setup();
    asMockedFn(canEditWorkspace).mockReturnValue({ value: true });
    const captureEvent = jest.fn();
    asMockedFn(Metrics).mockReturnValue(partial<MetricsContract>({ captureEvent }));

    const props = {
      workspace: _.merge(defaultGoogleWorkspace, { workspace: { attributes: { description: undefined } } }),
      refreshWorkspace: jest.fn(),
    };

    // Act
    render(h(WorkspaceDescription, props));

    const editButton = screen.getByLabelText('Edit description');
    await user.click(editButton);
    // Assert
    expect(asMockedFn(MarkdownEditor)).toHaveBeenCalledWith(
      expect.objectContaining({
        value: '',
        placeholder: 'Enter a description',
      }),
      expect.any(Object)
    );
    expect(captureEvent).toHaveBeenCalledWith(
      Events.workspaceDashboardEditDescription,
      extractWorkspaceDetails(defaultGoogleWorkspace)
    );
  });

  it('initialized editing with the original workspace description', async () => {
    // Arrange
    const user = userEvent.setup();
    asMockedFn(canEditWorkspace).mockReturnValue({ value: true });
    asMockedFn(Metrics).mockReturnValue(partial<MetricsContract>({ captureEvent: jest.fn() }));
    const description = 'this is a very descriptive decription';
    const props = {
      workspace: _.merge(defaultGoogleWorkspace, { workspace: { attributes: { description } } }),
      refreshWorkspace: jest.fn(),
    };

    // Act
    render(h(WorkspaceDescription, props));
    const editButton = screen.getByLabelText('Edit description');
    await user.click(editButton);

    // Assert
    expect(asMockedFn(MarkdownEditor)).toHaveBeenCalledWith(
      expect.objectContaining({
        value: description,
      }),
      expect.any(Object)
    );
  });

  it('saves the description when the button is pressed', async () => {
    // Arrange
    const user = userEvent.setup();
    asMockedFn(canEditWorkspace).mockReturnValue({ value: true });
    const props = {
      workspace: _.merge(defaultGoogleWorkspace, { workspace: { attributes: { description: undefined } } }),
      refreshWorkspace: jest.fn(),
    };
    const mockShallowMergeNewAttributes = jest.fn().mockResolvedValue({});
    const captureEvent = jest.fn();
    asMockedFn(Metrics).mockReturnValue(partial<MetricsContract>({ captureEvent }));
    asMockedFn(Workspaces).mockReturnValue(
      partial<WorkspacesAjaxContract>({
        workspace: () =>
          partial<WorkspaceContract>({
            shallowMergeNewAttributes: mockShallowMergeNewAttributes,
          }),
      })
    );
    const newDescription = 'the description the user edited';

    let onChange;
    asMockedFn(MarkdownEditor).mockImplementation((props) => {
      onChange = props.onChange;
      return div();
    });

    // Act
    render(h(WorkspaceDescription, props));

    const editButton = screen.getByLabelText('Edit description');
    await user.click(editButton);

    act(() => {
      onChange(newDescription);
    });
    const saveButton = screen.getByText('Save');
    await user.click(saveButton);

    // Assert
    expect(mockShallowMergeNewAttributes).toHaveBeenCalledWith({ description: newDescription });
    expect(captureEvent).toHaveBeenNthCalledWith(
      1,
      Events.workspaceDashboardEditDescription,
      extractWorkspaceDetails(defaultGoogleWorkspace)
    );
    expect(captureEvent).toHaveBeenNthCalledWith(
      2,
      Events.workspaceDashboardSaveDescription,
      extractWorkspaceDetails(defaultGoogleWorkspace)
    );
  });
});
