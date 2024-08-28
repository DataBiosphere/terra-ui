import { DeepPartial, delay } from '@terra-ui-packages/core-utils';
import { act, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { h } from 'react-hyperscript-helpers';
import { Ajax } from 'src/libs/ajax';
import Events from 'src/libs/events';
import { updateSearch } from 'src/libs/nav';
import { asMockedFn, renderWithAppContexts as render } from 'src/testing/test-utils';
import { defaultGoogleWorkspace } from 'src/testing/workspace-fixtures';
import { WorkspaceFilters } from 'src/workspaces/list/WorkspaceFilters';

type NavExports = typeof import('src/libs/nav');
jest.mock(
  'src/libs/nav',
  (): NavExports => ({
    ...jest.requireActual<NavExports>('src/libs/nav'),
    getLink: jest.fn(() => '/'),
    goToPath: jest.fn(),
    useRoute: jest.fn().mockReturnValue({ query: {} }),
    updateSearch: jest.fn(),
  })
);

type AjaxContract = ReturnType<typeof Ajax>;

jest.mock('src/libs/ajax');

describe('WorkspaceFilters', () => {
  it.each([
    {
      label: 'Filter by tags',
      item: 'tag2 (2)',
      eventData: { filter: 'tags', option: ['tag2'] },
      filterParam: { tagsFilter: ['tag2'] },
    },
    {
      label: 'Filter by access levels',
      item: 'Owner',
      eventData: { filter: 'access', option: ['OWNER'] },
      filterParam: { accessLevelsFilter: ['OWNER'] },
    },
    {
      label: 'Filter by billing project',
      item: defaultGoogleWorkspace.workspace.namespace,
      eventData: { filter: 'billingProject', option: defaultGoogleWorkspace.workspace.namespace },
      filterParam: { projectsFilter: defaultGoogleWorkspace.workspace.namespace },
    },
    {
      label: 'Filter by cloud platform',
      item: 'Microsoft Azure',
      eventData: { filter: 'cloudPlatform', option: 'AZURE' },
      filterParam: { cloudPlatform: 'AZURE' },
    },
  ] as { label: string; item: string; eventData: object; filterParam: object }[])(
    'can update the filter for "$label" and emit an event',
    async ({ label, item, eventData, filterParam }) => {
      const user = userEvent.setup();
      const captureEvent = jest.fn();
      asMockedFn(Ajax).mockImplementation(
        () =>
          ({
            Workspaces: {
              getTags: jest.fn().mockResolvedValue([
                { tag: 'tag1', count: 1 },
                { tag: 'tag2', count: 2 },
              ]),
            } as DeepPartial<AjaxContract['Workspaces']>,
            Metrics: { captureEvent } as Partial<AjaxContract['Metrics']>,
          } as Partial<AjaxContract> as AjaxContract)
      );
      asMockedFn(updateSearch);

      // Act
      await act(async () => {
        render(h(WorkspaceFilters, { workspaces: [defaultGoogleWorkspace] }));
      });
      if (label.indexOf('tags') !== -1) {
        await act(() => delay(300)); // debounced loading of initial tags
      }
      const filterSelector = screen.getByLabelText(label);
      await user.click(filterSelector);

      const filterItem = screen.getByText(item);
      await user.click(filterItem);

      // Assert
      expect(captureEvent).toHaveBeenCalledWith(Events.workspaceListFilter, eventData);
      expect(updateSearch).toHaveBeenCalledWith(filterParam);
    }
  );

  it('can emit an event when focus leaves the search by keyword input', async () => {
    const user = userEvent.setup();
    const captureEvent = jest.fn();
    asMockedFn(Ajax).mockImplementation(
      () =>
        ({
          Workspaces: {
            getTags: jest.fn().mockResolvedValue([]),
          } as DeepPartial<AjaxContract['Workspaces']>,
          Metrics: { captureEvent } as Partial<AjaxContract['Metrics']>,
        } as Partial<AjaxContract> as AjaxContract)
    );
    asMockedFn(updateSearch);

    // Act
    await act(async () => {
      render(h(WorkspaceFilters, { workspaces: [defaultGoogleWorkspace] }));
    });

    const filterSelector = screen.getByLabelText('Search workspaces by name, project, or bucket');
    await filterSelector.click();
    await user.type(filterSelector, 'x');
    await act(() => delay(300)); // debounced search

    // Move focus to another element because we emit the event on blur.
    const otherSelector = screen.getByLabelText('Filter by billing project');
    await user.click(otherSelector);

    // Assert
    expect(captureEvent).toHaveBeenCalledWith(Events.workspaceListFilter, { filter: 'keyword', option: 'x' });
    expect(updateSearch).toHaveBeenCalledWith({ filter: 'x' });
  });
});
