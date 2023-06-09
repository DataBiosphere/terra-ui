import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import _ from 'lodash/fp';
import { h } from 'react-hyperscript-helpers';
import * as Nav from 'src/libs/nav';
import { CohortEditorState } from 'src/pages/library/datasetBuilder/CohortEditor';
import { PREPACKAGED_CONCEPT_SETS } from 'src/pages/library/datasetBuilder/constants';
import { ConceptSet, DatasetBuilderState, newCohort } from 'src/pages/library/datasetBuilder/dataset-builder-types';
import {
  CohortSelector,
  ConceptSetSelector,
  CreateCohortModal,
  DatasetBuilderContents,
  DatasetBuilderView,
  ValuesSelector,
} from 'src/pages/library/datasetBuilder/DatasetBuilder';
import { datasetBuilderCohorts, datasetBuilderConceptSets } from 'src/pages/library/datasetBuilder/state';
import { asMockedFn } from 'src/testing/test-utils';

jest.mock('src/libs/nav', () => ({
  ...jest.requireActual('src/libs/nav'),
  getLink: jest.fn(),
  useRoute: jest.fn(),
}));

type ModalMockExports = typeof import('src/components/Modal.mock');
jest.mock('src/components/Modal', () => {
  const mockModal = jest.requireActual<ModalMockExports>('src/components/Modal.mock');
  return mockModal.mockModalModule();
});

describe('DatasetBuilder', () => {
  beforeEach(() => {
    datasetBuilderCohorts.reset();
    datasetBuilderConceptSets.reset();
    asMockedFn(Nav.useRoute).mockReturnValue({ title: 'Build Dataset', params: {}, query: {} });
  });

  it('renders cohorts', () => {
    datasetBuilderCohorts.set([newCohort('cohort 1'), newCohort('cohort 2')]);
    const { getByText } = render(
      h(CohortSelector, { selectedCohorts: [], onChange: (cohorts) => cohorts, onStateChange: (state) => state })
    );

    expect(getByText('cohort 1')).toBeTruthy();
    expect(getByText('cohort 2')).toBeTruthy();
  });

  it('opens the create cohort model when clicking plus', async () => {
    // Arrange
    const user = userEvent.setup();

    datasetBuilderCohorts.set([newCohort('cohort 1'), newCohort('cohort 2')]);
    const { getByText, getByLabelText } = render(
      h(CohortSelector, { selectedCohorts: [], onChange: (cohorts) => cohorts, onStateChange: (state) => state })
    );
    // Act
    await user.click(getByLabelText('Create new cohort'));
    // Assert
    expect(getByText('Create a new cohort')).toBeTruthy();
  });

  it('creates a cohort when the cohort creation modal is filled out', async () => {
    // Arrange
    const user = userEvent.setup();
    const onStateChange = jest.fn();

    const { getByText, findByLabelText } = render(h(CreateCohortModal, { onDismiss: () => {}, onStateChange }));
    // Act
    const cohortName = 'new cohort';
    fireEvent.change(await findByLabelText('Cohort name *'), { target: { value: cohortName } });
    await user.click(getByText('Create cohort'));
    // Assert
    expect(onStateChange).toHaveBeenCalledWith(new CohortEditorState(newCohort(cohortName)));
  });

  it('renders concept sets and prepackaged concept sets', () => {
    datasetBuilderConceptSets.set([{ name: 'concept set 1' }, { name: 'concept set 2' }]);
    const { getByText } = render(
      h(ConceptSetSelector, {
        selectedConceptSets: [],
        onChange: (conceptSets) => conceptSets,
        onStateChange: (state) => state,
      })
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

  it('renders dataset builder contents with cohorts and concept sets', () => {
    // Arrange
    const { getByText } = render(h(DatasetBuilderContents, { onStateChange: (state) => state }));
    // Assert
    expect(getByText('Select cohorts')).toBeTruthy();
    expect(getByText('Select concept sets')).toBeTruthy();
    expect(getByText('Select values (columns)')).toBeTruthy();
  });

  it('allows selecting cohorts and concept sets', async () => {
    // Arrange
    const user = userEvent.setup();

    datasetBuilderCohorts.set([newCohort('cohort 1'), newCohort('cohort 2')]);
    datasetBuilderConceptSets.set([{ name: 'concept set 1' }, { name: 'concept set 2' }]);
    const { getByLabelText } = render(h(DatasetBuilderContents, { onStateChange: (state) => state }));
    // Act
    await user.click(getByLabelText('cohort 1'));
    await user.click(getByLabelText('cohort 2'));
    await user.click(getByLabelText('concept set 1'));
    await user.click(getByLabelText('concept set 2'));

    // Assert
    expect(getByLabelText('cohort 1').getAttribute('aria-checked')).toBeTruthy();
    expect(getByLabelText('cohort 2').getAttribute('aria-checked')).toBeTruthy();
    expect(getByLabelText('concept set 1').getAttribute('aria-checked')).toBeTruthy();
    expect(getByLabelText('concept set 2').getAttribute('aria-checked')).toBeTruthy();
  });

  it('shows the home page by default', async () => {
    // Arrange
    render(h(DatasetBuilderView));
    // Assert
    expect(screen.getByTestId('loading-spinner')).toBeTruthy();
    expect(await screen.findByText('Datasets')).toBeTruthy();
  });

  it('shows the cohort editor page', async () => {
    // Arrange
    const initialState = new CohortEditorState(newCohort('my test cohort'));
    render(h(DatasetBuilderView, { datasetId: 'ignored', initialState }));
    // Assert
    expect(await screen.findByText(initialState.cohort.name)).toBeTruthy();
  });

  it('shows a placeholder page', async () => {
    // Arrange
    const initialState: DatasetBuilderState = { type: 'concept-selector' };
    render(h(DatasetBuilderView, { datasetId: 'ignored', initialState }));
    // Assert
    expect(await screen.findByText(initialState.type)).toBeTruthy();
  });
});
