import { fireEvent, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { KEY_LEFT, KEY_RIGHT } from 'keycode-js';
import _ from 'lodash/fp';
import { h } from 'react-hyperscript-helpers';
import {
  AnyCriteria,
  Cohort,
  CriteriaGroup,
  DomainCriteria,
  ProgramDataListCriteria,
  ProgramDataRangeCriteria,
} from 'src/dataset-builder/DatasetBuilderUtils';
import { DataRepo, DataRepoContract, SnapshotBuilderProgramDataOption } from 'src/libs/ajax/DataRepo';
import { asMockedFn, renderWithAppContexts as render } from 'src/testing/test-utils';

import { CohortEditor, criteriaFromOption, CriteriaGroupView, CriteriaView } from './CohortEditor';
import { domainCriteriaSearchState, homepageState, newCohort, newCriteriaGroup } from './dataset-builder-types';
import { dummyDatasetModel } from './TestConstants';

jest.mock('src/libs/ajax/GoogleStorage');
type DataRepoExports = typeof import('src/libs/ajax/DataRepo');
jest.mock('src/libs/ajax/DataRepo', (): DataRepoExports => {
  return {
    ...jest.requireActual('src/libs/ajax/DataRepo'),
    DataRepo: jest.fn(),
  };
});

describe('CohortEditor', () => {
  type CriteriaViewPropsOverrides = {
    criteria: AnyCriteria;
    deleteCriteria?: (criteria: AnyCriteria) => void;
    updateCriteria?: (criteria: AnyCriteria) => void;
  };

  const mockListStatistics = () => {
    const mockDataRepoContract: Partial<DataRepoContract> = {
      dataset: (_datasetId) =>
        ({
          queryDatasetColumnStatisticsById: () =>
            Promise.resolve({
              kind: 'list',
              name: 'list',
              values: [
                {
                  id: 0,
                  name: 'value 0',
                },
                {
                  id: 1,
                  name: 'value 1',
                },
              ],
            }),
        } as Partial<DataRepoContract['dataset']>),
    } as Partial<DataRepoContract> as DataRepoContract;
    asMockedFn(DataRepo).mockImplementation(() => mockDataRepoContract as DataRepoContract);
  };

  const mockRangeStatistics = (min = 55, max = 99) => {
    const mockDataRepoContract: Partial<DataRepoContract> = {
      dataset: (_datasetId) =>
        ({
          queryDatasetColumnStatisticsById: () =>
            Promise.resolve({
              kind: 'range',
              name: 'range',
              min,
              max,
            }),
        } as Partial<DataRepoContract['dataset']>),
    } as Partial<DataRepoContract> as DataRepoContract;
    asMockedFn(DataRepo).mockImplementation(() => mockDataRepoContract as DataRepoContract);
  };

  const mockOption = (option: SnapshotBuilderProgramDataOption) => {
    switch (option.kind) {
      case 'range':
        mockRangeStatistics();
        break;
      case 'list':
        mockListStatistics();
        break;
      default:
        break;
    }
  };

  const getNextCriteriaIndex = () => 1234;

  const datasetDetails = dummyDatasetModel();
  const renderCriteriaView = (propsOverrides: CriteriaViewPropsOverrides) =>
    render(
      h(CriteriaView, {
        deleteCriteria: _.noop,
        updateCriteria: _.noop,
        key: '1',
        ...propsOverrides,
      })
    );

  it('renders unknown criteria', () => {
    // Arrange
    const criteria = { name: 'bogus', invalid: 'property' };

    // The 'as any' is required to create an invalid criteria for testing purposes.
    renderCriteriaView({ criteria: criteria as any });
    // Assert
    expect(screen.queryByText(criteria.name)).toBeFalsy();
    expect(screen.queryByText('Unknown criteria')).toBeTruthy();
  });

  it('renders domain criteria', () => {
    // Arrange
    const criteria: DomainCriteria = {
      kind: 'domain',
      id: 0,
      conceptId: 0,
      index: 0,
      name: 'test criteria',
      count: 0,
      domainOption: {
        id: 0,
        category: 'test category',
        participantCount: 0,
        conceptCount: 0,
        root: { id: 0, name: 'test concept', count: 0, hasChildren: false },
      },
    };
    renderCriteriaView({ criteria });
    // Assert
    expect(screen.getByText(criteria.domainOption.category, { exact: false })).toBeTruthy();
    expect(screen.getByText(criteria.name)).toBeTruthy();
  });

  it('renders list criteria', async () => {
    // Arrange
    mockListStatistics();
    const criteria = (await criteriaFromOption(datasetDetails.id, 0, {
      id: 0,
      name: 'list',
      kind: 'list',
      tableName: 'table',
      columnName: 'column',
    })) as ProgramDataListCriteria;
    renderCriteriaView({ criteria });

    expect(screen.getByText(criteria.name, { exact: false })).toBeTruthy();
    expect(criteria.values.length).toBe(0);
  });

  it('updates when list updated', async () => {
    // Arrange
    const user = userEvent.setup();
    const updateCriteria = jest.fn();
    mockListStatistics();
    const criteria = (await criteriaFromOption(datasetDetails.id, 0, {
      id: 0,
      name: 'list',
      kind: 'list',
      tableName: 'table',
      columnName: 'column',
    })) as ProgramDataListCriteria;
    criteria.values = [{ id: 0, name: 'value 0' }];
    renderCriteriaView({
      updateCriteria,
      criteria,
    });
    // Act
    await user.click(await screen.findByLabelText('Remove value 0'));
    // Assert
    expect(updateCriteria).toBeCalledWith({ ...criteria, values: [] });
    // Act
    await user.click(screen.getByLabelText('Select one or more list'));
    await user.click((await screen.findAllByText('value 0'))[0]);
    await user.click(screen.getByLabelText('Select one or more list'));
    await user.click((await screen.findAllByText('value 1'))[0]);
    // Assert
    expect(updateCriteria).toBeCalledWith({
      ...criteria,
      values: [
        { id: 0, name: 'value 0' },
        { id: 1, name: 'value 1' },
      ],
    });
  });

  it('renders range criteria', async () => {
    // Arrange
    mockRangeStatistics();
    const criteria = (await criteriaFromOption(datasetDetails.id, 0, {
      id: 0,
      name: 'range',
      kind: 'range',
      tableName: 'table',
      columnName: 'column',
    })) as ProgramDataRangeCriteria;
    renderCriteriaView({
      criteria,
    });
    // Assert
    expect(screen.getByText(criteria.name, { exact: false })).toBeTruthy();
    expect(screen.getByText(criteria.low, { exact: false })).toBeTruthy();
    expect(screen.getByText(criteria.high, { exact: false })).toBeTruthy();
  });

  it('allows number inputs for range criteria', async () => {
    // Arrange
    const user = userEvent.setup();
    mockRangeStatistics();
    const criteria = (await criteriaFromOption(datasetDetails.id, 0, {
      id: 0,
      name: 'range',
      kind: 'range',
      tableName: 'table',
      columnName: 'column',
    })) as ProgramDataRangeCriteria;
    const updateCriteria = jest.fn();
    renderCriteriaView({
      criteria,
      updateCriteria,
    });
    const lowInput = 65;
    const highInput = 75;
    // Act
    await user.clear(screen.getByLabelText(`${criteria.name} low`));
    await user.type(screen.getByLabelText(`${criteria.name} low`), lowInput.toString());
    await user.clear(screen.getByLabelText(`${criteria.name} high`));
    await user.type(screen.getByLabelText(`${criteria.name} high`), highInput.toString());

    // Assert
    expect(updateCriteria).toBeCalledWith({ ...criteria, low: lowInput });
    expect(updateCriteria).toBeCalledWith({ ...criteria, high: highInput });
  });

  it('renders accessible slider handles', async () => {
    // Arrange
    const min = 55;
    const max = 99;
    mockRangeStatistics(min, max);

    const criteria = (await criteriaFromOption(datasetDetails.id, 0, {
      id: 0,
      name: 'range',
      kind: 'range',
      tableName: 'table',
      columnName: 'column',
    })) as ProgramDataRangeCriteria;
    const updateCriteria = jest.fn();
    renderCriteriaView({
      criteria,
      updateCriteria,
    });
    // Act
    // We need to use fireEvent for this because rc-slider uses deprecated KeyboardEvent properties which and keyCode
    fireEvent.keyDown(screen.getByLabelText(`${criteria.name} low slider`), { keyCode: KEY_RIGHT /* Right Arrow */ });
    fireEvent.keyDown(screen.getByLabelText(`${criteria.name} high slider`), { keyCode: KEY_LEFT /* Left Arrow */ });

    // Arrange
    expect(updateCriteria).toBeCalledWith({ ...criteria, low: min + 1 });
    expect(updateCriteria).toBeCalledWith({ ...criteria, high: max - 1 });
  });

  it('can delete criteria', async () => {
    // Arrange
    mockRangeStatistics();
    const criteria = (await criteriaFromOption(datasetDetails.id, 0, {
      id: 0,
      name: 'range',
      kind: 'range',
      tableName: 'table',
      columnName: 'column',
    })) as ProgramDataRangeCriteria;
    const deleteCriteria = jest.fn();

    renderCriteriaView({ deleteCriteria, criteria });
    const user = userEvent.setup();
    // Act
    expect(screen.getByText('range', { exact: false })).toBeTruthy();
    await user.click(screen.getByLabelText('delete criteria'));
    // Assert
    expect(deleteCriteria).toBeCalledWith(criteria);
  });

  function showCriteriaGroup(initializeGroup: ((criteriaGroup: CriteriaGroup) => void) | undefined = undefined) {
    const cohort = newCohort('cohort');
    const criteriaGroup = newCriteriaGroup();
    if (initializeGroup) {
      initializeGroup(criteriaGroup);
    }
    cohort.criteriaGroups.push(criteriaGroup);
    const updateCohort = jest.fn();
    render(
      h(CriteriaGroupView, {
        index: 0,
        criteriaGroup,
        updateCohort,
        cohort,
        dataset: datasetDetails,
        onStateChange: _.noop,
        getNextCriteriaIndex,
      })
    );
    return { cohort, updateCohort };
  }

  it('renders criteria group', () => {
    // Arrange
    const { cohort } = showCriteriaGroup((criteriaGroup) => {
      criteriaGroup.meetAll = false;
      criteriaGroup.mustMeet = false;
      criteriaGroup.count = 1234;
    });
    // Assert
    expect(screen.getByText('Must not')).toBeTruthy();
    expect(screen.getByText('any')).toBeTruthy();
    const criteriaGroup = cohort.criteriaGroups[0];
    expect(screen.getByText(`${criteriaGroup.count}`, { exact: false })).toBeTruthy();
    expect(screen.getByText(criteriaGroup.name)).toBeTruthy();
  });

  it('can delete criteria group', async () => {
    // Arrange
    const { cohort, updateCohort } = showCriteriaGroup();
    const user = userEvent.setup();
    // Act
    await user.click(screen.getByLabelText('delete group'));
    // Assert
    expect(updateCohort).toHaveBeenCalled();
    expect(updateCohort.mock.calls[0][0](cohort)).toStrictEqual(newCohort('cohort'));
  });

  it('can modify criteria group', async () => {
    // Arrange
    const { cohort, updateCohort } = showCriteriaGroup((criteriaGroup) => {
      criteriaGroup.meetAll = false;
      criteriaGroup.mustMeet = false;
    });
    const user = userEvent.setup();
    // Act
    await user.click(screen.getByLabelText('must or must not meet'));
    const mustItem = screen.getByText('Must');
    await user.click(mustItem);
    // Assert
    expect(updateCohort).toHaveBeenCalled();
    const updatedCohort: Cohort = updateCohort.mock.calls[0][0](cohort);
    expect(updatedCohort.criteriaGroups[0].mustMeet).toBeTruthy();
    // Act
    await user.click(screen.getByLabelText('all or any'));
    const allItem = screen.getByText('all');
    await user.click(allItem);
    // Assert
    expect(updateCohort).toHaveBeenCalled();
    const updatedCohort2: Cohort = updateCohort.mock.calls[1][0](cohort);
    expect(updatedCohort2.criteriaGroups[0].meetAll).toBeTruthy();
  });

  it('can add new criteria to criteria group', async () => {
    // Arrange
    const { cohort, updateCohort } = showCriteriaGroup();
    const user = userEvent.setup();

    // Act
    await user.click(screen.getByLabelText('Add criteria'));
    const option = datasetDetails!.snapshotBuilderSettings!.programDataOptions[0];
    mockOption(option);
    const dataOptionMenuItem = screen.getByText(option.name);
    await user.click(dataOptionMenuItem);
    // Assert
    expect(updateCohort).toHaveBeenCalledTimes(2);

    const updatedCohortWithLoading: Cohort = updateCohort.mock.calls[0][0](cohort);
    expect(updatedCohortWithLoading.criteriaGroups[0].criteria).toMatchObject([
      { loading: true, index: getNextCriteriaIndex() },
    ]);

    const updatedCohort: Cohort = updateCohort.mock.calls[1][0](updatedCohortWithLoading);
    // Remove ID since it won't match up.
    const { index: _, ...expectedCriteria } = await criteriaFromOption(datasetDetails.id, 2, option);
    expect(updatedCohort.criteriaGroups[0].criteria).toMatchObject([expectedCriteria]);
  });

  it('can delete criteria from the criteria group', async () => {
    // Arrange
    const option = datasetDetails!.snapshotBuilderSettings!.programDataOptions[0];
    mockOption(option);
    const criteria = await criteriaFromOption(datasetDetails.id, 0, option);
    const { cohort, updateCohort } = showCriteriaGroup((criteriaGroup) => criteriaGroup.criteria.push(criteria));
    const user = userEvent.setup();
    // Act
    await user.click(screen.getByLabelText('delete criteria'));
    // Assert
    expect(updateCohort).toHaveBeenCalled();
    const updatedCohort: Cohort = updateCohort.mock.calls[0][0](cohort);
    expect(updatedCohort.criteriaGroups[0].criteria).toMatchObject([]);
  });

  function showCohortEditor(originalCohort = newCohort('my cohort name')) {
    const onStateChange = jest.fn();
    const updateCohorts = jest.fn();

    render(
      h(CohortEditor, {
        onStateChange,
        dataset: datasetDetails,
        originalCohort,
        updateCohorts,
        getNextCriteriaIndex,
      })
    );
    return { originalCohort, onStateChange, updateCohorts };
  }

  it('renders a cohort', () => {
    // Arrange
    const { originalCohort } = showCohortEditor();
    // Assert
    expect(screen.getByText(originalCohort.name)).toBeTruthy();
  });

  it('saves a cohort', async () => {
    // Arrange
    const { originalCohort, onStateChange, updateCohorts } = showCohortEditor();
    const user = userEvent.setup();
    // Act
    await user.click(screen.getByText('Save cohort'));
    // Assert
    expect(onStateChange).toBeCalledWith(homepageState.new());
    expect(updateCohorts.mock.calls[0][0]([])).toStrictEqual([originalCohort]);
  });

  it('disables save while a criteria is loading', async () => {
    // Arrange
    const criteriaGroup = newCriteriaGroup();
    criteriaGroup.criteria.push({ loading: true, index: 0 });
    const cohort = newCohort('test');
    cohort.criteriaGroups.push(criteriaGroup);
    showCohortEditor(cohort);
    // Assert
    expect(screen.getByText('Save cohort')).toHaveAttribute('disabled');
  });

  it('cancels editing a cohort', async () => {
    // Arrange
    const { onStateChange, updateCohorts } = showCohortEditor();
    const user = userEvent.setup();
    // Act
    await user.click(screen.getByLabelText('cancel'));
    // Assert
    expect(onStateChange).toBeCalledWith(homepageState.new());
    expect(updateCohorts).not.toHaveBeenCalled();
  });

  it('can add a criteria group', async () => {
    // Arrange
    const { originalCohort, updateCohorts } = showCohortEditor();
    const user = userEvent.setup();
    // Act
    await user.click(screen.getByText('Add group'));
    await user.click(screen.getByText('Save cohort'));
    // Assert
    // Don't compare name since it's generated.
    const { name: _unused, ...expectedCriteriaGroup } = newCriteriaGroup();
    expect(updateCohorts.mock.calls[0][0]([])).toMatchObject([
      { ...originalCohort, criteriaGroups: [expectedCriteriaGroup] },
    ]);
  });

  it('shows the domain criteria search', async () => {
    // Arrange
    const { onStateChange } = showCohortEditor();
    const user = userEvent.setup();
    // Act
    await user.click(screen.getByText('Add group'));
    await user.click(screen.getByLabelText('Add criteria'));
    const domainOption = datasetDetails!.snapshotBuilderSettings!.domainOptions[0];
    const domainMenuItem = screen.getByText(domainOption.category);
    await user.click(domainMenuItem);
    // Assert
    expect(onStateChange).toBeCalledWith(
      domainCriteriaSearchState.new(expect.anything(), expect.anything(), _.set('kind', 'domain', domainOption), [], '')
    );
  });
});
