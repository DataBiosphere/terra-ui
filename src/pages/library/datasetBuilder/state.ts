import * as Utils from 'src/libs/utils';
import { Atom } from 'src/libs/utils';
import { Cohort, ConceptSet } from 'src/pages/library/datasetBuilder/dataset-builder-types';

export const datasetBuilderCohorts: Atom<Cohort[]> = Utils.atom([
  {
    name: 'My Cohort',
    criteriaGroups: [],
  },
] as Cohort[]);

export const datasetBuilderConceptSets: Atom<ConceptSet[]> = Utils.atom([] as ConceptSet[]);
