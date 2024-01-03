/**
 * A curried function that takes an item and adds it to the end of an array of
 * items of the same type.
 * @param {Type} value - The item being appended to an array
 * @returns { (list:Type[]) => Type[]} - Returns a function that accepts an
 * array of items with the same type as value. The function then adds the
 * value to the end of a copy  of the array provided (honors immutability)
 * @example
 * // returns ['a', 'b', 'c']
 * append('c')(['a','b'])
 */
export const append = <Type>(value: Type): ((list: Type[]) => Type[]) => {
  return (list: Type[]): Type[] => {
    return [...list, value];
  };
};
