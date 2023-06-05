import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import _ from 'lodash/fp';
import { h } from 'react-hyperscript-helpers';
import { dummyDatasetDetails } from 'src/libs/ajax/DatasetBuilder';
import {
  CohortEditor,
  createCriteriaFromType,
  CriteriaGroupView,
  renderCriteriaView,
} from 'src/pages/library/datasetBuilder/CohortEditor';
import {
  Cohort,
  DomainCriteria,
  newCohort,
  newCriteriaGroup,
  ProgramDataListCriteria,
  ProgramDataRangeCriteria,
} from 'src/pages/library/datasetBuilder/dataset-builder-types';
import { HomepageState } from 'src/pages/library/datasetBuilder/DatasetBuilder';
import { datasetBuilderCohorts } from 'src/pages/library/datasetBuilder/state';

describe('CohortEditor', () => {
  it('renders unknown criteria', () => {
    const criteria = { name: 'bogus', invalid: 'property' };

    // This is required to create an invalid "criteria" for testing purposes.
    // @ts-ignore
    render(renderCriteriaView(_.noop)(criteria));

    expect(screen.queryByText(criteria.name)).toBeFalsy();
    expect(screen.queryByText('Unknown criteria type')).toBeTruthy();
  });

  it('renders domain criteria', () => {
    const criteria = createCriteriaFromType({ id: 0, category: 'category', values: ['value'] }) as DomainCriteria;
    render(renderCriteriaView(_.noop)(criteria));

    expect(screen.getByText(criteria.domainType.category, { exact: false })).toBeTruthy();
    expect(screen.getByText('value')).toBeTruthy();
  });

  it('renders list criteria', () => {
    const criteria = createCriteriaFromType({
      id: 0,
      name: 'list',
      dataType: 'list',
      values: [{ id: 0, name: 'value' }],
    }) as ProgramDataListCriteria;
    render(renderCriteriaView(_.noop)(criteria));

    expect(screen.getByText(criteria.name, { exact: false })).toBeTruthy();
    expect(screen.getByText(criteria.value.name)).toBeTruthy();
  });

  it('renders range criteria', () => {
    const criteria = createCriteriaFromType({
      id: 0,
      name: 'range',
      dataType: 'range',
      min: 55,
      max: 99,
    }) as ProgramDataRangeCriteria;
    render(renderCriteriaView(_.noop)(criteria));

    expect(screen.getByText(criteria.name, { exact: false })).toBeTruthy();
    expect(screen.getByText(criteria.low, { exact: false })).toBeTruthy();
    expect(screen.getByText(criteria.high, { exact: false })).toBeTruthy();
  });

  it('can delete criteria', async () => {
    const criteria = createCriteriaFromType({ id: 0, name: 'range', dataType: 'range', min: 55, max: 99 });
    const deleteCriteria = jest.fn();

    render(renderCriteriaView(deleteCriteria)(criteria));
    const user = userEvent.setup();
    expect(screen.getByText('range', { exact: false })).toBeTruthy();
    await user.click(screen.getByLabelText('delete criteria'));

    expect(deleteCriteria).toBeCalledWith(criteria);
  });

  it('renders criteria group', () => {
    const cohort = newCohort('cohort');
    const datasetDetails = dummyDatasetDetails;
    const criteriaGroup = newCriteriaGroup();
    criteriaGroup.meetAll = false;
    criteriaGroup.mustMeet = false;
    criteriaGroup.count = 1234;
    const updateCohort = jest.fn();

    render(h(CriteriaGroupView, { index: 0, criteriaGroup, updateCohort, cohort, datasetDetails }));

    expect(screen.getByText('Must not')).toBeTruthy();
    expect(screen.getByText('any')).toBeTruthy();
    expect(screen.getByText(`${criteriaGroup.count}`, { exact: false })).toBeTruthy();
    expect(screen.getByText(criteriaGroup.name)).toBeTruthy();
  });

  it('can delete criteria group', async () => {
    const cohort = newCohort('cohort');
    const datasetDetails = dummyDatasetDetails;
    const criteriaGroup = newCriteriaGroup();
    cohort.criteriaGroups.push(criteriaGroup);
    const updateCohort = jest.fn();
    render(h(CriteriaGroupView, { index: 0, criteriaGroup, updateCohort, cohort, datasetDetails }));

    const user = userEvent.setup();
    await user.click(screen.getByLabelText('delete group'));

    expect(updateCohort).toHaveBeenCalled();
    expect(updateCohort.mock.calls[0][0](cohort)).toStrictEqual(newCohort('cohort'));
  });

  it('can modify criteria group', async () => {
    const cohort = newCohort('cohort');
    const datasetDetails = dummyDatasetDetails;
    const criteriaGroup = newCriteriaGroup();
    criteriaGroup.meetAll = false;
    criteriaGroup.mustMeet = false;
    cohort.criteriaGroups.push(criteriaGroup);
    const updateCohort = jest.fn();
    render(h(CriteriaGroupView, { index: 0, criteriaGroup, updateCohort, cohort, datasetDetails }));
    const user = userEvent.setup();

    await user.click(screen.getByLabelText('must or must not meet'));
    const mustItem = screen.getByText('Must');
    await user.click(mustItem);

    expect(updateCohort).toHaveBeenCalled();
    const updatedCohort: Cohort = updateCohort.mock.calls[0][0](cohort);
    expect(updatedCohort.criteriaGroups[0].mustMeet).toBeTruthy();

    await user.click(screen.getByLabelText('all or any'));
    const allItem = screen.getByText('all');
    await user.click(allItem);

    expect(updateCohort).toHaveBeenCalled();
    const updatedCohort2: Cohort = updateCohort.mock.calls[1][0](cohort);
    expect(updatedCohort2.criteriaGroups[0].meetAll).toBeTruthy();
  });

  it('can add new criteria to criteria group', async () => {
    const cohort = newCohort('cohort');
    const datasetDetails = dummyDatasetDetails;
    const criteriaGroup = newCriteriaGroup();
    cohort.criteriaGroups.push(criteriaGroup);
    const updateCohort = jest.fn();
    render(h(CriteriaGroupView, { index: 0, criteriaGroup, updateCohort, cohort, datasetDetails }));

    const user = userEvent.setup();
    await user.click(screen.getByLabelText('add criteria'));
    const domainType = datasetDetails.domainTypes[0];
    const domainItem = screen.getByText(domainType.category);
    await user.click(domainItem);

    expect(updateCohort).toHaveBeenCalled();
    const updatedCohort: Cohort = updateCohort.mock.calls[0][0](cohort);
    // Remove ID since it won't match up.
    const { id: _, ...expectedCriteria } = createCriteriaFromType(domainType);
    expect(updatedCohort.criteriaGroups[0].criteria).toMatchObject([expectedCriteria]);
  });

  it('can delete criteria from the criteria group', async () => {
    const cohort = newCohort('cohort');
    const datasetDetails = dummyDatasetDetails;
    const criteriaGroup = newCriteriaGroup();
    criteriaGroup.criteria.push(createCriteriaFromType(datasetDetails.domainTypes[0]));
    cohort.criteriaGroups.push(criteriaGroup);
    const updateCohort = jest.fn();
    render(h(CriteriaGroupView, { index: 0, criteriaGroup, updateCohort, cohort, datasetDetails }));

    const user = userEvent.setup();
    await user.click(screen.getByLabelText('delete criteria'));

    expect(updateCohort).toHaveBeenCalled();
    const updatedCohort: Cohort = updateCohort.mock.calls[0][0](cohort);
    expect(updatedCohort.criteriaGroups[0].criteria).toMatchObject([]);
  });

  it('renders a cohort', () => {
    const datasetDetails = dummyDatasetDetails;
    const originalCohort = newCohort('my cohort name');

    render(h(CohortEditor, { onStateChange: _.noop, datasetDetails, originalCohort }));

    expect(screen.getByText(originalCohort.name)).toBeTruthy();
  });

  it('saves a cohort', async () => {
    const datasetDetails = dummyDatasetDetails;
    const originalCohort = newCohort('my cohort name');
    const onStateChange = jest.fn();
    const user = userEvent.setup();
    datasetBuilderCohorts.set([]);

    render(h(CohortEditor, { onStateChange, datasetDetails, originalCohort }));
    await user.click(screen.getByText('Save cohort'));

    expect(onStateChange).toBeCalledWith(new HomepageState());
    expect(datasetBuilderCohorts.get()).toStrictEqual([originalCohort]);
  });

  it('cancels editing a cohort', async () => {
    const datasetDetails = dummyDatasetDetails;
    const originalCohort = newCohort('my cohort name');
    const onStateChange = jest.fn();
    const user = userEvent.setup();
    datasetBuilderCohorts.set([]);

    render(h(CohortEditor, { onStateChange, datasetDetails, originalCohort }));
    await user.click(screen.getByLabelText('cancel'));

    expect(onStateChange).toBeCalledWith(new HomepageState());
    expect(datasetBuilderCohorts.get()).toStrictEqual([]);
  });

  it('can add a criteria group', async () => {
    const datasetDetails = dummyDatasetDetails;
    const originalCohort = newCohort('my cohort name');
    const user = userEvent.setup();
    datasetBuilderCohorts.set([]);

    render(h(CohortEditor, { onStateChange: _.noop, datasetDetails, originalCohort }));

    await user.click(screen.getByText('Add group'));
    await user.click(screen.getByText('Save cohort'));

    // Don't compare name since it's generated.
    const { name: _unused, ...expectedCriteriaGroup } = newCriteriaGroup();
    expect(datasetBuilderCohorts.get()).toMatchObject([{ ...originalCohort, criteriaGroups: [expectedCriteriaGroup] }]);
  });
});
