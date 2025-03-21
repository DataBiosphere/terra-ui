import { getBuildTimestamp, isAxeEnabled } from 'src/libs/config';
import { AppConfigSettings, loadedConfigStore } from 'src/libs/startup/configStore';
import { asMockedFn, partial } from 'src/testing/test-utils';

jest.mock('src/libs/startup/configStore');

describe('getBuildTimestamp', () => {
  it('gets number timestamp', () => {
    // Arrange
    asMockedFn(loadedConfigStore).mockReturnValue(partial<AppConfigSettings>({ buildTimestamp: 123456789 }));

    // Act
    const stamp = getBuildTimestamp();

    // Assert
    expect(stamp).toEqual(123456789);
  });
  it('gets string timestamp', () => {
    // Arrange
    asMockedFn(loadedConfigStore).mockReturnValue(partial<AppConfigSettings>({ buildTimestamp: '123456789' }));

    // Act
    const stamp = getBuildTimestamp();

    // Assert
    expect(stamp).toEqual(123456789);
  });
});

describe('isAxeEnabled', () => {
  let env;

  beforeEach(() => {
    env = process.env.NODE_ENV;

    // isAxeEnabled logs a notice and instructions for developers.
    // Those should not be shown in test output.
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterAll(() => {
    process.env.NODE_ENV = env;
  });

  interface AxeEnabledTestCase {
    testEnv: string;
    configEnabled: boolean | undefined;
    enabled: boolean;
  }
  const testCases: AxeEnabledTestCase[] = [
    { testEnv: 'development', configEnabled: undefined, enabled: true },
    { testEnv: 'development', configEnabled: true, enabled: true },
    { testEnv: 'development', configEnabled: false, enabled: false },
    { testEnv: 'production', configEnabled: undefined, enabled: false },
    { testEnv: 'production', configEnabled: true, enabled: false },
    { testEnv: 'production', configEnabled: false, enabled: false },
  ];

  it.each(testCases)(
    'returns $enabled in env "$testEnv" if feature flag is $configEnabled',
    ({ testEnv, configEnabled, enabled }) => {
      // Arrange
      process.env.NODE_ENV = testEnv;
      window.configOverridesStore.set({ isAxeEnabled: configEnabled });

      // Assert
      expect(isAxeEnabled()).toBe(enabled);
    }
  );
});
