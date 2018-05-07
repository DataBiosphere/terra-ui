import { hot } from 'react-hot-loader'
import { h } from 'react-hyperscript-helpers'
import AuthContainer from 'src/components/AuthContainer'
import Router from 'src/components/Router'


const Main = () => h(AuthContainer, [h(Router)])

export default hot(module)(Main)
