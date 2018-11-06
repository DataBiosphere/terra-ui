import { div } from 'react-hyperscript-helpers'
import { Component } from 'src/libs/wrapped-components'


export default class SignInButton extends Component {
  componentDidMount() {
    window.gapi.signin2.render('signInButton', {
      scope: 'openid profile email',
      'width': 250,
      'height': 56,
      'longtitle': true,
      'theme': 'dark'
    })
  }

  render() {
    return div({ id: 'signInButton' })
  }
}
