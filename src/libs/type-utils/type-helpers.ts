// This syntax gives us nominal typing
// Nominal types are not interchangable even if the underlying type is the same
// A func that takes (a: A, b: B) where A and B are both strings cannot be called like (b,a) with this restriction
export type NominalType<BaseType, Name extends string> = BaseType & { __typeToken: Name }
