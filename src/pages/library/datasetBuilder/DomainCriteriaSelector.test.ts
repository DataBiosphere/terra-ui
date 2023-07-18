import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import _ from 'lodash/fp';
import { h } from 'react-hyperscript-helpers';
import {
  DatasetBuilder,
  DatasetBuilderContract,
  dummyDatasetDetails,
  getConceptForId,
} from 'src/libs/ajax/DatasetBuilder';
import {
  cohortEditorState,
  domainCriteriaSelectorState,
  newCohort,
  newCriteriaGroup,
} from 'src/pages/library/datasetBuilder/dataset-builder-types';
import { DomainCriteriaSelector, toCriteria } from 'src/pages/library/datasetBuilder/DomainCriteriaSelector';
import { asMockedFn } from 'src/testing/test-utils';

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
  const getConceptsMock = (mockDatasetResponse as DatasetBuilderContract).getConcepts;
  const concept = getConceptForId(101);
  const domainOption = dummyDatasetDetails('').domainOptions[0];
  const cohort = newCohort('cohort');
  cohort.criteriaGroups.push(newCriteriaGroup());
  asMockedFn(getConceptsMock).mockResolvedValue({ result: [concept] });
  asMockedFn(DatasetBuilder).mockImplementation(() => mockDatasetResponse as DatasetBuilderContract);
  const state = domainCriteriaSelectorState.new(cohort, cohort.criteriaGroups[0], domainOption);

  it('renders the domain criteria selector', async () => {
    // Arrange
    render(h(DomainCriteriaSelector, { state, onStateChange: jest.fn() }));
    // Assert
    expect(await screen.findByText(state.domainOption.category)).toBeTruthy();
  });

  it('updates the domain group on save', async () => {
    const onStateChange = jest.fn();
    // Arrange
    render(h(DomainCriteriaSelector, { state, onStateChange }));
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
    render(h(DomainCriteriaSelector, { state, onStateChange }));
    // Act
    await screen.findByText(state.domainOption.category);
    const user = userEvent.setup();
    await user.click(screen.getByLabelText('cancel'));
    // Assert
    expect(onStateChange).toHaveBeenCalledWith(cohortEditorState.new(cohort));
  });
});
