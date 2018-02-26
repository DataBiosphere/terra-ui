import { Component } from 'react'
import { div, h } from 'react-hyperscript-helpers'
import * as Nav from '../nav'


class HeroSearch extends Component {

}

class HeroDashboard extends Component {
  render() {
    return div({}, 'foo!')
  }
}

const addNavPaths = () => {
  Nav.defRedirect({ regex: /^.{0}$/, makePath: () => 'dashboard' })
  Nav.defPath(
    'dashboard',
    {
      component: props => h(HeroDashboard, props),
      regex: /dashboard/,
      makeProps: () => {},
      makePath: () => 'dashboard'
    }
  )
}

export { HeroDashboard, addNavPaths }
