import { DeepPartial } from '@terra-ui-packages/core-utils';
import { act, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { h } from 'react-hyperscript-helpers';
import {
  DataTableFeatures,
  DataTableProvider,
  Entity,
  EntityQueryResponse,
} from 'src/libs/ajax/data-table-providers/DataTableProvider';
import { RecordTypeSchema } from 'src/libs/ajax/data-table-providers/WdsDataTableProvider';
import { renderWithAppContexts as render } from 'src/testing/test-utils';
import { defaultAzureWorkspace } from 'src/testing/workspace-fixtures';

import WDSContent, { WDSContentProps } from './WDSContent';

jest.mock('src/libs/error', () => ({
  ...jest.requireActual('src/libs/error'),
  reportError: jest.fn(),
}));

jest.mock('src/libs/notifications', () => ({
  notify: jest.fn(),
}));

// // DataTable uses react-virtualized's AutoSizer to size the table.
// This makes the virtualized window large enough for all rows/columns to be rendered in tests.
jest.mock('react-virtualized', () => ({
  ...jest.requireActual('react-virtualized'),
  AutoSizer: ({ children }) => children({ width: 1000, height: 1000 }),
}));

interface SetupOptions {
  props: WDSContentProps;
  features: DataTableFeatures;
  entities: Entity[];
}

const marbleSchema: RecordTypeSchema = {
  name: 'marble',
  count: 1,
  attributes: [
    { name: 'id', datatype: 'NUMBER' },
    { name: 'color', datatype: 'STRING' },
    { name: 'favorite', datatype: 'BOOLEAN' },
  ],
  primaryKey: 'id',
};
const defaultProps: WDSContentProps = {
  workspace: {
    ...defaultAzureWorkspace,
    workspace: {
      ...defaultAzureWorkspace.workspace,
      // attributes are required to avoid an error while destructuring from 'workspace-column-defaults'
      attributes: {},
    },
    workspaceSubmissionStats: {
      runningSubmissionsCount: 0,
    },
  },
  recordType: marbleSchema.name,
  wdsSchema: [marbleSchema],
  editable: true,
  dataProvider: {} as DataTableProvider,
  loadMetadata: () => {},
};
const defaultFeatures: DataTableFeatures = {
  supportsCapabilities: true,
  supportsTsvDownload: false,
  supportsTsvAjaxDownload: false,
  supportsTypeDeletion: false,
  supportsTypeRenaming: false,
  supportsEntityRenaming: false,
  supportsEntityUpdating: false,
  supportsEntityUpdatingTypes: [],
  supportsAttributeRenaming: false,
  supportsAttributeDeleting: false,
  supportsAttributeClearing: false,
  supportsExport: false,
  supportsPointCorrection: false,
  supportsFiltering: false,
  supportsRowSelection: true,
  supportsPerColumnDatatype: true,
};

const defaultSetupOptions: SetupOptions = {
  props: defaultProps,
  features: defaultFeatures as DataTableFeatures,
  entities: [
    {
      name: '1',
      entityType: 'marble',
      attributes: { color: 'red', favorite: true },
    },
    {
      name: '2',
      entityType: 'marble',
      attributes: { color: 'yellow', favorite: false },
    },
    {
      name: '3',
      entityType: 'marble',
      attributes: { color: 'green', favorite: false },
    },
  ],
};
describe('WDSContent', () => {
  const setup = ({ props, features, entities }: SetupOptions = defaultSetupOptions) => {
    const user = userEvent.setup();

    const getPageResponse: DeepPartial<EntityQueryResponse> = {
      results: entities,
      resultMetadata: {
        unfilteredCount: entities.length,
        filteredCount: entities.length,
        filteredPageCount: entities.length / 100 + 1,
      },
    };

    const dataProvider: DeepPartial<DataTableProvider> = {
      providerName: 'WDS',
      getPage: jest.fn().mockResolvedValue(getPageResponse),
      features,
    };

    return { user, props: { ...props, dataProvider: dataProvider as DataTableProvider } };
  };

  const getColumnMenu = (name: string) => {
    return within(screen.getByRole('columnheader', { name })).getByRole('button', { name: 'Column menu' });
  };

  describe('delete column button', () => {
    it('is displayed when editable and supportsAttributeDeleting are true', async () => {
      // Arrange
      const { user, props } = setup({
        ...defaultSetupOptions,
        props: { ...defaultProps, editable: true },
        features: { ...defaultFeatures, supportsAttributeDeleting: true },
      });

      // Act
      await act(() => {
        render(h(WDSContent, props));
      });
      await user.click(getColumnMenu('color'));

      const deleteColorColumnButton = screen.getByRole('button', { name: 'Delete Column' });
      const deleteConfirmationButton = screen.queryByTestId('confirm-delete');

      // Assert
      expect(deleteConfirmationButton).not.toBeInTheDocument();
      expect(screen.queryByText(/Are you sure you want to delete the column/)).not.toBeInTheDocument();

      // Act
      await user.click(deleteColorColumnButton);

      // Assert
      expect(screen.getByRole('dialog')).toHaveTextContent(/Are you sure you want to delete the column/);
      expect(screen.getByRole('dialog')).toContainElement(screen.getByTestId('confirm-delete'));
    });

    it('is hidden when editable is true, but supportsAttributeDeleting is false', async () => {
      // Arrange
      const { user, props } = setup({
        ...defaultSetupOptions,
        props: { ...defaultProps, editable: true },
        features: { ...defaultFeatures, supportsAttributeDeleting: false },
      });

      // Act
      await act(() => {
        render(h(WDSContent, props));
      });
      await user.click(getColumnMenu('color'));

      // Assert
      expect(screen.queryByRole('button', { name: 'Delete Column' })).not.toBeInTheDocument();
    });

    it('is hidden when editable is false, even if supportsAttributeDeleting is true', async () => {
      // Arrange
      const { user, props } = setup({
        ...defaultSetupOptions,
        props: { ...defaultProps, editable: false },
        features: { ...defaultFeatures, supportsAttributeDeleting: true },
      });

      // Act
      await act(() => {
        render(h(WDSContent, props));
      });

      await user.click(getColumnMenu('color'));

      // Assert
      expect(screen.queryByRole('button', { name: 'Delete Column' })).not.toBeInTheDocument();
    });

    it('invokes the deleteColumn function on the provided dataTableProvider when confirmed', async () => {
      // Arrange
      const { user, props } = setup({
        ...defaultSetupOptions,
        props: { ...defaultProps, editable: true },
        features: { ...defaultFeatures, supportsAttributeDeleting: true },
      });

      const deleteColumnMock = jest.fn().mockResolvedValue(undefined);
      props.dataProvider.deleteColumn = deleteColumnMock;

      // Act
      await act(() => {
        render(h(WDSContent, props));
      });
      await user.click(getColumnMenu('color'));
      await user.click(screen.getByRole('button', { name: 'Delete Column' }));
      await user.click(screen.getByTestId('confirm-delete'));

      // Assert
      expect(deleteColumnMock).toHaveBeenCalledWith(expect.any(AbortSignal), 'marble', 'color');
    });
  });

  describe('edit column', () => {
    it('edit field icon is present for types that support editing', async () => {
      // Arrange
      const { props } = setup({
        ...defaultSetupOptions,
        props: { ...defaultProps, editable: true },
        features: {
          ...defaultFeatures,
          supportsEntityUpdating: true,
          supportsEntityUpdatingTypes: ['string', 'number'],
        },
      });

      // Act
      await act(() => {
        render(h(WDSContent, props));
      });

      // Assert
      // since only string and number are supported for editing, and number is the primary key
      // only 3 column should be editable at this this
      const editableValues = await screen.findAllByText('Edit value');
      expect(editableValues.length).toEqual(3);
    });
  });

  describe('select rows', () => {
    it('', async () => {
      // Arrange
      const { props } = setup({
        ...defaultSetupOptions,
        props: { ...defaultProps, editable: true },
        features: {
          ...defaultFeatures,
        },
      });

      // Act
      await act(() => {
        render(h(WDSContent, props));
      });

      // Assert
      // there should be 4 checkboxes for 3 values: one for each value, plus one to select all rows.
      const checkboxes = await screen.findAllByRole('checkbox');
      expect(checkboxes.length).toEqual(4);
    });
  });
});
