/** Allows for nominal typing
 * Nominal types are not interchangable even if the underlying type is the same
 * A func that takes (a: A, b: B) where A and B are both strings cannot be called like (b,a) with this restriction
 */
export type NominalType<BaseType, Name extends string> = BaseType & { __typeToken: Name };

/**
 * Mutates the type of an object or interface property
 *
 * @example
 * type SlightlyDifferentType = Mutate<OriginalType, 'propertyX', NewPropertyType>;
 */
export type Mutate<T, Key extends keyof T, Mutation> = { [P in keyof T]: P extends Key ? Mutation : T[P] };
