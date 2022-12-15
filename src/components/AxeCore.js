import React from 'react'
import ReactDOM from 'react-dom'


const axe = require('@axe-core/react')


console.log('axe accessibility checking is running, and this can negatively impact UI performance') // eslint-disable-line no-console
console.log('to disable: window.configOverridesStore.set({ isAxeEnabled: false })') // eslint-disable-line no-console

const config = {
  tags: ['wcag2a', 'wcag2aa'],
  rules: [
    {
      id: 'color-contrast',
      excludeHidden: true
    }
  ],
  disableDeduplicate: true
}

axe(React, ReactDOM, 1000, config)

const AxeCore = () => {
  // Return null because this component doesn't actually render anything.
  // It exists purely for initializing axe-core.
  return null
}

export default AxeCore
