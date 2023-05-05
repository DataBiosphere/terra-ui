import { render } from '@testing-library/react';
import _ from 'lodash/fp';
import { h } from 'react-hyperscript-helpers';
import * as Nav from 'src/libs/nav';
import { dataCatalogStore, datasetBuilderCohorts, datasetBuilderConceptSets } from 'src/libs/state';
import { PREPACKAGED_CONCEPT_SETS } from 'src/pages/library/datasetBuilder/constants';
import { ConceptSet } from 'src/pages/library/datasetBuilder/dataset-builder-types';
import { CohortSelector, ConceptSetSelector, ValuesSelector } from 'src/pages/library/datasetBuilder/DatasetBuilder';

jest.mock('src/libs/nav', () => ({
  ...jest.requireActual('src/libs/nav'),
  getLink: jest.fn(),
  useRoute: jest.fn(),
}));

describe('DatasetBuilder', () => {
  beforeEach(() => {
    dataCatalogStore.reset();
    // @ts-ignore
    Nav.useRoute.mockReturnValue({ title: 'Build Dataset', params: {}, query: {} });
  });

  it('renders cohorts', () => {
    // @ts-ignore
    datasetBuilderCohorts.set([{ name: 'cohort 1' }, { name: 'cohort 2' }]);
    const { getByText } = render(h(CohortSelector, { selectedCohorts: [], onChange: (cohorts) => cohorts }));

    expect(getByText('cohort 1')).toBeTruthy();
    expect(getByText('cohort 2')).toBeTruthy();
  });

  it('renders concept sets and prepackaged concept sets', () => {
    // @ts-ignore
    datasetBuilderConceptSets.set([{ name: 'concept set 1' }, { name: 'concept set 2' }]);
    const { getByText } = render(
      h(ConceptSetSelector, { selectedConceptSets: [], onChange: (conceptSets) => conceptSets })
    );

    expect(getByText('concept set 1')).toBeTruthy();
    expect(getByText('concept set 2')).toBeTruthy();
    _.flow(
      _.map((prepackagedConceptSet: ConceptSet) => prepackagedConceptSet.name),
      _.forEach((prepackagedConceptSet: string) => expect(getByText(prepackagedConceptSet)).toBeTruthy())
    )(PREPACKAGED_CONCEPT_SETS);
    expect(getByText('Concept sets')).toBeTruthy();
    expect(getByText('Prepackaged concept sets')).toBeTruthy();
  });

  it('renders values with different headers', () => {
    const valuesValueSets = [
      { header: 'Person', values: [{ name: 'person field 1' }, { name: 'person field 2' }] },
      { header: 'Condition', values: [{ name: 'condition field 1' }] },
      { header: 'Procedure', values: [{ name: 'procedure field 1' }] },
    ];
    const { getByText } = render(
      h(ValuesSelector, {
        selectedValues: [],
        onChange: (conceptSets) => conceptSets,
        values: valuesValueSets,
      })
    );

    _.forEach((valueSet) => {
      expect(getByText(valueSet.header)).toBeTruthy();
      _.forEach((value) => expect(getByText(value.name)).toBeTruthy(), valueSet.values);
    }, valuesValueSets);
  });
});
