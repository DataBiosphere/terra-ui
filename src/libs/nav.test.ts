import { getLink, goToPath, history, isTerraNavKey, terraNavKey } from 'src/libs/nav';

jest.mock('src/libs/state', () => {
  const { compile, pathToRegexp } = jest.requireActual('path-to-regexp');
  const keys: any[] = [];
  const regex = pathToRegexp('/url-version-of-path/:name/:namespace', keys);
  return {
    ...jest.requireActual('src/libs/state'),
    routeHandlersStore: {
      get: jest.fn().mockReturnValue([
        {
          name: 'totally-real-path',
          regex,
          keys: keys.map((key) => key.name),
          makePath: compile('/url-version-of-path/:name/:namespace', { encode: encodeURIComponent }),
        },
      ]),
    },
  };
});

describe('isTerraNavKey', () => {
  it('validates good key name', () => {
    // Act
    const result = isTerraNavKey(terraNavKey('workspace-dashboard'));

    // Assert
    expect(result).toBe(true);
  });

  it('invalidates bad key name', () => {
    // Act
    const result = isTerraNavKey('totally-not-a-valid-key');

    // Assert
    expect(result).toBe(false);
  });
});

describe('goToPath', () => {
  it('does not include query params if not provided', () => {
    // Arrange
    const pathname = '/url-version-of-path/foo/bar';
    const pathRef = 'totally-real-path';
    const push = jest.spyOn(history, 'push');

    // Act
    goToPath(pathRef, { name: 'foo', namespace: 'bar' });

    // Assert
    expect(push).toHaveBeenCalledWith({
      pathname,
    });
  });

  it('includes query params', () => {
    // Arrange
    const pathname = '/url-version-of-path/foo/bar';
    const pathRef = 'totally-real-path';
    const push = jest.spyOn(history, 'push');

    // Act
    goToPath(pathRef, { name: 'foo', namespace: 'bar' }, { red: 'fish', blue: 'fish' });

    // Assert
    expect(push).toHaveBeenCalledWith({
      pathname,
      search: '?red=fish&blue=fish',
    });
  });
});

describe('getLink', () => {
  it('does not include query params if not provided', () => {
    // Arrange
    const pathname = '#url-version-of-path/foo/bar';
    const pathRef = 'totally-real-path';

    // Act
    const link = getLink(pathRef, { name: 'foo', namespace: 'bar' });

    // Assert
    expect(link).toEqual(pathname);
  });

  it('includes query params', () => {
    // Arrange
    const pathname = '#url-version-of-path/foo/bar';
    const pathRef = 'totally-real-path';

    // Act
    const link = getLink(pathRef, { name: 'foo', namespace: 'bar' }, { red: 'fish', blue: 'fish' });

    // Assert
    expect(link).toEqual(`${pathname}?red=fish&blue=fish`);
  });
});
