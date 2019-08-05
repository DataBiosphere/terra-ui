import 'animate.css'
import 'easymde/dist/easymde.min.css'
import 'react-notifications-component/dist/theme.css'
import 'src/style.css'

import _ from 'lodash/fp'
import marked from 'marked'
import React from 'react'
import ReactDOM from 'react-dom'
import { h } from 'react-hyperscript-helpers'
import RModal from 'react-modal'
import { initializeAuth } from 'src/libs/auth'
import { getConfig } from 'src/libs/config'
import { initializeTCell } from 'src/libs/tcell'
import Main from 'src/pages/Main'


RModal.defaultStyles = { overlay: {}, content: {} }
window.SATURN_VERSION = SATURN_VERSION
marked.setOptions({ sanitize: true, sanitizer: _.escape })


ReactDOM.render(h(Main), document.getElementById('root'))
initializeAuth()
initializeTCell()

if (!getConfig().isProd) {
  const axe = require('react-axe')
  axe(React, ReactDOM, 1000)
}
