import _ from 'lodash/fp';
import { h } from 'react-hyperscript-helpers';
import { Concept, DatasetResponse } from 'src/libs/ajax/DatasetBuilder';
import { ConceptSelector } from 'src/pages/library/datasetBuilder/ConceptSelector';
import { ConceptSet, homepageState } from 'src/pages/library/datasetBuilder/dataset-builder-types';
import { OnStateChangeHandler } from 'src/pages/library/datasetBuilder/DatasetBuilder';
import { datasetBuilderConceptSets } from 'src/pages/library/datasetBuilder/state';

export type ConceptSetCreatorProps = {
  readonly onStateChange: OnStateChangeHandler;
  readonly datasetDetails: DatasetResponse;
};

const toConceptSet = (concept: Concept): ConceptSet => {
  return {
    name: concept.name,
    featureValueGroupName: concept.name,
  };
};

export const ConceptSetCreator = (props: ConceptSetCreatorProps) => {
  const { onStateChange, datasetDetails } = props;
  return h(ConceptSelector, {
    initialRows: _.map(_.get('root'), datasetDetails.domainOptions),
    title: 'Add concept',
    onCancel: () => onStateChange(homepageState.new()),
    onCommit: (selected: Concept[]) => {
      _.flow(_.map(toConceptSet), _.union(datasetBuilderConceptSets.get()), datasetBuilderConceptSets.set)(selected);
      onStateChange(homepageState.new());
    },
    actionText: 'Add to concept sets',
  });
};
