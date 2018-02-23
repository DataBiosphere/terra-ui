import { Component } from 'react'
import * as Nav from '../nav'
import { div, h } from 'react-hyperscript-helpers'


class HeroSearch extends Component {

}

class HeroDashboard extends Component {
  render() {
    return div()
  }
}

Nav.addNavRoute({
  exact: true,
  path: '#/',
  render: () => Nav.Redirect({ to: '/#dashboard' })
})

Nav.addNavRoute({
  component: HeroDashboard,
  path: '/#dashboard'
})

export default props => h(HeroDashboard, props);
