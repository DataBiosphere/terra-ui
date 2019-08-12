import 'animate.css'
import 'easymde/dist/easymde.min.css'
import 'react-notifications-component/dist/theme.css'
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
window.SATURN_VERSION = SATURN_VERSION
marked.setOptions({ sanitize: true, sanitizer: _.escape })


ReactDOM.render(h(Main), appRoot)
initializeAuth()
initializeTCell()
