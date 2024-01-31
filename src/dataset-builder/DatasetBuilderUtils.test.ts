import { span, strong } from 'react-hyperscript-helpers';
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
  HighlightConceptName,
  ProgramDataListCriteria,
  ProgramDataListCriteriaApi,
  ProgramDataListOption,
  ProgramDataListValue,
  ProgramDataRangeCriteria,
  ProgramDataRangeCriteriaApi,
  ProgramDataRangeOption,
  ValueSet,
  ValueSetApi,
} from 'src/dataset-builder/DatasetBuilderUtils';
import {
  dummyGetConceptForId,
  dummyGetNodeFromHierarchy,
  dummyGetParentInHierarchy,
  getHierarchyMap,
} from 'src/dataset-builder/TestConstants';
import {
  SnapshotBuilderConcept as Concept,
  SnapshotBuilderConcept,
  SnapshotBuilderDomainOption,
} from 'src/libs/ajax/DataRepo';

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

describe('test HighlightConceptName', () => {
  test('searching beginning of conceptName', () => {
    const searchedWord = 'Clinic';
    const conceptName = 'Clinical Finding';

    const result = span([span(['']), strong(['Clinic']), span(['al Finding'])]);

    expect(HighlightConceptName(conceptName, searchedWord)).toStrictEqual(result);
  });
});

describe('test HighlightConceptName', () => {
  test('Testing to make sure Clin is capitalized', () => {
    const searchedWord = 'clin';
    const conceptName = 'Clinical Finding';

    const result = span([span(['']), strong(['Clin']), span(['ical Finding'])]);

    expect(HighlightConceptName(conceptName, searchedWord)).toStrictEqual(result);
  });
});

describe('test HighlightConceptName', () => {
  test('searchedWord in the middle of conceptName', () => {
    const searchedWord = 'cal';
    const conceptName = 'Clinical Finding';

    const result = span([span(['Clini']), strong(['cal']), span([' Finding'])]);

    expect(HighlightConceptName(conceptName, searchedWord)).toStrictEqual(result);
  });
});

describe('test HighlightConceptName', () => {
  test('searchedWord in the end of conceptName', () => {
    const searchedWord = 'Finding';
    const conceptName = 'Clinical Finding';

    const result = span([span(['Clinical ']), strong(['Finding']), span([''])]);

    expect(HighlightConceptName(conceptName, searchedWord)).toStrictEqual(result);
  });
});

describe('test HighlightConceptName', () => {
  test('searchedWord in the not in conceptName: "XXX" in "Clinical Finding"', () => {
    const searchedWord = 'XXX';
    const conceptName = 'Clinical Finding';

    const result = span(['Clinical Finding']);

    expect(HighlightConceptName(conceptName, searchedWord)).toStrictEqual(result);
  });
});

describe('test HighlightConceptName', () => {
  test('searchedWord in the not in conceptName: "Clinical" in "Clin"', () => {
    const searchedWord = 'Clinical';
    const conceptName = 'Clin';

    const result = span(['Clin']);

    expect(HighlightConceptName(conceptName, searchedWord)).toStrictEqual(result);
  });
});

describe('test HighlightConceptName', () => {
  test('searchedWord is empty: "" ', () => {
    const searchedWord = '';
    const conceptName = 'Condition';

    const result = span(['Condition']);

    expect(HighlightConceptName(conceptName, searchedWord)).toStrictEqual(result);
  });
});

describe('test HighlightConceptName', () => {
  test('searchedWord is empty has one spaces', () => {
    const searchedWord = ' ';
    const conceptName = 'Clinical Finding';

    const result = span(['Clinical Finding']);

    expect(HighlightConceptName(conceptName, searchedWord)).toStrictEqual(result);
  });
});

describe('test HighlightConceptName', () => {
  test('searchedWord is empty has three spaces', () => {
    const searchedWord = '   ';
    const conceptName = 'Clinical Finding';

    const result = span(['Clinical Finding']);

    expect(HighlightConceptName(conceptName, searchedWord)).toStrictEqual(result);
  });
});

describe('test dummyGetNodeFromHierarchy', () => {
  test('fetching id 400', () => {
    const dummyData = { id: 400, concept: dummyGetConceptForId(400), children: [401] };
    expect(dummyGetNodeFromHierarchy(400)).toStrictEqual(dummyData);
  });
});

describe('test dummyGetParentInHierarchy', () => {
  const dummyData = { id: 400, concept: dummyGetConceptForId(400), children: [401] };

  test('testing on id 400', () => {
    expect(dummyGetParentInHierarchy(400)).toStrictEqual(dummyData);
  });

  test('fetching id 401', () => {
    expect(dummyGetParentInHierarchy(401)).toStrictEqual(dummyData);
  });

  test('fetching id 402', () => {
    expect(dummyGetParentInHierarchy(402)).toStrictEqual(dummyData);
  });

  test('fetching id 403', () => {
    expect(dummyGetParentInHierarchy(403)).toStrictEqual(dummyData);
  });

  test('fetching id 404', () => {
    expect(dummyGetParentInHierarchy(404)).toStrictEqual(dummyData);
  });

  test('fetching id 405', () => {
    expect(dummyGetParentInHierarchy(405)).toStrictEqual(dummyData);
  });
});

describe('test gettingHierarchyMap', () => {
  /**
   * HIERARCHY REPRESENTATION
   *             100
   *           /    \
   *         400    408
   *          |
   *         401
   *        / | \
   *       /  |  \
   *      /   |   \
   *    402  403  404
   *     |         \
   *    407       / \
   *             /   \
   *           405   406
   */

  test('fetching hierarchy map of id 400', () => {
    const hierarchyMap = new Map<Concept, Concept[]>();
    hierarchyMap.set(dummyGetConceptForId(100), [dummyGetConceptForId(400), dummyGetConceptForId(408)]);
    expect(getHierarchyMap(400)).toStrictEqual(hierarchyMap);
  });
  test('fetching hierarchy map of id 401', () => {
    const hierarchyMap = new Map<Concept, Concept[]>();
    hierarchyMap.set(dummyGetConceptForId(100), [dummyGetConceptForId(400), dummyGetConceptForId(408)]);
    hierarchyMap.set(dummyGetConceptForId(400), [dummyGetConceptForId(401)]);
    expect(getHierarchyMap(401)).toStrictEqual(hierarchyMap);
  });
  test('fetching hierarchy map of id 402', () => {
    const hierarchyMap = new Map<Concept, Concept[]>();
    hierarchyMap.set(dummyGetConceptForId(100), [dummyGetConceptForId(400), dummyGetConceptForId(408)]);
    hierarchyMap.set(dummyGetConceptForId(400), [dummyGetConceptForId(401)]);
    hierarchyMap.set(dummyGetConceptForId(401), [
      dummyGetConceptForId(402),
      dummyGetConceptForId(403),
      dummyGetConceptForId(404),
    ]);
    expect(getHierarchyMap(402)).toStrictEqual(hierarchyMap);
  });
  test('fetching hierarchy map of id 403', () => {
    const hierarchyMap = new Map<Concept, Concept[]>();
    hierarchyMap.set(dummyGetConceptForId(100), [dummyGetConceptForId(400), dummyGetConceptForId(408)]);
    hierarchyMap.set(dummyGetConceptForId(400), [dummyGetConceptForId(401)]);
    hierarchyMap.set(dummyGetConceptForId(401), [
      dummyGetConceptForId(402),
      dummyGetConceptForId(403),
      dummyGetConceptForId(404),
    ]);
    expect(getHierarchyMap(403)).toStrictEqual(hierarchyMap);
  });
  test('fetching hierarchy map of id 404', () => {
    const hierarchyMap = new Map<Concept, Concept[]>();
    hierarchyMap.set(dummyGetConceptForId(100), [dummyGetConceptForId(400), dummyGetConceptForId(408)]);
    hierarchyMap.set(dummyGetConceptForId(400), [dummyGetConceptForId(401)]);
    hierarchyMap.set(dummyGetConceptForId(401), [
      dummyGetConceptForId(402),
      dummyGetConceptForId(403),
      dummyGetConceptForId(404),
    ]);
    expect(getHierarchyMap(404)).toStrictEqual(hierarchyMap);
  });

  test('fetching hierarchy map of id 407', () => {
    const hierarchyMap = new Map<Concept, Concept[]>();
    hierarchyMap.set(dummyGetConceptForId(100), [dummyGetConceptForId(400), dummyGetConceptForId(408)]);
    hierarchyMap.set(dummyGetConceptForId(400), [dummyGetConceptForId(401)]);
    hierarchyMap.set(dummyGetConceptForId(401), [
      dummyGetConceptForId(402),
      dummyGetConceptForId(403),
      dummyGetConceptForId(404),
    ]);
    hierarchyMap.set(dummyGetConceptForId(402), [dummyGetConceptForId(407)]);

    expect(getHierarchyMap(407)).toStrictEqual(hierarchyMap);
  });

  test('fetching hierarchy map of id 408', () => {
    const hierarchyMap = new Map<Concept, Concept[]>();
    hierarchyMap.set(dummyGetConceptForId(100), [dummyGetConceptForId(400), dummyGetConceptForId(408)]);
    expect(getHierarchyMap(408)).toStrictEqual(hierarchyMap);
  });
});
