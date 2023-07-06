import _ from 'lodash/fp';
import { ReactNode, useState } from 'react';
import { div, h, strong } from 'react-hyperscript-helpers';
import { Grid } from 'react-virtualized';
import { Link } from 'src/components/common/Link';
import { icon } from 'src/components/icons';
import colors from 'src/libs/colors';
import { DEFAULT, switchCase } from 'src/libs/utils';

export type RowContents = {
  id: number;
  isLeaf: boolean;
};

export type Column<T extends RowContents> = {
  name: string;
  width: number;
  render: (row: T) => string | ReactNode;
};

type RowState = 'closed' | 'opening' | 'open';

type Row<T extends RowContents> = {
  contents: T;
  depth: number;
  isVisible: boolean;
  state: RowState;
};

const wrapContent =
  (depth: number, isVisible: boolean) =>
  <T extends RowContents>(contents: T): Row<T> => ({
    contents,
    depth,
    isVisible,
    state: 'closed',
  });

export type TreeGridProps<T extends RowContents> = {
  columns: Column<T>[];
  initialRows: T[];
  getChildren: (row: T) => Promise<T[]>;
};

// TODO
//  - props arguments for row height, no content message
//  - collapse by hiding, not by deleting and preserve expansion state
//  - UX, styling
//  - auto-size based on content (?)
export const TreeGrid = <T extends RowContents>(props: TreeGridProps<T>) => {
  const { columns, initialRows, getChildren } = props;
  const [data, setData] = useState(_.map(wrapContent(0, true), initialRows));
  const rowHeight = 48;
  const expand = async (row: Row<T>) => {
    // Mark as loading.
    setData((currentData) => {
      const index = _.findIndex((r) => r.contents.id === row.contents.id, data);
      return _.flow(_.cloneDeep, _.set(`[${index}].state`, 'opening'))(currentData);
    });

    // Fetch children.
    const children = await getChildren(row.contents);

    // Mark as loaded and insert children.
    setData((currentData) => {
      const index = _.findIndex((r) => r.contents.id === row.contents.id, data);
      // Node was deleted while loading.
      if (index === -1) {
        return currentData;
      }
      const currentRow = currentData[index];
      const newData = _.flow(_.cloneDeep, _.set(`[${index}].state`, 'open'))(currentData);
      newData.splice(index + 1, 0, ..._.map(wrapContent(currentRow.depth + 1, currentRow.isVisible), children));
      return newData;
    });
  };
  const collapse = async (row: Row<T>) => {
    const index = _.findIndex(_.isEqual(row), data);
    const before = _.slice(0, index, data);
    const after = _.flow(
      _.slice(index + 1, data.length),
      _.dropWhile((dataRow: Row<T>) => dataRow.depth > row.depth)
    )(data);
    setData([...before, { ...row, state: 'closed' }, ...after]);
  };

  return h(Grid, {
    rowHeight,
    height: rowHeight * data.length,
    rowCount: data.length,
    columnCount: columns.length,
    columnWidth: (index) => columns[index.index].width,
    width: _.sum(_.map((c) => c.width, columns)),
    noContentMessage: 'No matching data',
    cellRenderer: ({ rowIndex, columnIndex, style }) => {
      const row = data[rowIndex];
      const [handler, iconName] = (() => {
        switch (row.state) {
          case 'closed':
            return [expand, 'angle-up'];
          case 'opening':
            return [_.noop, 'loadingSpinner'];
          case 'open':
          default:
            return [collapse, 'angle-down'];
        }
      })();
      return div(
        { style: { ...style, borderTop: `1px solid ${colors.dark(0.3)}`, paddingTop: 5, alignItems: 'center' } },
        [
          switchCase(
            columnIndex,
            [
              0,
              () =>
                div({ style: { paddingLeft: `${row.depth}rem`, display: 'flex' } }, [
                  !data[rowIndex].contents.isLeaf &&
                    h(Link, { onClick: () => handler(row) }, [icon(iconName, { size: 16 })]),
                  div({ style: { display: 'flex', marginLeft: row.contents.isLeaf ? 20 : 4 } }, [
                    columns[columnIndex].render(row.contents),
                  ]),
                ]),
            ],
            [DEFAULT, () => columns[columnIndex].render(row.contents)]
          ),
        ]
      );
    },
    border: false,
  });
};

export const TreeGridView = <T extends RowContents>(props: TreeGridProps<T>) => {
  // generate a header row
  return div([
    div({ style: { height: '100%', display: 'flex', paddingTop: 20, paddingBottom: 20 } }, [
      _.map((c) => div({ style: { width: c.width, marginTop: 5 } }, [strong([c.name])]), props.columns),
    ]),
    h(TreeGrid<T>, props),
  ]);
};
