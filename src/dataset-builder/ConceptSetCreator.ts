import _ from 'lodash/fp';
import { h } from 'react-hyperscript-helpers';
import { ConceptSet } from 'src/dataset-builder/DatasetBuilderUtils';
import { DatasetModel, SnapshotBuilderConcept as Concept } from 'src/libs/ajax/DataRepo';

import { ConceptSelector } from './ConceptSelector';
import { homepageState, Updater } from './dataset-builder-types';
import { OnStateChangeHandler } from './DatasetBuilder';

export type ConceptSetCreatorProps = {
  readonly onStateChange: OnStateChangeHandler;
  readonly dataset: DatasetModel;
  readonly conceptSetUpdater: Updater<ConceptSet[]>;
  readonly cart: Concept[];
};

// featureValueGroupName represents a domain name
// this works because the only concepts passed in are also domains
// such as Condition
export const toConceptSet = (concept: Concept): ConceptSet => {
  return {
    name: concept.name,
    concept,
    featureValueGroupName: concept.name,
  };
};

export const toConcept = (conceptSet: ConceptSet): Concept => {
  return conceptSet.concept;
};

export const ConceptSetCreator = (props: ConceptSetCreatorProps) => {
  const { onStateChange, dataset, conceptSetUpdater, cart } = props;
  const { snapshotBuilderSettings, id } = dataset;
  // create a root for all domainOptions
  const domainOptionRoot: Concept = {
    id: 0,
    name: 'Point to Domain Options',
    count: 100,
    hasChildren: true,
    children: _.map(_.get('root'), snapshotBuilderSettings?.domainOptions),
  };
  return h(ConceptSelector, {
    // Concept selection currently only supports top level domains, so nodes should not be expandable
    rootConcept: {
      ...domainOptionRoot,
      children: _.map((child) => ({ ...child, hasChildren: false }), domainOptionRoot.children),
    },
    initialCart: cart,
    title: 'Add concept',
    onCancel: () => onStateChange(homepageState.new()),
    onCommit: (selected: Concept[]) => {
      // commit ignores the current concept set selection and overwrites it with the cart
      conceptSetUpdater(() => _.map(toConceptSet, selected));
      onStateChange(homepageState.new());
    },
    actionText: 'Add to concept sets',
    datasetId: id,
  });
};
