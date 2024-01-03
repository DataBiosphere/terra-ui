/**
 * Returns a promise that will never resolve or reject.
 *
 * Useful for cancelling async flows.
 */
export const append = <Type>(value: Type): ((list: Type[]) => Type[]) => {
  return (list: Type[]): Type[] => {
    return [...list, value];
  };
};
