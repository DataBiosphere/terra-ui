import ReactDOM from 'react-dom'
import { h } from 'react-hyperscript-helpers'
import Main from 'src/pages/Main'
import 'src/style.css'


window.SATURN_VERSION = SATURN_VERSION

ReactDOM.render(h(Main), document.getElementById('root'))

// just in case it's still active for anybody, probably safe to remove after, say, 9/2018
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.ready.then(registration => {
    registration.unregister()
  })
}
