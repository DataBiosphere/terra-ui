import _ from 'lodash/fp';
import { h } from 'react-hyperscript-helpers';
import { DatasetModel, SnapshotBuilderConcept as Concept } from 'src/libs/ajax/DataRepo';
import { ConceptSet } from 'src/libs/util/DatasetBuilder';

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
  return h(ConceptSelector, {
    initialRows: _.map(_.get('root'), snapshotBuilderSettings?.domainOptions),
    title: 'Add concept',
    onCancel: () => onStateChange(homepageState.new()),
    onCommit: (selected: Concept[]) => {
      conceptSetUpdater((conceptSets) => _.flow(_.map(toConceptSet), _.union(conceptSets))(selected));
      onStateChange(homepageState.new());
    },
    actionText: 'Add to concept sets',
    datasetId: id,
  });
};
