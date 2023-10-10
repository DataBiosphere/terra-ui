import { referenceMetadata } from './reference-metadata';
import references from './references';

describe('reference metadata', () => {
  it('has metadata for every reference', () => {
    // Act
    const allReferences = Object.keys(references);
    const referencesWithMetadata = Object.keys(referenceMetadata);

    // Assert
    expect(referencesWithMetadata).toEqual(expect.arrayContaining(allReferences));
  });
});
