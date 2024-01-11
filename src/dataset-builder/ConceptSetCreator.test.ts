import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { h } from 'react-hyperscript-helpers';
import { renderWithAppContexts as render } from 'src/testing/test-utils';

import { ConceptSetCreator, toConceptSet } from './ConceptSetCreator';
import { homepageState } from './dataset-builder-types';
import { dummyDatasetModel } from './TestConstants';

jest.mock('src/libs/ajax/GoogleStorage');

describe('ConceptSetCreator', () => {
  const dataset = dummyDatasetModel();

  const renderConceptSetCreator = () => {
    const conceptSetUpdater = jest.fn();
    const onStateChange = jest.fn();
    render(
      h(ConceptSetCreator, {
        dataset,
        onStateChange,
        conceptSetUpdater,
      })
    );
    return { conceptSetUpdater, onStateChange };
  };

  it('renders the domain criteria selector', async () => {
    // Arrange
    renderConceptSetCreator();
    // Assert
    expect(await screen.findByText(dataset!.snapshotBuilderSettings!.domainOptions[0].root.name)).toBeTruthy();
  });

  it('updates the builder concept sets on save', async () => {
    // Arrange
    const { conceptSetUpdater, onStateChange } = renderConceptSetCreator();
    // Act
    const user = userEvent.setup();
    // There are three Add buttons, click the first one.
    await user.click(screen.getAllByLabelText('add')[0]);
    await user.click(screen.getByText('Add to concept sets'));
    // Assert
    expect(onStateChange).toHaveBeenCalledWith(homepageState.new());
    expect(conceptSetUpdater.mock.calls[0][0]([])).toEqual([
      toConceptSet(dataset!.snapshotBuilderSettings!.domainOptions[0].root),
    ]);
  });

  it('returns to the home page on cancel', async () => {
    // Arrange
    const { conceptSetUpdater, onStateChange } = renderConceptSetCreator();
    // Act
    const user = userEvent.setup();
    await user.click(screen.getByLabelText('cancel'));
    // Assert
    expect(onStateChange).toHaveBeenCalledWith(homepageState.new());
    expect(conceptSetUpdater).not.toHaveBeenCalled();
  });
});
