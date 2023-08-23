import { cond, DEFAULT, switchCase } from './logic-utils';

describe('cond', () => {
  it('returns result of value factory for first case where condition is true', () => {
    // Act
    const result = cond([false, () => 'a'], [true, () => 'b'], [true, () => 'c']);

    // Assert
    expect(result).toBe('b');
  });

  it("returns result of default value factory if one is provided and no case's condition is true", () => {
    // Act
    const result = cond([false, () => 'a'], [false, () => 'b'], [false, () => 'c'], () => 'z');

    // Assert
    expect(result).toBe('z');
  });

  it("returns undefined if no case's condition is true and no default value factory is provided", () => {
    // Act
    const result = cond([false, () => 'a'], [false, () => 'b'], [false, () => 'c']);

    // Assert
    expect(result).toBe(undefined);
  });

  describe('with values instead of factories', () => {
    it('returns value for first case where condition is true', () => {
      // Act
      const result = cond([false, 'a'], [true, 'b'], [true, 'c']);

      // Assert
      expect(result).toBe('b');
    });

    it("returns default value if one is provided and no case's condition is true", () => {
      // Act
      const result = cond([false, 'a'], [false, 'b'], [false, 'c'], 'z');

      // Assert
      expect(result).toBe('z');
    });

    it("returns undefined if no case's condition is true and no default value", () => {
      // Act
      const result = cond([false, 'a'], [false, 'b'], [false, 'c']);

      // Assert
      expect(result).toBe(undefined);
    });
  });
});

describe('switchCase', () => {
  it('returns result of value factory for first case that matches value', () => {
    // Act
    const result = switchCase('b', ['a', () => 1], ['b', () => 2], ['c', () => 3]);

    // Assert
    expect(result).toBe(2);
  });

  it('returns result of default value factory if one is provided and no case matches value', () => {
    // Act
    const result = switchCase('z', ['a', () => 1], ['b', () => 2], ['c', () => 3], () => -1);

    // Assert
    expect(result).toBe(-1);
  });

  it('returns result of default value factory if one is provided and no case matches value', () => {
    // Act
    const result = switchCase('z', ['a', () => 1], ['b', () => 2], ['c', () => 3], [DEFAULT, () => -1]);

    // Assert
    expect(result).toBe(-1);
  });

  it('returns undefined if no case matches value and no default value factory is provided', () => {
    // Act
    const result = switchCase('z', ['a', () => 1], ['b', () => 2], ['c', () => 3]);

    // Assert
    expect(result).toBe(undefined);
  });
});
