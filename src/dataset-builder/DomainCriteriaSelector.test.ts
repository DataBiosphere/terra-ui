import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import _ from 'lodash/fp';
import { h } from 'react-hyperscript-helpers';
import { DatasetBuilder, DatasetBuilderContract, getConceptForId } from 'src/libs/ajax/DatasetBuilder';
import { asMockedFn, renderWithAppContexts as render } from 'src/testing/test-utils';

import { cohortEditorState, domainCriteriaSelectorState, newCohort, newCriteriaGroup } from './dataset-builder-types';
import { DomainCriteriaSelector, toCriteria } from './DomainCriteriaSelector';
import { dummyDatasetDetails } from './TestConstants';

type DatasetBuilderExports = typeof import('src/libs/ajax/DatasetBuilder');
jest.mock('src/libs/ajax/DatasetBuilder', (): DatasetBuilderExports => {
  return {
    ...jest.requireActual('src/libs/ajax/DatasetBuilder'),
    DatasetBuilder: jest.fn(),
  };
});

describe('DomainCriteriaSelector', () => {
  const mockDatasetResponse: Partial<DatasetBuilderContract> = {
    getConcepts: jest.fn(),
  };
  const datasetId = '';
  const getConceptsMock = (mockDatasetResponse as DatasetBuilderContract).getConcepts;
  const concept = getConceptForId(101);
  const domainOption = dummyDatasetDetails(datasetId)!.snapshotBuilderSettings!.domainOptions[0];
  const cohort = newCohort('cohort');
  cohort.criteriaGroups.push(newCriteriaGroup());
  asMockedFn(getConceptsMock).mockResolvedValue({ result: [concept] });
  asMockedFn(DatasetBuilder).mockImplementation(() => mockDatasetResponse as DatasetBuilderContract);
  const state = domainCriteriaSelectorState.new(cohort, cohort.criteriaGroups[0], domainOption);

  it('renders the domain criteria selector', async () => {
    // Arrange
    render(h(DomainCriteriaSelector, { state, onStateChange: jest.fn(), datasetId }));
    // Assert
    expect(await screen.findByText(state.domainOption.category)).toBeTruthy();
  });

  it('updates the domain group on save', async () => {
    const onStateChange = jest.fn();
    // Arrange
    render(h(DomainCriteriaSelector, { state, onStateChange, datasetId }));
    // Act
    await screen.findByText(state.domainOption.category);
    const user = userEvent.setup();
    await user.click(screen.getByLabelText('add'));
    await user.click(screen.getByText('Add to group'));
    // Assert
    expect(onStateChange).toHaveBeenCalledWith(
      cohortEditorState.new(
        _.update('criteriaGroups[0].criteria', () => [toCriteria(domainOption)(concept)], state.cohort)
      )
    );
  });

  it('returns to the cohort editor on cancel', async () => {
    const onStateChange = jest.fn();
    // Arrange
    render(h(DomainCriteriaSelector, { state, onStateChange, datasetId }));
    // Act
    await screen.findByText(state.domainOption.category);
    const user = userEvent.setup();
    await user.click(screen.getByLabelText('cancel'));
    // Assert
    expect(onStateChange).toHaveBeenCalledWith(cohortEditorState.new(cohort));
  });
});
