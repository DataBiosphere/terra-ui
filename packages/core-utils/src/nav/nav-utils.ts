interface KeyedNavFn<Navs, FnReturn> {
  <K extends keyof Navs>(key: K, args: Navs[K]): FnReturn;
}

/**
 * Provides type safety for navigation mechanics.
 * navTo and getUrl (key, args) functions are typed based on NavTypes generic to
 * narrow args based on the type of NavTypes[key] contract.  NavTypes can hold a
 * number of keyed arg contracts.
 *
 * @example
 * interface MyNavAction {
 *   key1: { a: string, b: number },
 *   key2: null
 * }
 *
 * // using NavLinkProvider<MyNavAction> type will have getUrl narrow
 * // its 2nd argument based on the first argument:
 *
 * myProvider.getUrl('key1', args: {a: string, b: number}) => string
 *
 * // and similar for navTo
 */
export interface NavLinkProvider<NavTypes> {
  navTo: KeyedNavFn<NavTypes, void>;
  getUrl: KeyedNavFn<NavTypes, string>;
}
