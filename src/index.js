import ReactDOM from 'react-dom'
import { AppContainer } from 'react-hot-loader'
import { h } from 'react-hyperscript-helpers'
import App from 'src/components/App'


const renderApp = () => {
  ReactDOM.render(
    h(AppContainer, {}, [App()]),
    document.getElementById('root')
  )
}

renderApp()

// Webpack Hot Module Replacement API
if (module.hot) {
  module.hot.accept('./components/App', renderApp)
}
