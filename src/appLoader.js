import 'animate.css'
import _ from 'lodash/fp'
import marked from 'marked'
import ReactDOM from 'react-dom'
import { h } from 'react-hyperscript-helpers'
import { initializeAuth } from 'src/libs/auth'
import { initializeTCell } from 'src/libs/tcell'
import Main from 'src/pages/Main'
import 'src/style.css'


window.SATURN_VERSION = SATURN_VERSION
marked.setOptions({ sanitize: true, sanitizer: _.escape })


ReactDOM.render(h(Main), document.getElementById('root'))
initializeAuth()
initializeTCell()
