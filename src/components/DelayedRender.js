import { useEffect, useState } from 'react'


const DelayedRender = ({ children = null, delay = 1000 }) => {
  const [shouldRender, setShouldRender] = useState(false)
  useEffect(() => {
    const timeout = setTimeout(() => setShouldRender(true), delay)
    return () => clearTimeout(timeout)
  }, [delay])

  return shouldRender && children
}

export default DelayedRender
