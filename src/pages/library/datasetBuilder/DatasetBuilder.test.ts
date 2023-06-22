import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import _ from 'lodash/fp';
import { h } from 'react-hyperscript-helpers';
import { dummyDatasetDetails } from 'src/libs/ajax/DatasetBuilder';
import * as Nav from 'src/libs/nav';
import { PREPACKAGED_CONCEPT_SETS } from 'src/pages/library/datasetBuilder/constants';
import {
  AnyDatasetBuilderState,
  cohortEditorState,
  ConceptSet,
  newCohort,
} from 'src/pages/library/datasetBuilder/dataset-builder-types';
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
    render(h(CohortSelector, { selectedCohorts: [], onChange: (cohorts) => cohorts, onStateChange: (state) => state }));

    expect(screen.getByText('cohort 1')).toBeTruthy();
    expect(screen.getByText('cohort 2')).toBeTruthy();
  });

  it('opens the create cohort model when clicking plus', async () => {
    // Arrange
    const user = userEvent.setup();

    datasetBuilderCohorts.set([newCohort('cohort 1'), newCohort('cohort 2')]);
    render(h(CohortSelector, { selectedCohorts: [], onChange: (cohorts) => cohorts, onStateChange: (state) => state }));
    // Act
    await user.click(screen.getByLabelText('Create new cohort'));
    // Assert
    expect(screen.getByText('Create a new cohort')).toBeTruthy();
  });

  it('creates a cohort when the cohort creation modal is filled out', async () => {
    // Arrange
    const user = userEvent.setup();
    const onStateChange = jest.fn();

    render(h(CreateCohortModal, { onDismiss: () => {}, onStateChange }));
    // Act
    const cohortName = 'new cohort';
    fireEvent.change(await screen.findByLabelText('Cohort name *'), { target: { value: cohortName } });
    await user.click(screen.getByText('Create cohort'));
    // Assert
    expect(onStateChange).toHaveBeenCalledWith(cohortEditorState.new(newCohort(cohortName)));
  });

  it('renders concept sets and prepackaged concept sets', () => {
    datasetBuilderConceptSets.set([
      { name: 'concept set 1', featureValueGroupName: 'a' },
      { name: 'concept set 2', featureValueGroupName: 'b' },
    ]);
    render(
      h(ConceptSetSelector, {
        selectedConceptSets: [],
        onChange: (conceptSets) => conceptSets,
        onStateChange: (state) => state,
      })
    );

    expect(screen.getByText('concept set 1')).toBeTruthy();
    expect(screen.getByText('concept set 2')).toBeTruthy();
    _.flow(
      _.map((prepackagedConceptSet: ConceptSet) => prepackagedConceptSet.name),
      _.forEach((prepackagedConceptSet: string) => expect(screen.getByText(prepackagedConceptSet)).toBeTruthy())
    )(PREPACKAGED_CONCEPT_SETS);
    expect(screen.getByText('Concept sets')).toBeTruthy();
    expect(screen.getByText('Prepackaged concept sets')).toBeTruthy();
  });

  it('renders values with different headers', () => {
    const valuesValueSets = [
      { header: 'Person', values: [{ name: 'person field 1' }, { name: 'person field 2' }] },
      { header: 'Condition', values: [{ name: 'condition field 1' }] },
      { header: 'Procedure', values: [{ name: 'procedure field 1' }] },
    ];
    render(
      h(ValuesSelector, {
        selectedValues: [],
        onChange: (conceptSets) => conceptSets,
        values: valuesValueSets,
      })
    );

    _.forEach((valueSet) => {
      expect(screen.getByText(valueSet.header)).toBeTruthy();
      _.forEach((value) => expect(screen.getByText(value.name)).toBeTruthy(), valueSet.values);
    }, valuesValueSets);
  });

  it('renders dataset builder contents with cohorts and concept sets', () => {
    // Arrange
    render(h(DatasetBuilderContents, { onStateChange: (state) => state, dataset: dummyDatasetDetails('id') }));
    // Assert
    expect(screen.getByText('Select cohorts')).toBeTruthy();
    expect(screen.getByText('Select concept sets')).toBeTruthy();
    expect(screen.getByText('Select values (columns)')).toBeTruthy();
  });

  it('allows selecting cohorts, concept sets, and values', async () => {
    // Arrange
    const user = userEvent.setup();

    datasetBuilderCohorts.set([newCohort('cohort 1'), newCohort('cohort 2')]);
    datasetBuilderConceptSets.set([
      { name: 'concept set 1', featureValueGroupName: 'Condition' },
      { name: 'concept set 2', featureValueGroupName: 'Procedure' },
    ]);
    render(h(DatasetBuilderContents, { onStateChange: (state) => state, dataset: dummyDatasetDetails('id') }));
    // Act
    await user.click(screen.getByLabelText('cohort 1'));
    await user.click(screen.getByLabelText('concept set 1'));
    await user.click(screen.getByLabelText('condition column 1'));

    // Assert
    expect(screen.getByLabelText('cohort 1')).toBeChecked();
    expect(screen.getByLabelText('cohort 2')).not.toBeChecked();
    expect(screen.getByLabelText('concept set 1')).toBeChecked();
    expect(screen.getByLabelText('concept set 2')).not.toBeChecked();
    expect(screen.getByLabelText('condition column 1')).not.toBeChecked();
    expect(screen.getByLabelText('condition column 2')).toBeChecked();
  });

  it('maintains old values selections', async () => {
    // Arrange
    const user = userEvent.setup();

    datasetBuilderCohorts.set([newCohort('cohort 1'), newCohort('cohort 2')]);
    datasetBuilderConceptSets.set([{ name: 'concept set 1', featureValueGroupName: 'Condition' }]);
    render(h(DatasetBuilderContents, { onStateChange: (state) => state, dataset: dummyDatasetDetails('id') }));
    // Act
    await user.click(screen.getByLabelText('cohort 1'));
    await user.click(screen.getByLabelText('concept set 1'));
    await user.click(screen.getByLabelText('condition column 1'));
    await user.click(screen.getByLabelText('concept set 1'));
    await user.click(screen.getByLabelText('concept set 1'));

    // Assert
    expect(screen.getByLabelText('condition column 1')).not.toBeChecked();
    expect(screen.getByLabelText('condition column 2')).toBeChecked();
  });

  it('places selectable values defaulted to selected when concept set is selected', async () => {
    // Arrange
    const user = userEvent.setup();

    datasetBuilderConceptSets.set([{ name: 'concept set 1', featureValueGroupName: 'Condition' }]);
    render(h(DatasetBuilderContents, { onStateChange: (state) => state, dataset: dummyDatasetDetails('id') }));
    // Act
    await user.click(screen.getByLabelText('concept set 1'));
    // Assert
    expect(screen.getByLabelText('condition column 1')).toBeChecked();
    expect(screen.getByText('Condition')).toBeTruthy();
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
    const initialState = cohortEditorState.new(newCohort('my test cohort'));
    render(h(DatasetBuilderView, { datasetId: 'ignored', initialState }));
    // Assert
    expect(await screen.findByText(initialState.cohort.name)).toBeTruthy();
  });

  it('shows a placeholder page', async () => {
    // Arrange
    const initialState: AnyDatasetBuilderState = { mode: 'concept-selector' };
    render(h(DatasetBuilderView, { datasetId: 'ignored', initialState }));
    // Assert
    expect(await screen.findByText(initialState.mode)).toBeTruthy();
  });
});
