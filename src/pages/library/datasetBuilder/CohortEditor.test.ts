import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import _ from 'lodash/fp';
import { h } from 'react-hyperscript-helpers';
import { AnyCriteria, Cohort, CriteriaGroup, DomainCriteria, dummyDatasetDetails } from 'src/libs/ajax/DatasetBuilder';
import {
  CohortEditor,
  criteriaFromOption,
  CriteriaGroupView,
  CriteriaView,
} from 'src/pages/library/datasetBuilder/CohortEditor';
import {
  domainCriteriaSelectorState,
  homepageState,
  newCohort,
  newCriteriaGroup,
} from 'src/pages/library/datasetBuilder/dataset-builder-types';

describe('CohortEditor', () => {
  type CriteriaViewPropsOverrides = {
    criteria: AnyCriteria;
    deleteCriteria?: (criteria: AnyCriteria) => void;
    updateCriteria?: (criteria: AnyCriteria) => void;
  };

  const datasetDetails = dummyDatasetDetails('unused');
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
      name: 'test criteria',
      count: 0,
      domainOption: {
        kind: 'domain',
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

  it('renders list criteria', () => {
    // Arrange
    const criteria = criteriaFromOption({
      id: 0,
      name: 'list',
      kind: 'list',
      values: [{ id: 0, name: 'value' }],
    });
    renderCriteriaView({ criteria });

    expect(screen.getByText(criteria.name, { exact: false })).toBeTruthy();
    expect(screen.getByText(criteria.values[0].name)).toBeTruthy();
  });

  it('updates when list updated', async () => {
    // Arrange
    const user = userEvent.setup();
    const updateCriteria = jest.fn();
    const criteria = criteriaFromOption({
      id: 0,
      name: 'list',
      kind: 'list',
      values: [
        { id: 0, name: 'value0' },
        { id: 1, name: 'value1' },
      ],
    });
    renderCriteriaView({
      updateCriteria,
      criteria,
    });
    // Act
    await user.click(await screen.findByLabelText('Remove value0'));
    // Assert
    expect(updateCriteria).toBeCalledWith({ ...criteria, values: [] });
    // Act
    await user.click(screen.getByLabelText('Select one or more list'));
    await user.click((await screen.findAllByText('value0'))[0]);
    await user.click(screen.getByLabelText('Select one or more list'));
    await user.click((await screen.findAllByText('value1'))[0]);
    // Assert
    expect(updateCriteria).toBeCalledWith({
      ...criteria,
      values: [
        { id: 0, name: 'value0' },
        { id: 1, name: 'value1' },
      ],
    });
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
    const criteria = criteriaFromOption({
      id: 0,
      name: 'range',
      kind: 'range',
      min: 55,
      max: 99,
    });
    const updateCriteria = jest.fn();
    renderCriteriaView({
      criteria,
      updateCriteria,
    });
    // Act
    await user.clear(screen.getByLabelText(`${criteria.name} low`));
    await user.type(screen.getByLabelText(`${criteria.name} low`), '65');
    await user.clear(screen.getByLabelText(`${criteria.name} high`));
    await user.type(screen.getByLabelText(`${criteria.name} high`), '75');

    // Assert
    expect(updateCriteria).toBeCalledWith({ ...criteria, low: 65 });
    expect(updateCriteria).toBeCalledWith({ ...criteria, high: 75 });
  });

  it('can delete criteria', async () => {
    // Arrange
    const criteria = criteriaFromOption({ id: 0, name: 'range', kind: 'range', min: 55, max: 99 });
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
    await user.click(screen.getByLabelText('Add criteria'));
    const option = datasetDetails.programDataOptions[0];
    const dataOptionMenuItem = screen.getByText(option.name);
    await user.click(dataOptionMenuItem);
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
    const updateCohorts = jest.fn();

    render(h(CohortEditor, { onStateChange, datasetDetails, originalCohort, updateCohorts }));
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

  it('shows the domain criteria selector', async () => {
    // Arrange
    const { onStateChange } = showCohortEditor();
    const user = userEvent.setup();
    // Act
    await user.click(screen.getByText('Add group'));
    await user.click(screen.getByLabelText('Add criteria'));
    const domainOption = datasetDetails.domainOptions[0];
    const domainMenuItem = screen.getByText(domainOption.category);
    await user.click(domainMenuItem);
    // Assert
    expect(onStateChange).toBeCalledWith(
      domainCriteriaSelectorState.new(expect.anything(), expect.anything(), domainOption)
    );
  });
});
