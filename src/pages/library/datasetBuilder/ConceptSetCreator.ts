import _ from 'lodash/fp';
import { h } from 'react-hyperscript-helpers';
import { TreeGrid } from 'src/components/TreeGrid';
import { Concept, DatasetBuilder, generateDummyConcept } from 'src/libs/ajax/DatasetBuilder';

const getChildren = async (concept: Concept): Promise<Concept[]> => {
  const result = await DatasetBuilder().getConcepts(concept);
  return result.result;
};

export const ConceptSetCreator = (props) => {
  return h(TreeGrid<Concept>, {
    columns: [
      { name: 'data', width: 300 },
      { name: 'id', width: 50 },
      { name: 'count', width: 50 },
    ],
    initialRows: _.times(generateDummyConcept, 3),
    renderColumn: [(row) => row.name, (row) => row.id, (row) => row.count],
    getChildren,
  });
};
