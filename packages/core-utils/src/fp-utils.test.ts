import { append } from './fp-utils';

describe('append', () => {
  it('appends a value to a list', () => {
    expect(append(3, [1, 2])).toEqual([1, 2, 3]);
  });

  it('is curried', () => {
    expect(append(3)([1, 2])).toEqual([1, 2, 3]);
  });
});
