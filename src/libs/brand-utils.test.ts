import { getEnabledBrand, isBrand } from 'src/libs/brand-utils';
import { BrandConfiguration, brands, defaultBrand } from 'src/libs/brands';
import { getCurrentUrl } from 'src/libs/nav';
import { configOverridesStore } from 'src/libs/state';
import { asMockedFn } from 'src/testing/test-utils';

type NavExports = typeof import('src/libs/nav');
jest.mock(
  'src/libs/nav',
  (): NavExports => ({
    ...jest.requireActual('src/libs/nav'),
    getCurrentUrl: jest.fn(),
  })
);

describe('brand-utils', () => {
  const testBrand: BrandConfiguration = {
    name: 'Terra Test',
    queryName: 'terra test',
    welcomeHeader: 'Welcome to Terra Unit Tests',
    description: 'This is only a test.',
    hostName: 'testbrand.terra.bio',
    docLinks: [],
    logos: {
      color: '',
      white: '',
    },
    theme: defaultBrand.theme,
  };

  describe('isBrand', () => {
    it('returns true if hostname matches brand', () => {
      // Arrange
      asMockedFn(getCurrentUrl).mockReturnValue(new URL('https://testbrand.terra.bio/path/to/page'));

      // Act
      const isTestBrand = isBrand(testBrand);

      // Assert
      expect(isTestBrand).toBe(true);
    });

    it('returns false if hostname does not match brand', () => {
      // Arrange
      asMockedFn(getCurrentUrl).mockReturnValue(new URL('https://app.terra.bio/path/to/page'));

      // Act
      const isTestBrand = isBrand(testBrand);

      // Assert
      expect(isTestBrand).toBe(false);
    });

    it.each([['dev'], ['alpha'], ['staging']])(
      'returns true if hostname matches %s subdomain of brand hostname',
      (tier) => {
        // Arrange
        asMockedFn(getCurrentUrl).mockReturnValue(new URL(`https://${tier}.testbrand.terra.bio/path/to/page`));

        // Act
        const isTestBrand = isBrand(testBrand);

        // Assert
        expect(isTestBrand).toBe(true);
      }
    );
  });

  describe('getEnabledBrand', () => {
    beforeEach(() => {
      // For invalid brands, getEnabledBrand logs a notice and instructions for developers.
      // Those should not be shown in test output.
      jest.spyOn(console, 'log').mockImplementation(() => {});
      jest.spyOn(console, 'warn').mockImplementation(() => {});
    });

    it('returns forced brand when a valid one is set', () => {
      // Arrange
      configOverridesStore.set({ brand: 'rareX' });

      // Act
      const enabledBrand = getEnabledBrand();

      // Assert
      expect(enabledBrand).toBe(brands.rareX); // preferring vs. 'toEqual' to verify referential equality
    });

    it('returns brand based on hostname when an invalid brand is forced', () => {
      // Arrange
      configOverridesStore.set({ brand: 'invalidBrand' });
      asMockedFn(getCurrentUrl).mockReturnValue(new URL('https://anvil.terra.bio/path/to/page'));

      // Act
      const enabledBrand = getEnabledBrand();

      // Assert
      expect(enabledBrand).toEqual(brands.anvil);
    });

    it('returns default brand when hostname-based brand is invalid', () => {
      // Arrange
      asMockedFn(getCurrentUrl).mockReturnValue(new URL('https://invalid-brand.terra.bio/path/to/page'));

      // Act
      const enabledBrand = getEnabledBrand();

      // Assert
      expect(enabledBrand).toEqual(defaultBrand);
    });
  });
});
