import { append } from './list-utils';

describe('append', () => {
  it('adds item to list of items', () => {
    // Act
    const result = append(3)([1, 2]);

    // Assert
    expect(result).toEqual([1, 2, 3]);
  });

  it('adds item to an empty list', () => {
    // Act
    const result = append('a')([]);

    // Assert
    expect(result).toEqual(['a']);
  });

  it('respects immutability', () => {
    // Arrange
    const originalArray = ['a', 'b'];
    // Act
    append('c')(originalArray);

    // Assert
    expect(originalArray).toEqual(['a', 'b']);
  });
});
