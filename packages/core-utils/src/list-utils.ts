export const append = <Type>(value: Type): ((list: Type[]) => Type[]) => {
  return (list: Type[]): Type[] => {
    return [...list, value];
  };
};
