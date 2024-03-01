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
};

export const toConceptSet = (concept: Concept): ConceptSet => {
  return {
    name: concept.name,
    featureValueGroupName: concept.name,
  };
};

export const ConceptSetCreator = (props: ConceptSetCreatorProps) => {
  const { onStateChange, dataset, conceptSetUpdater } = props;
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
    rootConcept: domainOptionRoot,
    initialCart: [],
    title: 'Add tables',
    onCancel: () => onStateChange(homepageState.new()),
    onCommit: (selected: Concept[]) => {
      conceptSetUpdater((conceptSets) => _.flow(_.map(toConceptSet), _.union(conceptSets))(selected));
      onStateChange(homepageState.new());
    },
    actionText: 'Add to tables',
    datasetId: id,
  });
};
