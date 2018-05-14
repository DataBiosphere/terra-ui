import 'codemirror/lib/codemirror.css'
import ReactDOM from 'react-dom'
import { h } from 'react-hyperscript-helpers'
import Main from 'src/pages/Main'
import 'src/style.css'


window.SATURN_VERSION = SATURN_VERSION

ReactDOM.render(h(Main), document.getElementById('root'))
