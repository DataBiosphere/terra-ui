import ReactDOM from 'react-dom'
import { AppContainer } from 'react-hot-loader'
import App from './components/App'
import registerServiceWorker from './registerServiceWorker'


const render = Component => {
  ReactDOM.render(
    [AppContainer, Component],
    document.getElementById('root')
  )
}

render(App())

// Webpack Hot Module Replacement API
if (module.hot) {
  module.hot.accept('./components/App', () => { render(App()) })
}

registerServiceWorker()
