import 'src/style.css'

import _ from 'lodash/fp'
import React from 'react'
import ReactDOM from 'react-dom'
import { h } from 'react-hyperscript-helpers'
import RModal from 'react-modal'
import { initializeAuth, initializeClientId } from 'src/libs/auth'
import { isAxeEnabled } from 'src/libs/config'
import { startPollingServiceAlerts } from 'src/libs/service-alerts-polling'
import { initializeTCell } from 'src/libs/tcell'
import Main from 'src/pages/Main'


const appRoot = document.getElementById('root')

RModal.defaultStyles = { overlay: {}, content: {} }
RModal.setAppElement(appRoot)
window.SATURN_VERSION = process.env.REACT_APP_VERSION

window._ = _

initializeClientId().then(() => {
  ReactDOM.render(h(Main), appRoot)
  initializeAuth()
  initializeTCell()
  startPollingServiceAlerts()

  if (isAxeEnabled()) {
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
      ]
    }
    axe(React, ReactDOM, 1000, config)
  }
})
