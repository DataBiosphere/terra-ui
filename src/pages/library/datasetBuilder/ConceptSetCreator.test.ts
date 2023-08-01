import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { h } from 'react-hyperscript-helpers';
import { dummyDatasetDetails } from 'src/libs/ajax/DatasetBuilder';
import { ConceptSetCreator, toConceptSet } from 'src/pages/library/datasetBuilder/ConceptSetCreator';
import { homepageState } from 'src/pages/library/datasetBuilder/dataset-builder-types';

describe('ConceptSetCreator', () => {
  const datasetDetails = dummyDatasetDetails('0');

  const renderConceptSetCreator = () => {
    const conceptSetUpdater = jest.fn();
    const onStateChange = jest.fn();
    render(h(ConceptSetCreator, { datasetDetails, onStateChange, conceptSetUpdater }));
    return { conceptSetUpdater, onStateChange };
  };

  it('renders the domain criteria selector', async () => {
    // Arrange
    renderConceptSetCreator();
    // Assert
    expect(await screen.findByText(datasetDetails.domainOptions[0].root.name)).toBeTruthy();
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
    expect(conceptSetUpdater.mock.calls[0][0]([])).toEqual([toConceptSet(datasetDetails.domainOptions[0].root)]);
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
