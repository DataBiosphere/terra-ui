import { getCurrentLocation } from 'src/libs/nav/location-utils';

/**
 * sets window.location, which is awkward to do in jest because of readonly lockdowns in jsdom
 * @param url
 */
const setLocation = (url: URL | Location) => {
  Object.defineProperty(window, 'location', {
    value: url,
    configurable: true,
  });
};
describe('getCurrentLocation', () => {
  it('gets location form window.location global', () => {
    // Arrange
    const oldLocation = window.location;
    setLocation(new URL('https://hello-world.test/'));

    // Act
    const loc = getCurrentLocation();

    // ASSERT
    expect(loc.href).toBe('https://hello-world.test/');

    // reset global
    setLocation(oldLocation);
  });
});
