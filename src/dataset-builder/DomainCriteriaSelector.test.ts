import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import _ from 'lodash/fp';
import { h } from 'react-hyperscript-helpers';
import { DataRepo, DataRepoContract } from 'src/libs/ajax/DataRepo';
import { asMockedFn, renderWithAppContexts as render } from 'src/testing/test-utils';

import { cohortEditorState, domainCriteriaSelectorState, newCohort, newCriteriaGroup } from './dataset-builder-types';
import { DomainCriteriaSelector, toCriteria } from './DomainCriteriaSelector';
import { dummyDatasetModel, dummyGetConceptForId } from './TestConstants';

jest.mock('src/libs/ajax/GoogleStorage');
type DataRepoExports = typeof import('src/libs/ajax/DataRepo');
jest.mock('src/libs/ajax/DataRepo', (): DataRepoExports => {
  return {
    ...jest.requireActual('src/libs/ajax/DataRepo'),
    DataRepo: jest.fn(),
  };
});

describe('DomainCriteriaSelector', () => {
  const mockDatasetResponse: Partial<DataRepoContract> = {
    dataset: (_datasetId) =>
      ({
        getConcepts: () => Promise.resolve({ result: [concept] }),
      } as Partial<DataRepoContract['dataset']>),
  } as Partial<DataRepoContract> as DataRepoContract;
  const datasetId = '';
  const concept = dummyGetConceptForId(101);
  const domainOption = dummyDatasetModel()!.snapshotBuilderSettings!.domainOptions[0];
  const cohort = newCohort('cohort');
  cohort.criteriaGroups.push(newCriteriaGroup());
  asMockedFn(DataRepo).mockImplementation(() => mockDatasetResponse as DataRepoContract);
  const state = domainCriteriaSelectorState.new(cohort, cohort.criteriaGroups[0], domainOption);
  const criteriaIndex = 1234;
  const getNextCriteriaIndex = () => criteriaIndex;

  it('renders the domain criteria selector', async () => {
    // Arrange
    render(h(DomainCriteriaSelector, { state, onStateChange: jest.fn(), datasetId, getNextCriteriaIndex }));
    // Assert
    expect(await screen.findByText(state.domainOption.category)).toBeTruthy();
  });

  it('updates the domain group on save', async () => {
    const onStateChange = jest.fn();
    // Arrange
    render(h(DomainCriteriaSelector, { state, onStateChange, datasetId, getNextCriteriaIndex }));
    // Act
    await screen.findByText(state.domainOption.category);
    const user = userEvent.setup();
    await user.click(screen.getByLabelText('add'));
    await user.click(screen.getByText('Add to group'));
    // Assert
    const expectedCriteria = toCriteria(domainOption, getNextCriteriaIndex)(concept);
    expect(onStateChange).toHaveBeenCalledWith(
      cohortEditorState.new(_.update('criteriaGroups[0].criteria', () => [expectedCriteria], state.cohort))
    );
  });

  it('returns to the cohort editor on cancel', async () => {
    const onStateChange = jest.fn();
    // Arrange
    render(h(DomainCriteriaSelector, { state, onStateChange, datasetId, getNextCriteriaIndex }));
    // Act
    await screen.findByText(state.domainOption.category);
    const user = userEvent.setup();
    await user.click(screen.getByLabelText('cancel'));
    // Assert
    expect(onStateChange).toHaveBeenCalledWith(cohortEditorState.new(cohort));
  });
});
