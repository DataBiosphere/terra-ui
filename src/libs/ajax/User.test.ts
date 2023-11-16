import { kvArrayToObject } from './User';

// Workaround for circular import issues.
jest.mock('src/auth/auth');

describe('kvArrayToObject', () => {
  it('converts an array of key/value objects to an object', () => {
    // Act
    const result = kvArrayToObject([
      { key: 'foo', value: 1 },
      { key: 'bar', value: 2 },
      { key: 'baz', value: 3 },
    ]);

    // Assert
    expect(result).toEqual({
      foo: 1,
      bar: 2,
      baz: 3,
    });
  });

  it('handles empty arrays', () => {
    // Act
    const result = kvArrayToObject([]);

    // Assert
    expect(result).toEqual({});
  });

  it('handles undefined input', () => {
    // Act
    const result = kvArrayToObject(undefined);

    // Assert
    expect(result).toEqual({});
  });
});
