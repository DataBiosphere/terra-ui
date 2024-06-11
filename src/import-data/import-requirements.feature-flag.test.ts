import { genericPfbImportRequest } from './__fixtures__/import-request-fixtures';
import { getRequiredCloudPlatform } from './import-requirements';
import { ImportRequest } from './import-types';

type FeaturePreviewExports = typeof import('src/libs/feature-previews');

jest.mock(
  'src/libs/feature-previews',
  (): FeaturePreviewExports => ({
    ...jest.requireActual('src/libs/feature-previews'),
    isFeaturePreviewEnabled: jest.fn().mockReturnValue(true),
  })
);

// Note that behavior of getRequiredCloudPlatform when the feature flag is set to false is tested
// in import-utils.test.ts. This file only tests behavior when the feature flag is set to true.
// Since `jest.mock` is global for any given file, the test below is given this new file.
describe('getRequiredCloudPlatform', () => {
  it('should respect the feature flag for PFB imports', async () => {
    // Arrange
    const importRequest: ImportRequest = genericPfbImportRequest;

    // Act
    const requiredCloudPlatform = getRequiredCloudPlatform(importRequest);

    // Assert
    expect(requiredCloudPlatform).toBeUndefined();
  });
});
