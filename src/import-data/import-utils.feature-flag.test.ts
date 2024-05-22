import { genericPfbImportRequest } from './__fixtures__/import-request-fixtures';
import { ImportRequest } from './import-types';
import { getCloudPlatformRequiredForImport } from './import-utils';

type FeaturePreviewExports = typeof import('src/libs/feature-previews');

jest.mock(
  'src/libs/feature-previews',
  (): FeaturePreviewExports => ({
    ...jest.requireActual('src/libs/feature-previews'),
    isFeaturePreviewEnabled: jest.fn().mockReturnValue(true),
  })
);

// Note that behavior of getRequiredCloudPlatformForImport when the feature flag is set to false is tested
// in import-utils.test.ts. This file only tests behavior when the feature flag is set to true.
// Since `jest.mock` is global for any given file, the test below is given this new file.
describe('getRequiredCloudPlatformForImport', () => {
  it('should respect the feature flag for PFB imports', async () => {
    // Arrange
    const importRequest: ImportRequest = genericPfbImportRequest;

    // Act
    const cloudPlatform = getCloudPlatformRequiredForImport(importRequest);

    // Assert
    expect(cloudPlatform).toBeUndefined();
  });
});
