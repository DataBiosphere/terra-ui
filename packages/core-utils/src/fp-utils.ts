export const toIndexPairs = <T>(list: T[]): [number, T][] => {
  return list.map((val, i) => [i, val]);
};
