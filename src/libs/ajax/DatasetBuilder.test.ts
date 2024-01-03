import { SnapshotBuilderConcept, SnapshotBuilderDomainOption } from 'src/libs/ajax/DataRepo';
import {
  AnyCriteria,
  AnyCriteriaApi,
  Cohort,
  CohortApi,
  ConceptSet,
  convertCohort,
  convertCriteria,
  convertDatasetAccessRequest,
  convertValueSet,
  CriteriaGroup,
  CriteriaGroupApi,
  DatasetAccessRequest,
  DatasetAccessRequestApi,
  DomainCriteria,
  DomainCriteriaApi,
  ProgramDataListCriteria,
  ProgramDataListCriteriaApi,
  ProgramDataListOption,
  ProgramDataListValue,
  ProgramDataRangeCriteria,
  ProgramDataRangeCriteriaApi,
  ProgramDataRangeOption,
  ValueSet,
  ValueSetApi,
} from 'src/libs/ajax/DatasetBuilder';

const concept: SnapshotBuilderConcept = {
  id: 0,
  name: 'concept',
  count: 10,
  hasChildren: false,
};

const domainOption: SnapshotBuilderDomainOption = {
  id: 1,
  category: 'category',
  conceptCount: 10,
  participantCount: 20,
  root: concept,
};

const domainCriteria: DomainCriteria = {
  kind: 'domain',
  name: 'domainCriteria',
  domainOption,
  id: 2,
  index: 0,
  count: 100,
};

const domainCriteriaApi: DomainCriteriaApi = {
  kind: 'domain',
  name: 'domainCriteria',
  id: 2,
};

const rangeOption: ProgramDataRangeOption = {
  kind: 'range',
  min: 0,
  max: 101,
  name: 'rangeOption',
};

const rangeCriteria: ProgramDataRangeCriteria = {
  kind: 'range',
  name: 'rangeCriteria',
  rangeOption,
  index: 4,
  count: 100,
  low: 1,
  high: 99,
};

const rangeCriteriaApi: ProgramDataRangeCriteriaApi = {
  kind: 'range',
  name: 'rangeCriteria',
  low: 1,
  high: 99,
};

const optionValues: ProgramDataListValue[] = [{ id: 5, name: 'listOptionListValue' }];

const listOption: ProgramDataListOption = {
  kind: 'list',
  name: 'listOption',
  values: optionValues,
};

const criteriaListValues: ProgramDataListValue[] = [
  { id: 7, name: 'criteriaListValue1' },
  { id: 8, name: 'criteriaListValue2' },
];

const criteriaListValuesApi: number[] = [7, 8];

const listCriteria: ProgramDataListCriteria = {
  kind: 'list',
  name: 'listCriteria',
  index: 9,
  listOption,
  values: criteriaListValues,
};

const listCriteriaApi: ProgramDataListCriteriaApi = {
  kind: 'list',
  name: 'listCriteria',
  values: criteriaListValuesApi,
};

const anyCriteriaArray: AnyCriteria[] = [domainCriteria, rangeCriteria, listCriteria];

const anyCriteriaArrayApi: AnyCriteriaApi[] = [domainCriteriaApi, rangeCriteriaApi, listCriteriaApi];

const criteriaGroup: CriteriaGroup = {
  name: 'criteriaGroup',
  criteria: anyCriteriaArray,
  mustMeet: true,
  meetAll: false,
  count: 50,
};

const criteriaGroupApi: CriteriaGroupApi = {
  name: 'criteriaGroup',
  criteria: anyCriteriaArrayApi,
  mustMeet: true,
  meetAll: false,
};

const cohort: Cohort = { name: 'cohort', criteriaGroups: [criteriaGroup] };

const cohortApi: CohortApi = { name: 'cohort', criteriaGroups: [criteriaGroupApi] };

const valueSet: ValueSet = { domain: 'valueDomain', values: [{ name: 'valueName' }] };

const valueSetApi: ValueSetApi = { name: 'valueDomain', values: ['valueName'] };

const conceptSet: ConceptSet = { name: 'conceptSetName', featureValueGroupName: 'featureValueGroupName' };

const datasetAccessRequest: DatasetAccessRequest = {
  name: 'RequestName',
  researchPurposeStatement: 'purpose',
  datasetRequest: { cohorts: [cohort], conceptSets: [conceptSet], valueSets: [valueSet] },
};

const datasetAccessRequestApi: DatasetAccessRequestApi = {
  name: 'RequestName',
  researchPurposeStatement: 'purpose',
  datasetRequest: { cohorts: [cohortApi], conceptSets: [conceptSet], valueSets: [valueSetApi] },
};

describe('test conversion of criteria', () => {
  test('domainCriteria converted to domainCriteriaApi', () => {
    expect(convertCriteria(domainCriteria)).toStrictEqual(domainCriteriaApi);
  });
  test('rangeCriteria converted to rangeCriteriaApi', () => {
    expect(convertCriteria(rangeCriteria)).toStrictEqual(rangeCriteriaApi);
  });
  test('listCriteria converted to listCriteriaApi', () => {
    expect(convertCriteria(listCriteria)).toStrictEqual(listCriteriaApi);
  });
});

describe('test conversion of a cohort', () => {
  test('cohort converted to cohortApi', () => {
    expect(convertCohort(cohort)).toStrictEqual(cohortApi);
  });
});

describe('test conversion of valueSets', () => {
  test('valueSet converted to valueSetApi', () => {
    expect(convertValueSet(valueSet)).toStrictEqual(valueSetApi);
  });
});

describe('test conversion of DatasetAccessRequest', () => {
  test('datasetAccessRequest converted to datasetAccessRequestApi', () => {
    expect(convertDatasetAccessRequest(datasetAccessRequest)).toStrictEqual(datasetAccessRequestApi);
  });
});
