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

