import { isAxeEnabled } from 'src/libs/config';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

describe('isAxeEnabled', () => {
  let env;

  beforeAll(() => {
    env = process.env.NODE_ENV;

    // isAxeEnabled logs a notice and instructions for developers.
    // Those should not be shown in test output.
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterAll(() => {
    process.env.NODE_ENV = env;
  });

  it.each([
    { testEnv: 'development', configEnabled: undefined, enabled: true },
    { testEnv: 'development', configEnabled: true, enabled: true },
    { testEnv: 'development', configEnabled: false, enabled: false },
    { testEnv: 'production', configEnabled: undefined, enabled: false },
    { testEnv: 'production', configEnabled: true, enabled: false },
    { testEnv: 'production', configEnabled: false, enabled: false },
  ])('returns $enabled in env "$testEnv" if feature flag is $configEnabled', ({ testEnv, configEnabled, enabled }) => {
    // Arrange
    process.env.NODE_ENV = testEnv;
    window.configOverridesStore.set({ isAxeEnabled: configEnabled });

    // Assert
    expect(isAxeEnabled()).toBe(enabled);
  });
});
