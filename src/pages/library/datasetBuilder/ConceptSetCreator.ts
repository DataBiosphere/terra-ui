import _ from 'lodash/fp';
import { div, h } from 'react-hyperscript-helpers';
import { Grid } from 'react-virtualized';
import { Concept, DatasetBuilder, generateDummyConcept } from 'src/libs/ajax/DatasetBuilder';
import { switchCase } from 'src/libs/utils';

type Column = {
  name: string;
  width: number;
};

type UIConcept = {
  concept: Concept;
  depth: number;
  isVisible: boolean;
  isExpanded: boolean;
};

const convertConceptToUIConceptCurry =
  (depth: number) =>
  (concept: Concept): UIConcept => ({
    concept,
    depth,
    isVisible: true,
    isExpanded: false,
  });

const getConcepts = async (concept?: UIConcept): Promise<UIConcept[]> => {
  const result = await DatasetBuilder().getConcepts(concept?.concept);
  return _.map(convertConceptToUIConceptCurry(concept ? concept.depth + 1 : 0), result.result);
};

export const ConceptSetCreator = (props) => {
  const data: UIConcept[] = _.map(convertConceptToUIConceptCurry(0), _.times(generateDummyConcept, 3));
  const columns: Column[] = [
    { name: 'data', width: 300 },
    { name: 'property', width: 50 },
  ];
  const rowHeight = 20;
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
        switchCase(columnIndex, [0, () => data[rowIndex].concept.name], [1, () => data[rowIndex].concept.count]),
      ]),
    border: false,
  });
};
