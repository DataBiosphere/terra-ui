/**
 * A function that takes an item and adds it to the end of an array of
 * items of the same type.
 * @param {Type} value - The item being appended to an array
 * @param {Type} list - The list the item is being appended to.
 * @returns {Type[]} - Returns a copy of the inputted list with the provided
 * value being appended to the end of the list.
 * @example
 * // returns ['a', 'b', 'c']
 * append('c', ['a','b'])
 */
export const append = <Type>(value: Type, list: Type[]): Type[] => {
  return [...list, value];
};
