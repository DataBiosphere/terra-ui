import ReactDOM from 'react-dom'
import App from './components/App'
import registerServiceWorker from './registerServiceWorker'


ReactDOM.render(App({ title: 'ecma-react-heroes' }),
  document.getElementById('root'))
registerServiceWorker()
