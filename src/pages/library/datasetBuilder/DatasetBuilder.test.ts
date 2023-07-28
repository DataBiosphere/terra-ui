import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import _ from 'lodash/fp';
import { h } from 'react-hyperscript-helpers';
import { ConceptSet, dummyDatasetDetails } from 'src/libs/ajax/DatasetBuilder';
import * as Nav from 'src/libs/nav';
import { PREPACKAGED_CONCEPT_SETS } from 'src/pages/library/datasetBuilder/constants';
import { cohortEditorState, newCohort } from 'src/pages/library/datasetBuilder/dataset-builder-types';
import {
  CohortSelector,
  ConceptSetSelector,
  CreateCohortModal,
  DatasetBuilderContents,
  DatasetBuilderView,
  ValuesSelector,
} from 'src/pages/library/datasetBuilder/DatasetBuilder';
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
  const initializeValidDatasetRequest = async (user) => {
    render(
      h(DatasetBuilderContents, {
        updateCohorts: jest.fn(),
        updateConceptSets: jest.fn(),
        cohorts: [newCohort('cohort 1')],
        conceptSets: [{ name: 'concept set 1', featureValueGroupName: 'Condition' }],
        onStateChange: (state) => state,
        dataset: dummyDatasetDetails('id'),
      })
    );
    await user.click(screen.getByLabelText('cohort 1'));
    await user.click(screen.getByLabelText('concept set 1'));
  };

  beforeEach(() => {
    asMockedFn(Nav.useRoute).mockReturnValue({ title: 'Build Dataset', params: {}, query: {} });
  });

  const renderCohortSelector = () => {
    render(
      h(CohortSelector, {
        updateCohorts: jest.fn(),
        cohorts: [newCohort('cohort 1'), newCohort('cohort 2')],
        selectedCohorts: [],
        onChange: (cohorts) => cohorts,
        onStateChange: (state) => state,
      })
    );
  };

  it('renders cohorts', () => {
    // Arrange
    renderCohortSelector();
    // Assert
    expect(screen.getByText('cohort 1')).toBeTruthy();
    expect(screen.getByText('cohort 2')).toBeTruthy();
  });

  it('opens the create cohort model when clicking plus', async () => {
    // Arrange
    const user = userEvent.setup();
    renderCohortSelector();
    // Act
    await user.click(screen.getByLabelText('Create new cohort'));
    // Assert
    expect(screen.getByText('Create a new cohort')).toBeTruthy();
  });

  it('creates a cohort when the cohort creation modal is filled out', async () => {
    // Arrange
    const user = userEvent.setup();
    const onStateChange = jest.fn();

    render(h(CreateCohortModal, { onDismiss: () => {}, onStateChange, cohorts: [] }));
    // Act
    const cohortName = 'new cohort';
    fireEvent.change(await screen.findByLabelText('Cohort name *'), { target: { value: cohortName } });
    await user.click(screen.getByText('Create cohort'));
    // Assert
    expect(onStateChange).toHaveBeenCalledWith(cohortEditorState.new(newCohort(cohortName)));
  });

  it('renders concept sets and prepackaged concept sets', () => {
    render(
      h(ConceptSetSelector, {
        conceptSets: [
          { name: 'concept set 1', featureValueGroupName: 'a' },
          { name: 'concept set 2', featureValueGroupName: 'b' },
        ],
        selectedConceptSets: [],
        updateConceptSets: jest.fn(),
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
    render(
      h(DatasetBuilderContents, {
        updateCohorts: jest.fn(),
        updateConceptSets: jest.fn(),
        cohorts: [],
        conceptSets: [],
        onStateChange: (state) => state,
        dataset: dummyDatasetDetails('id'),
      })
    );
    // Assert
    expect(screen.getByText('Select cohorts')).toBeTruthy();
    expect(screen.getByText('Select concept sets')).toBeTruthy();
    expect(screen.getByText('Select values (columns)')).toBeTruthy();
  });

  it('allows selecting cohorts, concept sets, and values', async () => {
    // Arrange
    const user = userEvent.setup();
    render(
      h(DatasetBuilderContents, {
        updateCohorts: jest.fn(),
        updateConceptSets: jest.fn(),
        cohorts: [newCohort('cohort 1'), newCohort('cohort 2')],
        conceptSets: [
          { name: 'concept set 1', featureValueGroupName: 'Condition' },
          { name: 'concept set 2', featureValueGroupName: 'Procedure' },
        ],
        onStateChange: (state) => state,
        dataset: dummyDatasetDetails('id'),
      })
    );
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
    await initializeValidDatasetRequest(user);
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
    render(
      h(DatasetBuilderContents, {
        updateCohorts: jest.fn(),
        updateConceptSets: jest.fn(),
        cohorts: [],
        conceptSets: [{ name: 'concept set 1', featureValueGroupName: 'Condition' }],
        onStateChange: (state) => state,
        dataset: dummyDatasetDetails('id'),
      })
    );
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

  it('shows the participant count and request access buttons when request is valid', async () => {
    // Arrange
    const user = userEvent.setup();
    await initializeValidDatasetRequest(user);
    // Assert
    expect(await screen.findByText('100 Participants in this dataset')).toBeTruthy();
    expect(await screen.findByText('Request access to this dataset')).toBeTruthy();
  });

  it('opens the modal when requesting access to the dataset', async () => {
    // Arrange
    const user = userEvent.setup();
    await initializeValidDatasetRequest(user);
    await user.click(await screen.findByText('Request access to this dataset'));
    // Assert
    expect(await screen.findByText('Requesting access')).toBeTruthy();
  });

  it('shows the concept set creator', async () => {
    // Arrange
    const user = userEvent.setup();
    const onStateChange = jest.fn();
    render(
      h(DatasetBuilderContents, {
        updateCohorts: jest.fn(),
        updateConceptSets: jest.fn(),
        cohorts: [],
        conceptSets: [],
        onStateChange,
        dataset: dummyDatasetDetails('id'),
      })
    );
    // Act
    await user.click(await screen.findByLabelText('Create new concept set'));
    // Assert
    expect(onStateChange).toHaveBeenCalledWith({ mode: 'concept-set-creator' });
  });

  it('enables editing cohorts', async () => {
    // Arrange
    const user = userEvent.setup();
    const onStateChange = jest.fn();
    const cohorts = [newCohort('cohort 1'), newCohort('cohort 2')];
    render(
      h(DatasetBuilderContents, {
        updateCohorts: jest.fn(),
        updateConceptSets: jest.fn(),
        cohorts,
        conceptSets: [],
        onStateChange,
        dataset: dummyDatasetDetails('id'),
      })
    );
    // Act
    await user.click(await screen.findByLabelText(`Saved cohorts/${cohorts[0].name} menu`));
    await user.click(await screen.findByLabelText('Edit cohort'));
    // Assert
    expect(onStateChange).toHaveBeenCalledWith(cohortEditorState.new(cohorts[0]));
  });

  it('enables deleting cohorts', async () => {
    // Arrange
    const user = userEvent.setup();
    const updateCohorts = jest.fn();
    const cohorts = [newCohort('cohort 1'), newCohort('cohort 2')];
    render(
      h(DatasetBuilderContents, {
        updateCohorts,
        updateConceptSets: jest.fn(),
        cohorts,
        conceptSets: [],
        onStateChange: jest.fn(),
        dataset: dummyDatasetDetails('id'),
      })
    );
    // Act
    await user.click(await screen.findByLabelText(`Saved cohorts/${cohorts[0].name} menu`));
    await user.click(await screen.findByLabelText('Delete cohort'));
    // Assert
    expect(updateCohorts.mock.calls[0][0](cohorts)).toStrictEqual(_.tail(cohorts));
  });

  it('enables deleting concept sets', async () => {
    // Arrange
    const user = userEvent.setup();
    const updateConceptSets = jest.fn();
    const conceptSets = [
      { name: 'concept set 1', featureValueGroupName: 'Condition' },
      { name: 'concept set 2', featureValueGroupName: 'Procedure' },
    ];
    render(
      h(DatasetBuilderContents, {
        updateCohorts: jest.fn(),
        updateConceptSets,
        cohorts: [],
        conceptSets,
        onStateChange: jest.fn(),
        dataset: dummyDatasetDetails('id'),
      })
    );
    // Act
    await user.click(await screen.findByLabelText(`Delete Concept sets/${conceptSets[0].name}`));
    // Assert
    expect(updateConceptSets.mock.calls[0][0](conceptSets)).toStrictEqual(_.tail(conceptSets));
  });
});
