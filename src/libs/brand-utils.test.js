import { isBrand } from 'src/libs/brand-utils'


describe('isBrand', () => {
  let location

  beforeAll(() => {
    location = window.location
    delete window.location
  })

  afterAll(() => {
    window.location = location
  })

  it('returns true if hostname matches brand', () => {
    // Arrange
    window.location = new URL('https://testbrand.terra.bio/path/to/page')

    // Act
    const isTestBrand = isBrand({ hostName: 'testbrand.terra.bio' })

    // Assert
    expect(isTestBrand).toBe(true)
  })

  it('returns false if hostname does not match brand', () => {
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
  ])('returns true if hostname matches %s subdomain of brand hostname', tier => {
    // Arrange
    window.location = new URL(`https://${tier}.testbrand.terra.bio/path/to/page`)

    // Act
    const isTestBrand = isBrand({ hostName: 'testbrand.terra.bio' })

    // Assert
    expect(isTestBrand).toBe(true)
  })
})
