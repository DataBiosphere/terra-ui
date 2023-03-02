export interface DependencyResolver<Deps> {
  get: () => Deps
  set: (getDeps: () => Deps) => void
  override: (getOverrides: () => Partial<Deps>) => void
  reset: () => void
}

/**
 * Types a thing (typically the main export of a file) as requiring specific
 * late-binding dependencies (Deps) and participating in the
 * "Composable Dependency" DI-Container pattern.
 * [wiki link TBD]
 */
export interface Composable<Deps, Output> {
  compose: (deps: Deps) => Output
  resolve: () => Output
}

/**
 * Utility type for the resolved Output type of a Composable<<Deps, Output>> type
 */
export type Composed<C extends Composable<any, any>> = ReturnType<C['resolve']>

/**
 * Utility type to safely specify an export by export name and have that be the
 * key name of a dependency collection item.  Key names must exist as an export
 * of the same name.  ComposedKey works with exports that satisfy the Composed
 * type signature, and will enforce this requirement. The dependency is typed
 * as the Output type of the Composed type signature. Dependency collections can be
 * specified using this and UnComposedKey utility types as needed:
 * @example
 * type XxxxExports = typeof import('path/to/Xxxx')
 * //...
 * export type SomeDependencies =
 *    ComposedKey<XxxxExports, 'xName'> &
 *    ComposedKey<YyyyExports, 'yName'> &
 *    UncomposedKey<ZzzzExports, 'zName'>
 */
export type ComposedKey<Exports, K extends string & keyof Exports> = Exports[K] extends Composable<any, any>
    ? { [Property in K]: Composed<Exports[K]> } : never

/**
 * Utility type to safely specify an export by export name and have that be the
 * key name of a dependency collection item.  Key names must exist as an export of the same name.
 * The type signature of the named export will be the contract of the dependency.
 * Dependency collections can be specified using this and ComposedKey utitlity types as needed:
 * @example
 * type XxxxExports = typeof import('path/to/Xxxx')
 * //...
 * export type SomeDependencies =
 *    ComposedKey<XxxxExports, 'xName'> &
 *    ComposedKey<YyyyExports, 'yName'> &
 *    UncomposedKey<ZzzzExports, 'zName'>
 */
export type UnComposedKey<Exports, K extends string & keyof Exports> =
    { [Property in K]: Exports[K] }


export const createDependencyResolver = <Deps>(): DependencyResolver<Deps> => {
  const getNullDeps = (): Deps => {
    throw Error('Dependency Resolver not initialized.')
  }
  let getCurrentDeps: () => Deps = getNullDeps
  const resolver: DependencyResolver<Deps> = {
    get: () => getCurrentDeps(),
    set: (getDeps: () => Deps): void => {
      getCurrentDeps = getDeps
    },
    override: (getOverrides: () => Partial<Deps>): void => {
      getCurrentDeps = () => ({
        ...getCurrentDeps(),
        ...getOverrides()
      })
    },
    reset: () => {
      getCurrentDeps = getNullDeps
    }
  }
  return resolver
}
