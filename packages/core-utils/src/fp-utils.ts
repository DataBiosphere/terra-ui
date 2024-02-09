import _ from 'lodash/fp';

type AppendFn = {
  <T>(value: T): (list: T[]) => T[];
  <T>(value: T, list: T[]): T[];
};

/**
 * Append a value to a list.
 *
 * @param value The value to append.
 * @param list The list to append to.
 * @returns A new list with the value appended.
 *
 * @example
 * append(3, [1, 2]); // => [1, 2, 3]
 *
 * @example
 * const appendBaz = append('baz');
 * appendBaz(['foo', 'bar']); // => ['foo', 'bar', 'baz']
 */
export const append: AppendFn = _.curry(<T>(value: T, list: T[]) => _.concat(list, [value]));
