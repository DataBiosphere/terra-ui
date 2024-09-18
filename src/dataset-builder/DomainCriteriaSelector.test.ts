import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import _ from 'lodash/fp';
import { h } from 'react-hyperscript-helpers';
import { mockAutoSizer } from 'src/components/TreeGrid.test';
import { DataRepo, DataRepoContract } from 'src/libs/ajax/DataRepo';
import { asMockedFn, renderWithAppContexts as render } from 'src/testing/test-utils';

import {
  cohortEditorState,
  domainCriteriaSelectorState,
  homepageState,
  newCohort,
  newCriteriaGroup,
} from './dataset-builder-types';
import { DomainCriteriaSelector, toCriteria } from './DomainCriteriaSelector';
import { dummyGetConceptForId, testSnapshotBuilderSettings } from './TestConstants';

jest.mock('src/libs/ajax/GoogleStorage');
type DataRepoExports = typeof import('src/libs/ajax/DataRepo');
jest.mock('src/libs/ajax/DataRepo', (): DataRepoExports => {
  return {
    ...jest.requireActual('src/libs/ajax/DataRepo'),
    DataRepo: jest.fn(),
  };
});

mockAutoSizer();

describe('DomainCriteriaSelector', () => {
  const mockDataRepoContract: Partial<DataRepoContract> = {
    snapshot: (_snapshotId) =>
      ({
        getConceptChildren: () => Promise.resolve({ result: [concept] }),
        getConceptHierarchy: () => Promise.resolve({ result: [{ parentId: concept.id, children }] }),
      } as Partial<DataRepoContract['snapshot']>),
  } as Partial<DataRepoContract> as DataRepoContract;
  const snapshotId = '';
  const concept = dummyGetConceptForId(101);
  const children = [dummyGetConceptForId(102)];
  const domainOption = testSnapshotBuilderSettings().domainOptions[0];
  const cohort = newCohort('cohort');
  cohort.criteriaGroups.push(newCriteriaGroup());
  asMockedFn(DataRepo).mockImplementation(() => mockDataRepoContract as DataRepoContract);
  const state = domainCriteriaSelectorState.new(
    cohort,
    cohort.criteriaGroups[0],
    domainOption,
    [],
    homepageState.new()
  );
  const criteriaIndex = 1234;
  const getNextCriteriaIndex = () => criteriaIndex;

  it('renders the domain criteria selector', async () => {
    // Arrange
    render(h(DomainCriteriaSelector, { state, onStateChange: jest.fn(), snapshotId, getNextCriteriaIndex }));
    // Assert
    expect(await screen.findByText(state.domainOption.name)).toBeTruthy();
  });

  it('renders the domain criteria selector with a hierarchy', async () => {
    // Arrange
    render(
      h(DomainCriteriaSelector, {
        state: { ...state, openedConcept: concept },
        onStateChange: jest.fn(),
        snapshotId,
        getNextCriteriaIndex,
      })
    );
    // Assert
    expect(await screen.findByText(children[0].name)).toBeTruthy();
  });

  it('updates the domain group on save', async () => {
    const onStateChange = jest.fn();
    // Arrange
    render(h(DomainCriteriaSelector, { state, onStateChange, snapshotId, getNextCriteriaIndex }));
    // Act
    await screen.findByText(state.domainOption.name);
    const user = userEvent.setup();
    // add
    await user.click(screen.getByLabelText(`${concept.name}`));
    await user.click(screen.getByText('Add to group'));
    // Assert
    const expectedCriteria = toCriteria(domainOption, getNextCriteriaIndex)(concept);
    expect(onStateChange).toHaveBeenCalledWith(
      cohortEditorState.new(_.update('criteriaGroups[0].criteria', () => [expectedCriteria], state.cohort))
    );
  });

  it('returns to the cancel state on cancel', async () => {
    const onStateChange = jest.fn();
    // Arrange
    render(h(DomainCriteriaSelector, { state, onStateChange, snapshotId, getNextCriteriaIndex }));
    // Act
    await screen.findByText(state.domainOption.name);
    const user = userEvent.setup();
    await user.click(screen.getByLabelText('cancel'));
    // Assert
    expect(onStateChange).toHaveBeenCalledWith(state.cancelState);
  });
});
