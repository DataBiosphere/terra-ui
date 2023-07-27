/** Allows for nominal typing
 * Nominal types are not interchangable even if the underlying type is the same
 * A func that takes (a: A, b: B) where A and B are both strings cannot be called like (b,a) with this restriction
 */
export type NominalType<BaseType, Name extends string> = BaseType & { __typeToken: Name };

/**
 * Type predicate that will check if variable (obj) is a Fetch Response
 * @param obj
 */
export const isFetchResponse = (obj: unknown): obj is Response => {
  const maybeResponse = obj as Response;
  const isResponse =
    typeof maybeResponse.text === 'function' &&
    typeof maybeResponse.status === 'number' &&
    typeof maybeResponse.statusText === 'string';
  return isResponse;
};

/**
 * Use this to ensure that all possible values are handled in a switch statement.
 * @example
 * type Status = 'Loading' | 'Ready' | 'Loading';
 * const status: Status = ...
 * switch (status) {
 *   case 'Loading':
 *     return ...
 *   case 'Ready':
 *     return ...
 *   default:
 *     // TypeScript warns that 'Error' is not handled.
 *     // Argument of type 'string' is not assignable to parameter of type 'never'.ts
 *     return exhaustiveGuard(status);
 * }
 */
export const exhaustiveGuard = (_value: never): never => {
  throw new Error(`Reached exhaustive guard with unexpected value: ${JSON.stringify(_value)}`);
};
