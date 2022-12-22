import { getEnabledBrand, isBrand } from 'src/libs/brand-utils'
import { brands } from 'src/libs/brands'


describe('brand-utils', () => {
  let location

  beforeAll(() => {
    location = window.location
    delete window.location
  })

  afterAll(() => {
    window.location = location
  })

  it('isBrand() returns true if hostname matches brand', () => {
    // Arrange
    window.location = new URL('https://testbrand.terra.bio/path/to/page')

    // Act
    const isTestBrand = isBrand({ hostName: 'testbrand.terra.bio' })

    // Assert
    expect(isTestBrand).toBe(true)
  })

  it('isBrand() returns false if hostname does not match brand', () => {
    // Arrange
    window.location = new URL('https://app.terra.bio/path/to/page')

    // Act
    const isTestBrand = isBrand({ hostName: 'testbrand.terra.bio' })

    // Assert
    expect(isTestBrand).toBe(false)
  })

  it.each([
    ['dev'],
    ['alpha'],
    ['staging']
  ])('isBrand() returns true if hostname matches %s subdomain of brand hostname', tier => {
    // Arrange
    window.location = new URL(`https://${tier}.testbrand.terra.bio/path/to/page`)

    // Act
    const isTestBrand = isBrand({ hostName: 'testbrand.terra.bio' })

    // Assert
    expect(isTestBrand).toBe(true)
  })

  it('getEnabledBrand() returns forced brand when a valid one is set', () => {
    // Arrange
    window.configOverridesStore.set({ brand: 'rareX' })

    // Act
    const enabledBrand = getEnabledBrand()

    // Assert
    expect(enabledBrand).toBe(brands.rareX)
  })

  // it('getEnabledBrand() returns forced brand when a valid one is set', () => {
  //   // Arrange
  //
  //   // Act
  //
  //   // Assert
  // })
})
