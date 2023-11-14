import { ImportRequest } from './import-types';
import { getCloudPlatformRequiredForImport } from './import-utils';

jest.mock('src/libs/feature-previews', () => ({
  ...jest.requireActual('src/libs/feature-previews'),
  isFeaturePreviewEnabled: jest.fn().mockReturnValue(true),
}));

// Note that behavior of getRequiredCloudPlatformForImport when the feature flag is set to false is tested
// in import-utils.test.ts. This file only tests behavior when the feature flag is set to true.
// Since `jest.mock` is global for any given file, the test below is given this new file.
describe('getRequiredCloudPlatformForImport', () => {
  it('should respect the feature flag for PFB imports', async () => {
    // Arrange
    const importRequest: ImportRequest = { type: 'pfb', url: new URL('https://example.com/path/to/file.pfb') };

    // Act
    const cloudPlatform = getCloudPlatformRequiredForImport(importRequest);

    // Assert
    expect(cloudPlatform).toBeUndefined();
  });
});
