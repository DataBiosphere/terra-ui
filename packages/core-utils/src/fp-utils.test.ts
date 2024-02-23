import { toIndexPairs } from './fp-utils';

describe('toIndexPairs', () => {
  it('maps array to index pairs', () => {
    // Act
    const indexPairs = toIndexPairs([1, 2, 3]);

    // Assert
    expect(indexPairs).toEqual([
      [0, 1],
      [1, 2],
      [2, 3],
    ]);
  });
});
