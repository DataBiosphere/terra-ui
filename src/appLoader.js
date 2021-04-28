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
/*
 * NOTE: These options are deprecated as of marked 0.7.0, and may be removed in a future version.
 * Currently, we're using them to effectively disallow literal HTML in user-authored markdown,
 * e.g. workspace descriptions. The official recommendation from the library is to apply an HTML
 * sanitizer to the output of marked(), but this would result in a change in behavior for us, since
 * it would effectively allow (well-formed) literal HTML to pass through.
 *
 * Because of this, we've delayed this upgrade as long as possible. If we're forced into it (by a
 * security issue) and there's no alternative solution available, we may need to find another
 * library.
 */
marked.setOptions({ sanitize: true, sanitizer: _.escape, silent: true })

window._ = _

ReactDOM.render(h(Main), appRoot)
initializeAuth()
initializeTCell()
