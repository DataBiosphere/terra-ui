import _ from 'lodash/fp';
import { div, h } from 'react-hyperscript-helpers';
import { Grid } from 'react-virtualized';

type Column = {
  name: string;
  width: number;
};

type Concept = {
  id: number;
  name: string;
  count: number;
  depth: number;
  isLeaf: boolean;
  isVisible: boolean;
  isExpanded: boolean;
};

const createConcept = (id: number, name: string, count: number, depth: number, isLeaf: boolean): Concept => {
  return {
    id,
    name,
    count,
    isLeaf,
    depth,
    isVisible: true,
    isExpanded: false,
  };
};

const getSubConcepts = (concept: Concept): Concept[] => {
  // Add sub concepts after concept
  const subConcepts: Concept[] = [];
};

export const ConceptSetCreator = (props) => {
  const data: Concept[] = [
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
