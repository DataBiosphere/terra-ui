import _ from 'lodash/fp';
import { div, h } from 'react-hyperscript-helpers';
import { Grid } from 'react-virtualized';

type Column = {
  name: string;
  width: number;
};
export const ConceptSetCreator = (props) => {
  const data = [
    ['data1', 'prop1'],
    ['data2', 'prop2'],
    ['data3', 'prop3'],
  ];
  const columns: Column[] = [
    { name: 'data', width: 300 },
    { name: 'property', width: 50 },
  ];
  const rowHeight = 20;
  return h(Grid, {
    rowHeight,
    height: rowHeight * data.length,
    rowCount: data.length,
    columnCount: data[0].length,
    columnWidth: (index) => columns[index.index].width,
    width: _.sum(_.map((c) => c.width, columns)),
    noContentMessage: 'No matching data',
    cellRenderer: ({ rowIndex, columnIndex, style }) => div({ style }, [data[rowIndex][columnIndex]]),
    border: false,
  });
};
