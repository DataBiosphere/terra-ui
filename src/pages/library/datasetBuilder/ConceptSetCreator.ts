import _ from 'lodash/fp';
import { Fragment, useState } from 'react';
import { div, h } from 'react-hyperscript-helpers';
import { Link } from 'src/components/common';
import { icon } from 'src/components/icons';
import { TreeGridView } from 'src/components/TreeGrid';
import { Concept, DatasetBuilder, DatasetResponse, getConceptForId } from 'src/libs/ajax/DatasetBuilder';
import { OnStateChangeHandler } from 'src/pages/library/datasetBuilder/DatasetBuilder';

const getChildren = async (concept: Concept): Promise<Concept[]> => {
  const result = await DatasetBuilder().getConcepts(concept);
  return result.result;
};

export type ConceptSetCreatorProps = {
  onStateChange: OnStateChangeHandler;
  datasetDetails: DatasetResponse;
};

export const ConceptSetCreator: React.FC<ConceptSetCreatorProps> = (props) => {
  const { datasetDetails } = props;
  const [cart, setCart] = useState<number[]>([]);
  return div([
    h(TreeGridView<Concept>, {
      columns: [
        {
          name: 'Concept Name',
          width: 710,
          render: (concept) =>
            h(Fragment, [
              h(Link, { onClick: () => setCart(_.xor(cart, [concept.id])) }, [
                icon(_.contains(concept.id, cart) ? 'minus-circle-red' : 'plus-circle-filled', { size: 16 }),
              ]),
              div({ style: { marginLeft: 5 } }, [concept.name]),
            ]),
        },
        { name: 'Concept ID', width: 195, render: _.get('id') },
        { name: 'Roll-up count', width: 205, render: _.get('count') },
      ],
      initialRows: _.map(_.flow((option) => option.root, getConceptForId))(datasetDetails.domainOptions),
      getChildren,
    }),
    div({ style: { display: 'float' } }, [
      cart.length === 1 ? '1 concept selected' : `${cart.length} concepts selected`,
    ]),
  ]);
};
