import * as Utils from 'src/libs/utils';
import { Atom } from 'src/libs/utils';
import { Cohort, ConceptSet, ProgramDataListCriteria } from 'src/pages/library/datasetBuilder/dataset-builder-types';

export const datasetBuilderCohorts: Atom<Cohort[]> = Utils.atom([
  {
    name: 'My Cohort',
    criteriaGroups: [
      { criteria: [], mustMeet: true, meetAll: false, count: 1000 },
      {
        criteria: [{ category: 'Condition', name: 'Heart Disease', id: 100, count: 100 }],
        mustMeet: true,
        meetAll: false,
        count: 100,
      },
      {
        criteria: [
          { name: 'Ethnicity', id: 99, count: 100, value: 'white', valueId: 101 } as ProgramDataListCriteria,
          { name: 'Age', id: 99, count: 100, low: 50, high: 55 },
        ],
        mustMeet: false,
        meetAll: false,
        count: 150,
      },
    ],
  },
] as Cohort[]);

export const datasetBuilderConceptSets: Atom<ConceptSet[]> = Utils.atom([] as ConceptSet[]);
