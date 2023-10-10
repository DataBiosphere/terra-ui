import { getReferenceLabel } from './reference-data-utils';

describe('getReferenceLabel', () => {
  it("returns a label that includes the reference's species", () => {
    // Act
    const label = getReferenceLabel('hg38');

    // Assert
    expect(label).toBe('Human: hg38');
  });

  it('fails gracefully for unknown references', () => {
    // Act
    const label = getReferenceLabel('someUnknownReference');

    // Assert
    expect(label).toBe('Unknown: someUnknownReference');
  });
});
