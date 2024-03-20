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
  return h(ConceptSelector, {
    // create a root for all domainOptions
    parents: [{ parentId: 0, children: [_.map(_.get('root'), snapshotBuilderSettings?.domainOptions)] }],
    initialCart: [],
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
