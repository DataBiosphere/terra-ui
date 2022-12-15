import 'src/style.css'

import _ from 'lodash/fp'
import ReactDOM from 'react-dom'
import { h } from 'react-hyperscript-helpers'
import RModal from 'react-modal'
import { initializeAuth, initializeClientId } from 'src/libs/auth'
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
})
