import _ from 'lodash/fp'
import { useMemo, useState } from 'react'

/**
 * DEPRECATED - should switch to useUniqueIdFn pattern
 */
export const IdContainer = ({ children }) => {
  const [id] = useState(() => _.uniqueId('element-'))
  return children(id)
}

export type UniqueIdFn = (prefix: string) => string

/**
 * returns a helper function that accepts a prefix to append to an id that is unique
 * for the consuming component.
 * @example
 * // inside a react component:
 * const unique = useUniqueIdFn()
 * //...
 * div({ id: unique('my-thing-one') }, [...],
 * div({ id: unique('my-thing-two') }, [...]
 * // will produce ids:
 * // my-thing-one-123UniqueToken123
 * // my-thing-two-123UniqueToken123
 */
export const useUniqueIdFn = (): UniqueIdFn => {
  const uniqueId: string = useMemo(() => _.uniqueId(''), [])
  return ((prefix: string): string => {
    return `${prefix}-${uniqueId}`
  })
}
