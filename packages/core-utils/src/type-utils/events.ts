/**
 * Provides type safety for decoupled events mechanics.
 *
 * @example
 * interface MyComponentEvents {
 *   event1: { a: string, b: number },
 *   event2: null
 * }
 * interface MyComponentProps {
 *   ...
 *   onEvent: KeyedEventHandler<MyComponentEvents>
 * }
 *
 * // using KeyedEventHandler<MyComponentEvents> type will have then handler narrow
 * // its 2nd argument type based on the first argument:
 *
 *  onEvent: (eventName, eventArgs) => {
 *    switch (eventName) {
 *      // eventArgs type narrowed to match expected args for eventName
 *    }
 *  }
 */
export interface KeyedEventHandler<Events, FnReturn = void> {
  <K extends keyof Events>(key: K, args: Events[K]): FnReturn;
}
