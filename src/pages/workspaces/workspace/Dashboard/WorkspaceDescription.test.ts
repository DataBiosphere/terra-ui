import { DeepPartial } from '@terra-ui-packages/core-utils';
import { act, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import _ from 'lodash/fp';
import { div, h } from 'react-hyperscript-helpers';
import { MarkdownEditor } from 'src/components/markdown';
import { Ajax } from 'src/libs/ajax';
import Events, { extractWorkspaceDetails } from 'src/libs/events';
import { canEditWorkspace } from 'src/libs/workspace-utils';
import { WorkspaceDescription } from 'src/pages/workspaces/workspace/Dashboard/WorkspaceDescription';
import { asMockedFn, renderWithAppContexts as render } from 'src/testing/test-utils';
import { defaultGoogleWorkspace } from 'src/testing/workspace-fixtures';

jest.mock('src/libs/error');

type AjaxContract = ReturnType<typeof Ajax>;

jest.mock('src/libs/ajax', () => ({
  Ajax: jest.fn(),
}));

jest.mock('src/libs/notifications');

type UtilsExports = typeof import('src/libs/workspace-utils');

jest.mock(
  'src/libs/workspace-utils',
  (): UtilsExports => ({
    ...jest.requireActual('src/libs/workspace-utils'),
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
    asMockedFn(Ajax).mockReturnValue({
      Metrics: { captureEvent } as Partial<AjaxContract['Metrics']>,
    } as DeepPartial<AjaxContract> as AjaxContract);
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
    asMockedFn(Ajax).mockReturnValue({
      Metrics: { captureEvent: jest.fn() } as Partial<AjaxContract['Metrics']>,
    } as DeepPartial<AjaxContract> as AjaxContract);
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
    asMockedFn(Ajax).mockReturnValue({
      Metrics: { captureEvent } as Partial<AjaxContract['Metrics']>,
      Workspaces: {
        workspace: jest.fn().mockReturnValue({
          shallowMergeNewAttributes: mockShallowMergeNewAttributes,
        }),
      },
    } as DeepPartial<AjaxContract> as AjaxContract);
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
