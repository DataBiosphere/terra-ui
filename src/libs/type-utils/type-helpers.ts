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
    typeof maybeResponse.text === "function" &&
    typeof maybeResponse.status === "number" &&
    typeof maybeResponse.statusText === "string";
  return isResponse;
};
