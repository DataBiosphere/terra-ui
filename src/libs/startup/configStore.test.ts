import { partial } from 'src/testing/test-utils';

import { AppConfigSettings, loadedConfigStore, resetConfigStore, setLoadedConfigStore } from './configStore';

// override default mock in setupTests.ts
jest.mock('src/libs/startup/configStore', () => ({
  ...jest.requireActual('src/libs/startup/configStore'),
}));

describe('loadedConfigStore', () => {
  beforeEach(() => {
    resetConfigStore();
  });
  it('loads initial value', () => {
    // Act
    const config = loadedConfigStore();

    // Assert
    expect(config).toEqual(undefined);
  });
  it('loads updated value after config set', () => {
    // Arrange
    const testConfig = partial<AppConfigSettings>({
      brand: 'terra',
    });
    setLoadedConfigStore(testConfig);

    // Act
    const config = loadedConfigStore();

    // Assert
    expect(config).toEqual(testConfig);
  });
});
