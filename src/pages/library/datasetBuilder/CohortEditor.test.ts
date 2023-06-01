import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import _ from 'lodash/fp';
import { createCriteriaFromType, renderCriteriaView } from 'src/pages/library/datasetBuilder/CohortEditor';

describe('CohortEditor', () => {
  it('renders unknown criteria', () => {
    const criteria = { bogus: 'criteria' };
    // @ts-ignore
    const { queryByText } = render(renderCriteriaView(_.noop)(criteria));

    expect(queryByText('bogus')).toBeFalsy();
    expect(queryByText('Unknown criteria type')).toBeTruthy();
  });

  it('renders domain criteria', () => {
    const criteria = createCriteriaFromType({ id: 0, category: 'category', values: ['value'] });
    const { getByText } = render(renderCriteriaView(_.noop)(criteria));

    expect(getByText('category', { exact: false })).toBeTruthy();
    expect(getByText('value')).toBeTruthy();
  });

  it('renders list criteria', () => {
    const criteria = createCriteriaFromType({
      id: 0,
      name: 'list',
      dataType: 'list',
      values: [{ id: 0, name: 'value' }],
    });
    const { getByText } = render(renderCriteriaView(_.noop)(criteria));

    expect(getByText('list', { exact: false })).toBeTruthy();
    expect(getByText('value')).toBeTruthy();
  });

  it('renders range criteria', () => {
    const criteria = createCriteriaFromType({ id: 0, name: 'range', dataType: 'range', min: 55, max: 99 });
    const { getByText } = render(renderCriteriaView(_.noop)(criteria));

    expect(getByText('range', { exact: false })).toBeTruthy();
    expect(getByText('55', { exact: false })).toBeTruthy();
    expect(getByText('99', { exact: false })).toBeTruthy();
  });

  it('can delete criteria', async () => {
    const criteria = createCriteriaFromType({ id: 0, name: 'range', dataType: 'range', min: 55, max: 99 });
    const deleteCriteria = jest.fn();
    const { getByText, getByLabelText } = render(renderCriteriaView(deleteCriteria)(criteria));
    const user = userEvent.setup();

    expect(getByText('range', { exact: false })).toBeTruthy();
    await user.click(getByLabelText('delete criteria'));
    expect(deleteCriteria).toHaveBeenCalled();
  });
});
