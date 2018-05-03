import ReactDOM from 'react-dom'
import { h } from 'react-hyperscript-helpers'
import { Provider } from 'react-redux'
import Main from 'src/pages/Main'
import store from 'src/store'
import 'src/style.css'


ReactDOM.render(h(Provider, { store }, [h(Main)]), document.getElementById('root'))
