import { isTerraNavKey, terraNavKey } from './nav';

describe('isTerraNavKey', () => {
  it('validates good key name', () => {
    // Act
    const result = isTerraNavKey(terraNavKey('workspace-dashboard'));

    // Assert
    expect(result).toBe(true);
  });

  it('invalidates bad key name', () => {
    // Act
    const result = isTerraNavKey('totally-not-a-valid-key');

    // Assert
    expect(result).toBe(false);
  });
});
