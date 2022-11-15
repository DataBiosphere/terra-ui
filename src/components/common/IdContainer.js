import _ from 'lodash/fp'
import { useState } from 'react'


export const IdContainer = ({ children }) => {
  const [id] = useState(() => _.uniqueId('element-'))
  return children(id)
}
