import { fireEvent, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import _ from 'lodash/fp';
import { h } from 'react-hyperscript-helpers';
import { Cohort, ConceptSet } from 'src/dataset-builder/DatasetBuilderUtils';
import { DataRepo, DataRepoContract, DatasetModel } from 'src/libs/ajax/DataRepo';
import * as Nav from 'src/libs/nav';
import { asMockedFn, renderWithAppContexts as render } from 'src/testing/test-utils';

import { cohortEditorState, newCohort, Updater } from './dataset-builder-types';
import {
  CohortSelector,
  ConceptSetSelector,
  CreateCohortModal,
  DatasetBuilderContents,
  DatasetBuilderView,
  OnStateChangeHandler,
  ValuesSelector,
} from './DatasetBuilder';
import { dummyDatasetModel } from './TestConstants';

jest.mock('src/libs/nav', () => ({
  ...jest.requireActual('src/libs/nav'),
  getLink: jest.fn(),
  useRoute: jest.fn(),
}));

jest.mock('src/libs/ajax/GoogleStorage');
type DataRepoExports = typeof import('src/libs/ajax/DataRepo');
jest.mock('src/libs/ajax/DataRepo', (): DataRepoExports => {
  return {
    ...jest.requireActual('src/libs/ajax/DataRepo'),
    DataRepo: jest.fn(),
  };
});

describe('DatasetBuilder', () => {
  const dummyDatasetDetailsWithId = dummyDatasetModel();
  type DatasetBuilderContentsPropsOverrides = {
    onStateChange?: OnStateChangeHandler;
    updateCohorts?: Updater<Cohort[]>;
    updateConceptSets?: Updater<ConceptSet[]>;
    dataset?: DatasetModel;
    cohorts?: Cohort[];
    conceptSets?: ConceptSet[];
  };
  const showDatasetBuilderContents = (overrides?: DatasetBuilderContentsPropsOverrides) => {
    render(
      h(DatasetBuilderContents, {
        cohorts: [],
        conceptSets: [],
        updateCohorts: jest.fn(),
        updateConceptSets: jest.fn(),
        onStateChange: (state) => state,
        dataset: dummyDatasetDetailsWithId,
        ...overrides,
      })
    );
  };

  const mockWithValues = (datasetDetailsResponse: DatasetModel) => {
    const datasetDetailsMock = jest.fn((_include) => Promise.resolve(datasetDetailsResponse));
    const queryDatasetColumnStatisticsByIdMock = jest.fn((_dataOption) =>
      Promise.resolve({ kind: 'range', min: 0, max: 100, id: 0, name: 'unused' })
    );
    asMockedFn(DataRepo).mockImplementation(
      () =>
        ({
          dataset: (_datasetId) =>
            ({
              details: datasetDetailsMock,
              queryDatasetColumnStatisticsById: queryDatasetColumnStatisticsByIdMock,
            } as Partial<DataRepoContract['dataset']>),
        } as Partial<DataRepoContract> as DataRepoContract)
    );
  };

  const initializeValidDatasetRequest = async (user) => {
    showDatasetBuilderContents({
      cohorts: [newCohort('cohort 1')],
      conceptSets: [{ name: 'concept set 1', featureValueGroupName: 'Condition' }],
    });
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

  const renderConceptSetSelector = () =>
    render(
      h(ConceptSetSelector, {
        conceptSets: [
          { name: 'concept set 1', featureValueGroupName: 'a' },
          { name: 'concept set 2', featureValueGroupName: 'b' },
        ],
        prepackagedConceptSets: dummyDatasetDetailsWithId!.snapshotBuilderSettings!.datasetConceptSets,
        selectedConceptSets: [],
        updateConceptSets: jest.fn(),
        onChange: (conceptSets) => conceptSets,
        onStateChange: (state) => state,
      })
    );

  const renderValuesSelector = (valuesValueSets) =>
    render(
      h(ValuesSelector, {
        selectedValues: [],
        onChange: (conceptSets) => conceptSets,
        values: valuesValueSets,
      })
    );

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
    renderConceptSetSelector();

    expect(screen.getByText('concept set 1')).toBeTruthy();
    expect(screen.getByText('concept set 2')).toBeTruthy();
    _.flow(
      _.map((prepackagedConceptSet: ConceptSet) => prepackagedConceptSet.name),
      _.forEach((prepackagedConceptSetName: string) => expect(screen.getByText(prepackagedConceptSetName)).toBeTruthy())
    )(dummyDatasetDetailsWithId!.snapshotBuilderSettings!.datasetConceptSets);
    expect(screen.getByText('Concept sets')).toBeTruthy();
    expect(screen.getByText('Prepackaged concept sets')).toBeTruthy();
  });

  it('renders values with different headers', () => {
    const valuesValueSets = [
      { header: 'Person', values: [{ name: 'person field 1' }, { name: 'person field 2' }] },
      { header: 'Condition', values: [{ name: 'condition field 1' }] },
      { header: 'Procedure', values: [{ name: 'procedure field 1' }] },
    ];
    renderValuesSelector(valuesValueSets);

    _.forEach((valueSet) => {
      expect(screen.getByText(valueSet.header)).toBeTruthy();
      _.forEach((value) => expect(screen.getByText(value.name)).toBeTruthy(), valueSet.values);
    }, valuesValueSets);
  });

  it('renders dataset builder contents with cohorts and concept sets', () => {
    // Arrange
    showDatasetBuilderContents();
    // Assert
    expect(screen.getByText('Select cohorts')).toBeTruthy();
    expect(screen.getByText('Select concept sets')).toBeTruthy();
    expect(screen.getByText('Select values (columns)')).toBeTruthy();
  });

  it('allows selecting cohorts, concept sets, and values', async () => {
    // Arrange
    const user = userEvent.setup();
    showDatasetBuilderContents({
      cohorts: [newCohort('cohort 1'), newCohort('cohort 2')],
      conceptSets: [
        { name: 'concept set 1', featureValueGroupName: 'Condition' },
        { name: 'concept set 2', featureValueGroupName: 'Procedure' },
      ],
    });
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
    showDatasetBuilderContents({ conceptSets: [{ name: 'concept set 1', featureValueGroupName: 'Condition' }] });
    // Act
    await user.click(screen.getByLabelText('concept set 1'));
    // Assert
    expect(screen.getByLabelText('condition column 1')).toBeChecked();
    expect(screen.getByText('Condition')).toBeTruthy();
  });

  it('shows the home page by default', async () => {
    // Arrange
    mockWithValues(dummyDatasetDetailsWithId);
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
    const mockDataRepoContract: Partial<DataRepoContract> = {
      dataset: (_datasetId) =>
        ({
          getCounts: () => Promise.resolve({ result: { total: 100 }, sql: '' }),
        } as Partial<DataRepoContract['dataset']>),
    } as Partial<DataRepoContract> as DataRepoContract;
    asMockedFn(DataRepo).mockImplementation(() => mockDataRepoContract as DataRepoContract);
    // Arrange
    const user = userEvent.setup();
    await initializeValidDatasetRequest(user);
    // Assert
    expect(await screen.findByText('100 participants in this dataset')).toBeTruthy();
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
    showDatasetBuilderContents({
      onStateChange,
    });
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
    showDatasetBuilderContents({
      cohorts,
      onStateChange,
    });
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
    showDatasetBuilderContents({ cohorts, updateCohorts });
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
    showDatasetBuilderContents({ updateConceptSets, conceptSets });
    // Act
    await user.click(await screen.findByLabelText(`Delete Concept sets/${conceptSets[0].name}`));
    // Assert
    expect(updateConceptSets.mock.calls[0][0](conceptSets)).toStrictEqual(_.tail(conceptSets));
  });
});
