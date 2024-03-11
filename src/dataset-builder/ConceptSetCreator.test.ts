import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { h } from 'react-hyperscript-helpers';
import { SnapshotBuilderConcept } from 'src/libs/ajax/DataRepo';
import { renderWithAppContexts as render } from 'src/testing/test-utils';

import { ConceptSetCreator, toConceptSet } from './ConceptSetCreator';
import { homepageState } from './dataset-builder-types';
import { dummyDatasetModel } from './TestConstants';

jest.mock('src/libs/ajax/GoogleStorage');

describe('ConceptSetCreator', () => {
  const dataset = dummyDatasetModel();

  const renderConceptSetCreator = (cart: SnapshotBuilderConcept[]) => {
    const conceptSetUpdater = jest.fn();
    const onStateChange = jest.fn();
    render(
      h(ConceptSetCreator, {
        dataset,
        onStateChange,
        conceptSetUpdater,
        cart,
      })
    );
    return { conceptSetUpdater, onStateChange };
  };

  const rootConcept = dataset!.snapshotBuilderSettings!.domainOptions[0].root;

  it('renders the concept set selector', async () => {
    // Arrange
    renderConceptSetCreator([]);
    // Assert
    expect(await screen.findByText(rootConcept.name)).toBeTruthy();
  });

  it('renders the concept set selector with an item in the cart', async () => {
    // Arrange
    renderConceptSetCreator([rootConcept]);
    // Assert
    expect(screen.queryByText('1 concept', { exact: false })).toBeTruthy();
  });

  it('updates the builder concept sets on save', async () => {
    // Arrange
    const { conceptSetUpdater, onStateChange } = renderConceptSetCreator([]);
    // rootConcept will be modified in ConceptSetCreator, hasChildren: true -> false
    const rootConceptNoChildren = { ...rootConcept, hasChildren: false };
    // Act
    const user = userEvent.setup();
    // Click the add button for the root concept.
    await user.click(screen.getByLabelText(`add ${rootConceptNoChildren.id}`));
    await user.click(screen.getByText('Add to concept sets'));
    // Assert
    expect(onStateChange).toHaveBeenCalledWith(homepageState.new());
    expect(conceptSetUpdater.mock.calls[0][0]([])).toEqual([toConceptSet(rootConceptNoChildren)]);
  });

  it('returns to the home page on cancel', async () => {
    // Arrange
    const { conceptSetUpdater, onStateChange } = renderConceptSetCreator([]);
    // Act
    const user = userEvent.setup();
    await user.click(screen.getByLabelText('cancel'));
    // Assert
    expect(onStateChange).toHaveBeenCalledWith(homepageState.new());
    expect(conceptSetUpdater).not.toHaveBeenCalled();
  });
});
