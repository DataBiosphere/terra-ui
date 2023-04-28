// eslint-disable-next-line lodash-fp/use-fp -- we need these types from base lodash lib
import { CurriedFunction2, CurriedFunction3, CurriedFunction4, CurriedFunction5 } from "lodash";

import { AnyFn } from "./general-types";

// variadic types can solve SafeCurry for n arguments, but as of TS v4.8, that technique does not
// provide the desired type-flow through usages, including curried fns used within _.flow

/** more reliable generic typing for curried functions (with 2 args) */
export type SafeCurry2<F extends AnyFn> = CurriedFunction2<Parameters<F>[0], Parameters<F>[1], ReturnType<F>>;

/** more reliable generic typing for curried functions (with 3 args) */
export type SafeCurry3<F extends AnyFn> = CurriedFunction3<
  Parameters<F>[0],
  Parameters<F>[1],
  Parameters<F>[2],
  ReturnType<F>
>;

/** more reliable generic typing for curried functions (with 4 args) */
export type SafeCurry4<F extends AnyFn> = CurriedFunction4<
  Parameters<F>[0],
  Parameters<F>[1],
  Parameters<F>[2],
  Parameters<F>[3],
  ReturnType<F>
>;

/** more reliable generic typing for curried functions (with 5 args) */
export type SafeCurry5<F extends AnyFn> = CurriedFunction5<
  Parameters<F>[0],
  Parameters<F>[1],
  Parameters<F>[2],
  Parameters<F>[3],
  Parameters<F>[4],
  ReturnType<F>
>;
