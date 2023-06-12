import _ from 'lodash/fp';
import { useState } from 'react';
import { div, h } from 'react-hyperscript-helpers';
import { Grid } from 'react-virtualized';
import { Link } from 'src/components/common/Link';
import { icon } from 'src/components/icons';
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
  const [data, setData] = useState(_.map(convertConceptToUIConceptCurry(0), _.times(generateDummyConcept, 3)));
  const columns: Column[] = [
    { name: 'data', width: 300 },
    { name: 'property', width: 50 },
  ];
  const rowHeight = 20;
  const expand = async (concept: UIConcept) => {
    const children = await getConcepts(concept);
    const index = _.findIndex(_.isEqual(concept), data);
    const newData = _.set(`[${index}].isExpanded`, true, _.cloneDeep(data));
    newData.splice(index + 1, 0, ...children);
    setData(newData);
  };
  const collapse = async (concept: UIConcept) => {
    const index = _.findIndex(_.isEqual(concept), data);
    const before = _.slice(0, index, data);
    const after = _.flow(
      _.slice(index + 1, data.length),
      _.dropWhile((dataConcept: UIConcept) => dataConcept.depth > concept.depth)
    )(data);
    setData([...before, { ...concept, isExpanded: false }, ...after]);
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
                !data[rowIndex].concept.isLeaf &&
                  (data[rowIndex].isExpanded
                    ? h(Link, { onClick: () => collapse(data[rowIndex]) }, [icon('minus-circle', { size: 16 })])
                    : h(Link, { onClick: () => expand(data[rowIndex]) }, [icon('plus-circle', { size: 16 })])),
                div({ style: { marginLeft: data[rowIndex].concept.isLeaf ? 20 : 4 } }, [data[rowIndex].concept.name]),
              ]),
          ],
          [1, () => data[rowIndex].concept.count]
        ),
      ]),
    border: false,
  });
};
