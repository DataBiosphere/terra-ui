import { asMockedFn, partial } from '@terra-ui-packages/test-utils';
import { act, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { h } from 'react-hyperscript-helpers';
import { WorkspaceContract, Workspaces, WorkspacesAjaxContract } from 'src/libs/ajax/workspaces/Workspaces';
import DataStepContent from 'src/pages/workspaces/workspace/workflows/DataStepContent';
import { chooseRootType } from 'src/pages/workspaces/workspace/workflows/EntitySelectionType';
import { renderWithAppContexts as render } from 'src/testing/test-utils';

jest.mock('src/libs/ajax/workspaces/Workspaces');

// Space for tables is rendered based on the available space. In unit tests, there is no available space,
// and so we must mock out the space needed to get the data table to render so that the 'select all' button is present.
jest.mock('react-virtualized', () => {
  const actual = jest.requireActual('react-virtualized');

  const { AutoSizer } = actual;

  class MockAutoSizer extends AutoSizer {
    state = {
      height: 1000,
      width: 1000,
    };

    setState = () => {};
  }

  return {
    ...actual,
    AutoSizer: MockAutoSizer,
  };
});

describe('DataStepContent', () => {
  const mockDefaultAjax = () => {
    asMockedFn(Workspaces).mockReturnValue(
      partial<WorkspacesAjaxContract>({
        workspace: () =>
          partial<WorkspaceContract>({
            paginatedEntitiesOfType: jest.fn().mockResolvedValue({
              parameters: {
                fields: {},
                filterOperator: 'and',
                page: 1,
                pageSize: 100,
                sortDirection: 'asc',
                sortField: 'name',
              },
              resultMetadata: {
                filteredCount: 3,
                filteredPageCount: 1,
                unfilteredCount: 3,
              },
              results: [
                {
                  attributes: {
                    string: 'abc',
                    num: 1,
                  },
                  entityType: 'sample',
                  name: 'your-sample-1-id',
                },
                {
                  attributes: {
                    string: 'foo',
                    num: 2,
                  },
                  entityType: 'sample',
                  name: 'your-sample-2-id',
                },
              ],
            }),
          }),
      })
    );
  };

  it('does not require creating set', async () => {
    // Arrange

    mockDefaultAjax();
    const user = userEvent.setup();
    const onSuccess = jest.fn();

    const namespace = 'test-namespace';
    const name = 'test-workspace';
    const googleProject = 'google-project-id';
    const entityMetadata = {
      sample: {
        attributeNames: ['string', 'num'],
        count: 2,
        idName: 'sample',
      },
    };
    const attributes = { 'workspace-column-defaults': '' };
    const workspace = { workspace: { namespace, name, googleProject, attributes } };
    const entitySelectionModel = {
      type: chooseRootType,
      newSetName: 'sampleSet',
    };

    // Act
    await act(async () => {
      render(
        h(DataStepContent, {
          entitySelectionModel,
          onDismiss: jest.fn(),
          onSuccess,
          entityMetadata,
          rootEntityType: 'sample',
          workspace,
        })
      );
    });

    // Assert
    const checkbox = screen.getByRole('checkbox', { name: 'Create a new set for selected samples' });
    expect(checkbox).not.toBeChecked();
    expect(
      screen.queryByText('Selected samples will be saved as a new sample_set named:', { exact: false })
    ).not.toBeInTheDocument();
    const selectAll = screen.getByRole('checkbox', { name: 'Select all' });
    await user.click(selectAll);
    const okButton = screen.getByRole('button', { name: 'OK' });
    await user.click(okButton);
    // The important thing here is that `willCreateSet` is false
    const expectedEntitySelectionModel = {
      type: chooseRootType,
      newSetName: 'sampleSet',
      willCreateSet: false,
      selectedEntities: {
        'your-sample-1-id': {
          attributes: {
            string: 'abc',
            num: 1,
          },
          entityType: 'sample',
          name: 'your-sample-1-id',
        },
        'your-sample-2-id': {
          attributes: {
            string: 'foo',
            num: 2,
          },
          entityType: 'sample',
          name: 'your-sample-2-id',
        },
      },
    };

    expect(onSuccess).toHaveBeenCalledWith(expectedEntitySelectionModel);
  });

  it('creates a set when selected', async () => {
    // Arrange

    mockDefaultAjax();
    const user = userEvent.setup();
    const onSuccess = jest.fn();

    const namespace = 'test-namespace';
    const name = 'test-workspace';
    const googleProject = 'google-project-id';
    const entityMetadata = {
      sample: {
        attributeNames: ['string', 'num'],
        count: 2,
        idName: 'sample',
      },
    };
    const attributes = { 'workspace-column-defaults': '' };
    const workspace = { workspace: { namespace, name, googleProject, attributes } };
    const entitySelectionModel = {
      type: chooseRootType,
      newSetName: 'sampleSet',
    };

    // Act
    await act(async () => {
      render(
        h(DataStepContent, {
          entitySelectionModel,
          onDismiss: jest.fn(),
          onSuccess,
          entityMetadata,
          rootEntityType: 'sample',
          workspace,
        })
      );
    });

    // Assert
    const checkbox = screen.getByRole('checkbox', { name: 'Create a new set for selected samples' });
    await user.click(checkbox);
    expect(
      screen.queryByText('Selected samples will be saved as a new sample_set named:', { exact: false })
    ).toBeInTheDocument();
    const selectAll = screen.getByRole('checkbox', { name: 'Select all' });
    await user.click(selectAll);
    const okButton = screen.getByRole('button', { name: 'OK' });
    await user.click(okButton);
    // The important thing here is that `willCreateSet` is true
    const expectedEntitySelectionModel = {
      type: chooseRootType,
      newSetName: 'sampleSet',
      willCreateSet: true,
      selectedEntities: {
        'your-sample-1-id': {
          attributes: {
            string: 'abc',
            num: 1,
          },
          entityType: 'sample',
          name: 'your-sample-1-id',
        },
        'your-sample-2-id': {
          attributes: {
            string: 'foo',
            num: 2,
          },
          entityType: 'sample',
          name: 'your-sample-2-id',
        },
      },
    };

    expect(onSuccess).toHaveBeenCalledWith(expectedEntitySelectionModel);
  });
});
