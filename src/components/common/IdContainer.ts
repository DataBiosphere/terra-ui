import _ from 'lodash/fp'
import { useMemo, useState } from 'react'

/**
 * DEPRECATED - should switch to useUniqueIdFn pattern
 */
export const IdContainer = ({ children }) => {
  const [id] = useState(() => _.uniqueId('element-'))
  return children(id)
}

/**
 * returns a durable unique id that will not chance between component render cycles.
 * @example
 * // inside a react component:
 * const thingOneId = useUniqueId('thing-one')
 * const otherId = useUniqueId()
 * //...
 * div({ id: thingOneId }, [...],
 * div({ id: otherId }, [...]
 * // will produce ids:
 * // thing-one-123
 * // element-124
 */
export const useUniqueId = (prefix: string = 'element'): string => {
  const uniqueId: string = useMemo(() => _.uniqueId(''), [])
  return `${prefix}-${uniqueId}`
}
