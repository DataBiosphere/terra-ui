import { isAxeEnabled } from 'src/libs/config'


describe('isAxeEnabled', () => {
  let env

  beforeAll(() => {
    env = process.env.NODE_ENV
  })

  afterAll(() => {
    process.env.NODE_ENV = env
  })

  it.each([
    { testEnv: 'development', configEnabled: undefined, enabled: true },
    { testEnv: 'development', configEnabled: true, enabled: true },
    { testEnv: 'development', configEnabled: false, enabled: false },
    { testEnv: 'production', configEnabled: undefined, enabled: false },
    { testEnv: 'production', configEnabled: true, enabled: false },
    { testEnv: 'production', configEnabled: false, enabled: false }
  ])('returns $enabled in env "$testEnv" if feature flag is $configEnabled', ({ testEnv, configEnabled, enabled }) => {
    // Arrange
    process.env.NODE_ENV = testEnv
    window.configOverridesStore.set({ isAxeEnabled: configEnabled })

    // Assert
    expect(isAxeEnabled()).toBe(enabled)
  })
})
