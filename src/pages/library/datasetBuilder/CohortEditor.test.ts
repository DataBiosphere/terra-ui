import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import _ from 'lodash/fp';
import { h } from 'react-hyperscript-helpers';
import { dummyDatasetDetails } from 'src/libs/ajax/DatasetBuilder';
import {
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

describe('CohortEditor', () => {
  it('renders unknown criteria', () => {
    const criteria = { name: 'bogus', invalid: 'property' };

    // This is required to create an invalid "criteria" for testing purposes.
    // @ts-ignore
    const { queryByText } = render(renderCriteriaView(_.noop)(criteria));

    expect(queryByText(criteria.name)).toBeFalsy();
    expect(queryByText('Unknown criteria type')).toBeTruthy();
  });

  it('renders domain criteria', () => {
    const criteria = createCriteriaFromType({ id: 0, category: 'category', values: ['value'] }) as DomainCriteria;
    const { getByText } = render(renderCriteriaView(_.noop)(criteria));

    expect(getByText(criteria.domainType.category, { exact: false })).toBeTruthy();
    expect(getByText('value')).toBeTruthy();
  });

  it('renders list criteria', () => {
    const criteria = createCriteriaFromType({
      id: 0,
      name: 'list',
      dataType: 'list',
      values: [{ id: 0, name: 'value' }],
    }) as ProgramDataListCriteria;
    const { getByText } = render(renderCriteriaView(_.noop)(criteria));

    expect(getByText(criteria.name, { exact: false })).toBeTruthy();
    expect(getByText(criteria.value.name)).toBeTruthy();
  });

  it('renders range criteria', () => {
    const criteria = createCriteriaFromType({
      id: 0,
      name: 'range',
      dataType: 'range',
      min: 55,
      max: 99,
    }) as ProgramDataRangeCriteria;
    const { getByText } = render(renderCriteriaView(_.noop)(criteria));

    expect(getByText(criteria.name, { exact: false })).toBeTruthy();
    expect(getByText(criteria.low, { exact: false })).toBeTruthy();
    expect(getByText(criteria.high, { exact: false })).toBeTruthy();
  });

  it('can delete criteria', async () => {
    const criteria = createCriteriaFromType({ id: 0, name: 'range', dataType: 'range', min: 55, max: 99 });
    const deleteCriteria = jest.fn();

    const { getByText, getByLabelText } = render(renderCriteriaView(deleteCriteria)(criteria));
    const user = userEvent.setup();
    expect(getByText('range', { exact: false })).toBeTruthy();
    await user.click(getByLabelText('delete criteria'));

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

    const { getByText } = render(
      h(CriteriaGroupView, { index: 0, criteriaGroup, updateCohort, cohort, datasetDetails })
    );

    expect(getByText('Must not')).toBeTruthy();
    expect(getByText('any')).toBeTruthy();
    expect(getByText(`${criteriaGroup.count}`, { exact: false })).toBeTruthy();
    expect(getByText(criteriaGroup.name)).toBeTruthy();
  });

  it('can delete criteria group', async () => {
    const cohort = newCohort('cohort');
    const datasetDetails = dummyDatasetDetails;
    const criteriaGroup = newCriteriaGroup();
    cohort.criteriaGroups.push(criteriaGroup);
    const updateCohort = jest.fn();
    const { getByLabelText } = render(
      h(CriteriaGroupView, { index: 0, criteriaGroup, updateCohort, cohort, datasetDetails })
    );

    const user = userEvent.setup();
    await user.click(getByLabelText('delete group'));

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
    const { getByText, getByLabelText } = render(
      h(CriteriaGroupView, { index: 0, criteriaGroup, updateCohort, cohort, datasetDetails })
    );
    const user = userEvent.setup();

    await user.click(getByLabelText('must or must not meet'));
    const mustItem = await getByText('Must');
    await user.click(mustItem);

    expect(updateCohort).toHaveBeenCalled();
    const updatedCohort: Cohort = updateCohort.mock.calls[0][0](cohort);
    expect(updatedCohort.criteriaGroups[0].mustMeet).toBeTruthy();

    await user.click(getByLabelText('all or any'));
    const allItem = await getByText('all');
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
    const { getByText, getByLabelText } = render(
      h(CriteriaGroupView, { index: 0, criteriaGroup, updateCohort, cohort, datasetDetails })
    );

    const user = userEvent.setup();
    await user.click(getByLabelText('add criteria'));
    const domainType = datasetDetails.domainTypes[0];
    const domainItem = await getByText(domainType.category);
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
    const { getByLabelText } = render(
      h(CriteriaGroupView, { index: 0, criteriaGroup, updateCohort, cohort, datasetDetails })
    );

    const user = userEvent.setup();
    await user.click(getByLabelText('delete criteria'));

    expect(updateCohort).toHaveBeenCalled();
    const updatedCohort: Cohort = updateCohort.mock.calls[0][0](cohort);
    expect(updatedCohort.criteriaGroups[0].criteria).toMatchObject([]);
  });
});
