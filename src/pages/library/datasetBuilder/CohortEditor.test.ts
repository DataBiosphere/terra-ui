import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import _ from 'lodash/fp';
import { h } from 'react-hyperscript-helpers';
import { dummyDatasetDetails } from 'src/libs/ajax/DatasetBuilder';
import {
  CohortEditor,
  createCriteriaViewComponent,
  criteriaFromOption,
  CriteriaGroupView,
} from 'src/pages/library/datasetBuilder/CohortEditor';
import {
  Cohort,
  CriteriaGroup,
  DomainCriteria,
  homepageState,
  newCohort,
  newCriteriaGroup,
} from 'src/pages/library/datasetBuilder/dataset-builder-types';
import { datasetBuilderCohorts } from 'src/pages/library/datasetBuilder/state';

describe('CohortEditor', () => {
  const datasetDetails = dummyDatasetDetails('unused');

  it('renders unknown criteria', () => {
    // Arrange
    const criteria = { name: 'bogus', invalid: 'property' };

    // The 'as any' is required to create an invalid criteria for testing purposes.
    render(createCriteriaViewComponent(_.noop)(criteria as any));
    // Assert
    expect(screen.queryByText(criteria.name)).toBeFalsy();
    expect(screen.queryByText('Unknown criteria')).toBeTruthy();
  });

  it('renders domain criteria', () => {
    // Arrange
    const criteria: DomainCriteria = {
      kind: 'domain',
      id: 0,
      name: 'test criteria',
      count: 0,
      domainOption: {
        kind: 'domain',
        id: 0,
        category: 'test category',
        participantCount: 0,
        conceptCount: 0,
        root: { id: 0, name: 'test concept', count: 0, isLeaf: true },
      },
    };
    render(createCriteriaViewComponent(_.noop)(criteria));
    // Assert
    expect(screen.getByText(criteria.domainOption.category, { exact: false })).toBeTruthy();
    expect(screen.getByText(criteria.name)).toBeTruthy();
  });

  it('renders list criteria', () => {
    // Arrange
    const criteria = criteriaFromOption({
      id: 0,
      name: 'list',
      kind: 'list',
      values: [{ id: 0, name: 'value' }],
    });
    render(createCriteriaViewComponent(_.noop)(criteria));

    expect(screen.getByText(criteria.name, { exact: false })).toBeTruthy();
    expect(screen.getByText(criteria.value.name)).toBeTruthy();
  });

  it('renders range criteria', () => {
    // Arrange
    const criteria = criteriaFromOption({
      id: 0,
      name: 'range',
      kind: 'range',
      min: 55,
      max: 99,
    });
    render(createCriteriaViewComponent(_.noop)(criteria));
    // Assert
    expect(screen.getByText(criteria.name, { exact: false })).toBeTruthy();
    expect(screen.getByText(criteria.low, { exact: false })).toBeTruthy();
    expect(screen.getByText(criteria.high, { exact: false })).toBeTruthy();
  });

  it('can delete criteria', async () => {
    // Arrange
    const criteria = criteriaFromOption({ id: 0, name: 'range', kind: 'range', min: 55, max: 99 });
    const deleteCriteria = jest.fn();

    render(createCriteriaViewComponent(deleteCriteria)(criteria));
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
        datasetDetails,
        onStateChange: _.noop,
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
    await user.click(screen.getByLabelText('add criteria'));
    const option = datasetDetails.programDataOptions[0];
    const domainItem = screen.getByText(option.name);
    await user.click(domainItem);
    // Assert
    expect(updateCohort).toHaveBeenCalled();
    const updatedCohort: Cohort = updateCohort.mock.calls[0][0](cohort);
    // Remove ID since it won't match up.
    const { id: _, ...expectedCriteria } = criteriaFromOption(option);
    expect(updatedCohort.criteriaGroups[0].criteria).toMatchObject([expectedCriteria]);
  });

  it('can delete criteria from the criteria group', async () => {
    // Arrange
    const { cohort, updateCohort } = showCriteriaGroup((criteriaGroup) =>
      criteriaGroup.criteria.push(criteriaFromOption(datasetDetails.programDataOptions[0]))
    );
    const user = userEvent.setup();
    // Act
    await user.click(screen.getByLabelText('delete criteria'));
    // Assert
    expect(updateCohort).toHaveBeenCalled();
    const updatedCohort: Cohort = updateCohort.mock.calls[0][0](cohort);
    expect(updatedCohort.criteriaGroups[0].criteria).toMatchObject([]);
  });

  function showCohortEditor() {
    const originalCohort = newCohort('my cohort name');
    const onStateChange = jest.fn();
    datasetBuilderCohorts.set([]);

    render(h(CohortEditor, { onStateChange, datasetDetails, originalCohort }));
    return { originalCohort, onStateChange };
  }

  it('renders a cohort', () => {
    // Arrange
    const { originalCohort } = showCohortEditor();
    // Assert
    expect(screen.getByText(originalCohort.name)).toBeTruthy();
  });

  it('saves a cohort', async () => {
    // Arrange
    const { originalCohort, onStateChange } = showCohortEditor();
    const user = userEvent.setup();
    // Act
    await user.click(screen.getByText('Save cohort'));
    // Assert
    expect(onStateChange).toBeCalledWith(homepageState.new());
    expect(datasetBuilderCohorts.get()).toStrictEqual([originalCohort]);
  });

  it('cancels editing a cohort', async () => {
    // Arrange
    const { onStateChange } = showCohortEditor();
    const user = userEvent.setup();
    // Act
    await user.click(screen.getByLabelText('cancel'));
    // Assert
    expect(onStateChange).toBeCalledWith(homepageState.new());
    expect(datasetBuilderCohorts.get()).toStrictEqual([]);
  });

  it('can add a criteria group', async () => {
    // Arrange
    const { originalCohort } = showCohortEditor();
    const user = userEvent.setup();
    // Act
    await user.click(screen.getByText('Add group'));
    await user.click(screen.getByText('Save cohort'));
    // Assert
    // Don't compare name since it's generated.
    const { name: _unused, ...expectedCriteriaGroup } = newCriteriaGroup();
    expect(datasetBuilderCohorts.get()).toMatchObject([{ ...originalCohort, criteriaGroups: [expectedCriteriaGroup] }]);
  });
});
