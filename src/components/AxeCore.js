import React from 'react'
import ReactDOM from 'react-dom'


const axe = require('@axe-core/react')


const config = {
  tags: ['wcag2a', 'wcag2aa'],
  rules: [
    {
      id: 'color-contrast',
      excludeHidden: true
    }
  ]
}

axe(React, ReactDOM, 1000, config)

const AxeCore = () => {
  // Return null because this component doesn't actually render anything.
  // It exists purely for initializing axe-core.
  return null
}

export default AxeCore
