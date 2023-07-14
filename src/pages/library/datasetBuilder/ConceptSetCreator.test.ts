import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { h } from 'react-hyperscript-helpers';
import { dummyDatasetDetails } from 'src/libs/ajax/DatasetBuilder';
import { ConceptSetCreator, toConceptSet } from 'src/pages/library/datasetBuilder/ConceptSetCreator';
import { homepageState } from 'src/pages/library/datasetBuilder/dataset-builder-types';
import { datasetBuilderConceptSets } from 'src/pages/library/datasetBuilder/state';

describe('ConceptSetCreator', () => {
  const datasetDetails = dummyDatasetDetails('0');

  it('renders the domain criteria selector', () => {
    // Arrange
    render(h(ConceptSetCreator, { datasetDetails, onStateChange: jest.fn() }));
    // Assert
    expect(screen.findByText(datasetDetails.domainOptions[0].root.name)).toBeTruthy();
  });

  it('updates the builder concept sets on save', async () => {
    // Arrange
    datasetBuilderConceptSets.set([]);
    const onStateChange = jest.fn();
    render(h(ConceptSetCreator, { datasetDetails, onStateChange }));
    // Act
    const user = userEvent.setup();
    // There are three Add buttons, click the first one.
    await user.click(screen.getAllByLabelText('add')[0]);
    await user.click(screen.getByText('Add to concept sets'));
    // Assert
    expect(onStateChange).toHaveBeenCalledWith(homepageState.new());
    expect(datasetBuilderConceptSets.get()).toEqual([toConceptSet(datasetDetails.domainOptions[0].root)]);
  });

  it('returns to the home page on cancel', async () => {
    datasetBuilderConceptSets.set([]);
    const onStateChange = jest.fn();
    render(h(ConceptSetCreator, { datasetDetails, onStateChange }));
    // Act
    const user = userEvent.setup();
    await user.click(screen.getByLabelText('cancel'));
    // Assert
    expect(onStateChange).toHaveBeenCalledWith(homepageState.new());
    expect(datasetBuilderConceptSets.get()).toEqual([]);
  });
});
