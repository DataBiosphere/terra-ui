import { CurriedFunction2 } from 'lodash'

// variadic types can probably solve this for n arguments, but this should work
// if we just add SafeCurry3, SafeCurry4 variants as needed.

/** more reliable generic typing for curried functions (with 2 args) */
export type SafeCurry2<F extends (...args: any[]) => any> =
    CurriedFunction2<Parameters<F>[0], Parameters<F>[1], ReturnType<F>>
