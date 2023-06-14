import _ from 'lodash/fp';
import { ReactNode, useState } from 'react';
import { div, h } from 'react-hyperscript-helpers';
import { Grid } from 'react-virtualized';
import { Link } from 'src/components/common/Link';
import { icon } from 'src/components/icons';
import { DEFAULT, switchCase } from 'src/libs/utils';

export type Column = {
  name: string;
  width: number;
};

export type RowContents = {
  isLeaf: boolean;
};

export type Row<T extends RowContents> = {
  contents: T;
  depth: number;
  isVisible: boolean;
  isExpanded: boolean;
};

const wrapContent =
  (depth: number) =>
  <T extends RowContents>(contents: T): Row<T> => ({
    contents,
    depth,
    isVisible: true,
    isExpanded: false,
  });

export type TreeGridProps<T extends RowContents> = {
  columns: Column[];
  initialRows: T[];
  renderColumn: ((row: T) => string | ReactNode)[];
  getChildren: (row: T) => Promise<T[]>;
};

// TODO
//  - column headers
//  - config row height, no content message

export const TreeGrid = <T extends RowContents>(props: TreeGridProps<T>) => {
  const { columns, initialRows, getChildren, renderColumn } = props;
  const [data, setData] = useState(_.map(wrapContent(0), initialRows));
  const rowHeight = 20;
  const expand = async (row: Row<T>) => {
    const children = await getChildren(row.contents);
    const index = _.findIndex(_.isEqual(row), data);
    const newData = _.set(`[${index}].isExpanded`, true, _.cloneDeep(data));
    newData.splice(index + 1, 0, ..._.map(wrapContent(row.depth + 1), children));
    setData(newData);
  };
  const collapse = async (row: Row<T>) => {
    const index = _.findIndex(_.isEqual(row), data);
    const before = _.slice(0, index, data);
    const after = _.flow(
      _.slice(index + 1, data.length),
      _.dropWhile((dataRow: Row<T>) => dataRow.depth > row.depth)
    )(data);
    setData([...before, { ...row, isExpanded: false }, ...after]);
  };

  return h(Grid, {
    rowHeight,
    height: rowHeight * data.length,
    rowCount: data.length,
    columnCount: columns.length,
    columnWidth: (index) => columns[index.index].width,
    width: _.sum(_.map((c) => c.width, columns)),
    noContentMessage: 'No matching data',
    cellRenderer: ({ rowIndex, columnIndex, style }) =>
      div({ style }, [
        switchCase(
          columnIndex,
          [
            0,
            () =>
              div({ style: { paddingLeft: `${data[rowIndex].depth}rem`, display: 'flex', alignItems: 'center' } }, [
                !data[rowIndex].contents.isLeaf &&
                  (data[rowIndex].isExpanded
                    ? h(Link, { onClick: () => collapse(data[rowIndex]) }, [icon('minus-circle', { size: 16 })])
                    : h(Link, { onClick: () => expand(data[rowIndex]) }, [icon('plus-circle', { size: 16 })])),
                div({ style: { marginLeft: data[rowIndex].contents.isLeaf ? 20 : 4 } }, [
                  renderColumn[columnIndex](data[rowIndex].contents),
                ]),
              ]),
          ],
          [DEFAULT, () => renderColumn[columnIndex](data[rowIndex].contents)]
        ),
      ]),
    border: false,
  });
};
