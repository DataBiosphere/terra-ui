import { Cohort, ConceptSet } from 'src/libs/ajax/DatasetBuilder';
import * as Utils from 'src/libs/utils';
import { Atom } from 'src/libs/utils';

export const datasetBuilderCohorts: Atom<Cohort[]> = Utils.atom([] as Cohort[]);

export const datasetBuilderConceptSets: Atom<ConceptSet[]> = Utils.atom([] as ConceptSet[]);
