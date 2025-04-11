import { asMockedFn, MockedFn, partial } from '@terra-ui-packages/test-utils';
import { act, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { h } from 'react-hyperscript-helpers';
import { Metrics, MetricsContract } from 'src/libs/ajax/Metrics';
import { GoogleWorkspace, GoogleWorkspaceInfo } from 'src/libs/ajax/workspaces/workspace-models';
import { WorkspaceContract, Workspaces, WorkspacesAjaxContract } from 'src/libs/ajax/workspaces/Workspaces';
import { renderWithAppContexts as render } from 'src/testing/test-utils';
import { defaultGoogleWorkspace } from 'src/testing/workspace-fixtures';

import {
  columnSettingsSynchronizer,
  ColumnSettingsWithSavedColumnSettings,
  filterColumnSettings,
  handleSearch,
  updateColumnSettings,
} from './SavedColumnSettings';

const onChange = jest.fn();

jest.mock('src/libs/ajax/Metrics');
jest.mock('src/libs/ajax/workspaces/Workspaces');

// ColumnSettingsList uses react-virtualized's AutoSizer to size the table.
// This makes the virtualized window large enough for all rows to be rendered in tests
jest.mock('react-virtualized', () => ({
  ...jest.requireActual('react-virtualized'),
  AutoSizer: ({ children }) => children({ width: 200, height: 200 }),
}));

describe('ColumnSettingsWithSavedColumnSettings', () => {
  beforeEach(() => {
    jest.restoreAllMocks();

    const workspaceDetails: MockedFn<WorkspaceContract['details']> = jest.fn();
    workspaceDetails.mockResolvedValue(
      partial<GoogleWorkspace>({
        workspace: partial<GoogleWorkspaceInfo>({
          attributes: {
            'system:columnSettings': {
              tables: { sample: { saved: ['Column A', true, 'Column B', false, 'Column C', true] } },
            },
          },
        }),
      })
    );

    asMockedFn(Workspaces).mockReturnValue(
      partial<WorkspacesAjaxContract>({
        workspace: () => partial<WorkspaceContract>({ details: workspaceDetails }),
      })
    );
    asMockedFn(Metrics).mockReturnValue(partial<MetricsContract>({ captureEvent: jest.fn() }));
  });

  it('loads saved column settings', async () => {
    const user = userEvent.setup();
    const columnSettings = [
      { name: 'Column A', visible: true },
      { name: 'Column B', visible: true },
      { name: 'Column C', visible: true },
    ];
    const entityMetadata = {
      sample: { count: 1, idName: 'sample_id', attributeNames: ['Column A', 'Column B', 'Column C'] },
    };
    // workspace, snapshotName, entityType, entityMetadata, columnSettings, onLoad
    await act(async () => {
      render(
        h(ColumnSettingsWithSavedColumnSettings, {
          columnSettings,
          onChange,
          workspace: defaultGoogleWorkspace,
          entityType: 'sample',
          entityMetadata,
        })
      );
    });
    const columnACheckbox = screen.getByRole('checkbox', { name: 'Show "Column A" in table' });
    expect(columnACheckbox).toBeChecked();
    const columnBCheckbox = screen.getByRole('checkbox', { name: 'Show "Column B" in table' });
    expect(columnBCheckbox).toBeChecked();
    const columnCCheckbox = screen.getByRole('checkbox', { name: 'Show "Column C" in table' });
    expect(columnCCheckbox).toBeChecked();
    // Load saved column settings
    const menu = screen.getByRole('button', { name: 'Column selection menu' });
    await user.click(menu);
    const load = screen.getByRole('button', { name: 'Load' });
    await user.click(load);
    expect(columnBCheckbox).not.toBeChecked();
  });
});

describe('filterColumnSettings', () => {
  const columnSettings = [
    { name: 'Column A', visible: true },
    { name: 'Column B', visible: false },
    { name: 'Another Column', visible: true },
  ];

  it('returns all column settings when search term is empty', () => {
    const result = filterColumnSettings('', columnSettings);
    expect(result).toEqual(columnSettings);
  });

  it('filters column settings by a matching search term', () => {
    const result = filterColumnSettings('Column', columnSettings);
    expect(result).toEqual(columnSettings);
  });

  it('filters column settings by a partial match', () => {
    const result = filterColumnSettings('Another', columnSettings);
    expect(result).toEqual([{ name: 'Another Column', visible: true }]);
  });

  it('is case-insensitive when filtering', () => {
    const result = filterColumnSettings('column a', columnSettings);
    expect(result).toEqual([{ name: 'Column A', visible: true }]);
  });

  it('trims whitespace from the search term', () => {
    const result = filterColumnSettings('  Column B  ', columnSettings);
    expect(result).toEqual([{ name: 'Column B', visible: false }]);
  });

  it('returns an empty array when no matches are found', () => {
    const result = filterColumnSettings('Nonexistent', columnSettings);
    expect(result).toEqual([]);
  });
});

describe('columnSettingsSynchronizer', () => {
  it('synchronizes visibility between source and target settings', () => {
    const columnSettings = [
      { name: 'Column A', visible: true },
      { name: 'Column B', visible: false },
      { name: 'Column C', visible: true },
    ];

    const targetSettings = [
      { name: 'Column A', visible: false },
      { name: 'Column B', visible: true },
    ];

    const result = columnSettingsSynchronizer(columnSettings, targetSettings);
    expect(result).toEqual([
      { name: 'Column A', visible: false, id: 'Column A' },
      { name: 'Column B', visible: true, id: 'Column B' },
      { name: 'Column C', visible: true, id: 'Column C' },
    ]);
  });
});

describe('updateColumnSettings', () => {
  it('updates column settings using the synchronizer', () => {
    const mockUpdateItems = jest.fn();
    const columnSettingsRef = { current: { updateItems: mockUpdateItems } };

    const columnSettings = [
      { name: 'Column A', visible: true },
      { name: 'Column B', visible: false },
      { name: 'Column C', visible: true },
    ];

    const targetSettings = [
      { name: 'Column A', visible: false },
      { name: 'Column B', visible: true },
    ];

    updateColumnSettings(columnSettingsRef, columnSettings, targetSettings);

    expect(mockUpdateItems).toHaveBeenCalledWith([
      { name: 'Column A', visible: false, id: 'Column A' },
      { name: 'Column B', visible: true, id: 'Column B' },
      { name: 'Column C', visible: true, id: 'Column C' },
    ]);
  });
});

describe('handleSearch', () => {
  it('filters column settings based on the search term', () => {
    const mockUpdateItems = jest.fn();
    const columnSettingsRef = { current: { getItems: () => columnSettings, updateItems: mockUpdateItems } };

    const columnSettings = [
      { name: 'Column A', visible: true },
      { name: 'Column B', visible: false },
      { name: 'Column C', visible: true },
    ];

    const initialColumnSettings = { current: columnSettings };

    handleSearch('Column A', columnSettingsRef, initialColumnSettings);

    expect(mockUpdateItems).toHaveBeenCalledWith([{ name: 'Column A', visible: true, id: 'Column A' }]);
  });
});
