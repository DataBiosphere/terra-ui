import 'src/style.css'

import _ from 'lodash/fp'
import marked from 'marked'
import ReactDOM from 'react-dom'
import { h } from 'react-hyperscript-helpers'
import RModal from 'react-modal'
import { initializeAuth } from 'src/libs/auth'
import { initializeTCell } from 'src/libs/tcell'
import Main from 'src/pages/Main'


const appRoot = document.getElementById('root')

RModal.defaultStyles = { overlay: {}, content: {} }
RModal.setAppElement(appRoot)
window.SATURN_VERSION = process.env.REACT_APP_VERSION
marked.setOptions({ sanitize: true, sanitizer: _.escape })

window._ = _

if (process.env.NODE_ENV !== 'production') {
  const axe = require('react-axe')
  const React = require('react')
  axe(React, ReactDOM, 500, {
    runOnly: {
      type: 'tag',
      values: ['section508']
    }
  })
}

ReactDOM.render(h(Main), appRoot)
initializeAuth()
initializeTCell()
