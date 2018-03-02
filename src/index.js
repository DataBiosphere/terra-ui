import ReactDOM from 'react-dom'
import { AppContainer } from 'react-hot-loader'
import App from './components/App'
import {h} from 'react-hyperscript-helpers'

const renderApp = () => {
  ReactDOM.render(
    h(AppContainer, {}, [App()]),
    document.getElementById('root')
  )
}

renderApp()

// Webpack Hot Module Replacement API
if (module.hot) {
  module.hot.accept('./components/App', () => { renderApp() })
}
