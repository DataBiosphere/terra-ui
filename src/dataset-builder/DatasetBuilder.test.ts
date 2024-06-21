import { fireEvent, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import _ from 'lodash/fp';
import { h } from 'react-hyperscript-helpers';
import { Cohort, convertDomainOptionToConceptSet, DomainConceptSet } from 'src/dataset-builder/DatasetBuilderUtils';
import {
  DataRepo,
  DataRepoContract,
  SnapshotBuilderDatasetConceptSet,
  SnapshotBuilderDomainOption,
  SnapshotBuilderSettings,
} from 'src/libs/ajax/DataRepo';
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
} from './DatasetBuilder';
import { testSnapshotBuilderSettings, testSnapshotId } from './TestConstants';

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
  const testSettings = testSnapshotBuilderSettings();
  type DatasetBuilderContentsPropsOverrides = {
    onStateChange?: OnStateChangeHandler;
    updateCohorts?: Updater<Cohort[]>;
    updateConceptSets?: Updater<DomainConceptSet[]>;
    snapshotId?: string;
    snapshotBuilderSettings?: SnapshotBuilderSettings;
    cohorts?: Cohort[];
    conceptSets?: DomainConceptSet[];
  };
  const showDatasetBuilderContents = (overrides?: DatasetBuilderContentsPropsOverrides) => {
    render(
      h(DatasetBuilderContents, {
        cohorts: [],
        conceptSets: [],
        updateCohorts: jest.fn(),
        updateConceptSets: jest.fn(),
        onStateChange: (state) => state,
        snapshotId: testSnapshotId,
        snapshotBuilderSettings: testSettings,
        ...overrides,
      })
    );
  };

  const mockDataRepo = (snapshotMocks: Partial<DataRepoContract['snapshot']>[]) => {
    asMockedFn(DataRepo).mockImplementation(
      () =>
        ({
          snapshot: (_snapshotId) => Object.assign({}, ...snapshotMocks),
        } as Partial<DataRepoContract> as DataRepoContract)
    );
  };

  const snapshotBuilderSettingsMock = (snapshotBuilderSettingsResponse: SnapshotBuilderSettings) => ({
    getSnapshotBuilderSettings: jest.fn((_include) => Promise.resolve(snapshotBuilderSettingsResponse)),
  });

  const snapshotRolesMock = (snapshotRolesResponse: string[]) => ({
    roles: jest.fn((_include) => Promise.resolve(snapshotRolesResponse)),
  });

  const getSnapshotBuilderCountMock = (count = 0) => ({
    getSnapshotBuilderCount: () =>
      Promise.resolve({
        result: {
          total: count,
        },
        sql: 'sql',
      }),
  });

  const initializeValidDatasetRequest = async (user) => {
    showDatasetBuilderContents({
      cohorts: [newCohort('cohort 1')],
    });
    await user.click(screen.getByLabelText('cohort 1'));
    await user.click(screen.getByLabelText('Condition'));
  };

  beforeEach(() => {
    asMockedFn(Nav.useRoute).mockReturnValue({ title: 'Data Explorer', params: {}, query: {} });
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
        conceptSets: _.map(convertDomainOptionToConceptSet, testSettings.domainOptions),
        prepackagedConceptSets: testSettings.datasetConceptSets,
        selectedConceptSets: [],
        updateConceptSets: jest.fn(),
        onChange: (conceptSets) => conceptSets,
        onStateChange: (state) => state,
      })
    );

  const mockCreateSnapshotAccessRequest = jest.fn().mockResolvedValue({
    id: '',
    sourceSnapshotId: '',
    snapshotName: '',
    snapshotResearchPurpose: '',
    snapshotSpecification: {
      cohorts: [{ name: 'g', criteriaGroups: [] }],
      conceptSets: [],
      valueSets: [{ name: 'Person', values: ['Person Column 1', 'Person Column 2'] }],
    },
    createdBy: 'user@email.com',
    status: 'SUBMITTED',
    createdDate: '2024-05-21T14:46:28.622665Z',
    updatedDate: null,
  });

  it('renders cohorts', () => {
    // Arrange
    renderCohortSelector();
    // Assert
    expect(screen.getByText('Find participants')).toBeTruthy();
    expect(screen.getByText('cohort 1')).toBeTruthy();
    expect(screen.getByText('cohort 2')).toBeTruthy();
  });

  it('opens the create cohort model when clicking find participants button', async () => {
    // Arrange
    const user = userEvent.setup();
    renderCohortSelector();
    // Act
    await user.click(screen.getByText('Find participants'));
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

  it('renders concept sets', () => {
    renderConceptSetSelector();
    _.flow(
      _.map((domainOption: SnapshotBuilderDomainOption) => domainOption.name),
      _.forEach((domainConceptSetName: string) => expect(screen.getByText(domainConceptSetName)).toBeTruthy())
    )(testSettings.domainOptions);
    _.flow(
      _.map((prepackagedConceptSet: SnapshotBuilderDatasetConceptSet) => prepackagedConceptSet.name),
      _.forEach((prepackagedConceptSetName: string) => expect(screen.getByText(prepackagedConceptSetName)).toBeTruthy())
    )(testSettings.datasetConceptSets);
  });

  it('renders dataset builder contents with cohorts and concept sets', () => {
    // Arrange
    showDatasetBuilderContents();
    // Assert
    expect(screen.getByText('Select participants')).toBeTruthy();
    expect(screen.getByText('Select data about participants')).toBeTruthy();
  });

  it('allows selecting cohorts, concept sets, and values', async () => {
    // Arrange
    mockDataRepo([getSnapshotBuilderCountMock()]);
    const user = userEvent.setup();
    showDatasetBuilderContents({
      cohorts: [newCohort('cohort 1'), newCohort('cohort 2')],
    });
    // Act
    await user.click(screen.getByLabelText('cohort 1'));
    await user.click(screen.getByLabelText('Condition'));

    // Assert
    expect(screen.getByLabelText('cohort 1')).toBeChecked();
    expect(screen.getByLabelText('cohort 2')).not.toBeChecked();
    expect(screen.getByLabelText('Condition')).toBeChecked();
    expect(screen.getByLabelText('Procedure')).not.toBeChecked();
    expect(screen.getByLabelText('Observation')).not.toBeChecked();
  });

  it('shows the home page by default', async () => {
    // Arrange
    mockDataRepo([
      snapshotBuilderSettingsMock(testSnapshotBuilderSettings()),
      snapshotRolesMock(['aggregate_data_reader']),
    ]);
    render(h(DatasetBuilderView));
    // Assert
    expect(screen.getByTestId('loading-spinner')).toBeTruthy();
    expect(await screen.findByText('Data Snapshots')).toBeTruthy();
  });

  it('shows the cohort editor page', async () => {
    // Arrange
    mockDataRepo([
      snapshotBuilderSettingsMock(testSnapshotBuilderSettings()),
      snapshotRolesMock(['aggregate_data_reader']),
    ]);
    const initialState = cohortEditorState.new(newCohort('my test cohort'));
    render(h(DatasetBuilderView, { snapshotId: 'ignored', initialState }));
    // Assert
    expect(await screen.findByText(initialState.cohort.name)).toBeTruthy();
  });

  it('shows the participant count and request access buttons when request is valid', async () => {
    const mockDataRepoContract: Partial<DataRepoContract> = {
      snapshot: (_snapshotId) =>
        ({
          getSnapshotBuilderCount: () => Promise.resolve({ result: { total: 100 }, sql: '' }),
        } as Partial<DataRepoContract['snapshot']>),
    } as Partial<DataRepoContract> as DataRepoContract;
    asMockedFn(DataRepo).mockImplementation(() => mockDataRepoContract as DataRepoContract);
    // Arrange
    const user = userEvent.setup();
    await initializeValidDatasetRequest(user);
    // Assert
    expect(await screen.findByText('100 participants in this dataset')).toBeTruthy();
    expect(await screen.findByText('Request this data snapshot')).toBeTruthy();
  });

  it('hides the count with there are few participants in this dataset ', async () => {
    const mockDataRepoContract: Partial<DataRepoContract> = {
      snapshot: (_snapshotId) =>
        ({
          getSnapshotBuilderCount: () => Promise.resolve({ result: { total: 19 }, sql: '' }),
        } as Partial<DataRepoContract['snapshot']>),
    } as Partial<DataRepoContract> as DataRepoContract;
    asMockedFn(DataRepo).mockImplementation(() => mockDataRepoContract as DataRepoContract);
    // Arrange
    const user = userEvent.setup();
    await initializeValidDatasetRequest(user);
    // Assert
    expect(await screen.findByText('Less than 20 participants in this dataset')).toBeTruthy();
    expect(await screen.findByText('Request this data snapshot')).toBeTruthy();
  });

  it('opens the modal when requesting access to the dataset', async () => {
    const mockDataRepoContract: Partial<DataRepoContract> = {
      snapshot: (_snapshotId) =>
        ({
          getSnapshotBuilderCount: () => Promise.resolve({ result: { total: 19 }, sql: '' }),
        } as Partial<DataRepoContract['snapshot']>),
      snapshotAccessRequest: () =>
        ({
          createSnapshotAccessRequest: mockCreateSnapshotAccessRequest,
        } as Partial<DataRepoContract['snapshotAccessRequest']>),
    } as Partial<DataRepoContract> as DataRepoContract;

    asMockedFn(DataRepo).mockImplementation(() => mockDataRepoContract as DataRepoContract);

    // Arrange
    const user = userEvent.setup();
    await initializeValidDatasetRequest(user);
    await user.click(await screen.findByText('Request this data snapshot'));
    // Assert
    expect(await screen.findByText('Access request created in Terra')).toBeTruthy();
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
});
