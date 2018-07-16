import _ from 'lodash/fp'
import { Component } from 'react'
import { Leo } from 'src/libs/ajax'
import { getBasicProfile } from 'src/libs/auth'
import { reportError } from 'src/libs/error'
import * as Nav from 'src/libs/nav'


class TerminalLauncher extends Component {
  async componentDidMount() {
    const { namespace } = this.props
    try {
      const cluster = _.flow(
        _.filter({ googleProject: namespace, creator: getBasicProfile().getEmail() }),
        _.remove({ status: 'Deleting' }),
        _.sortBy('createdDate'),
        _.last
      )(await Leo.clustersList())
      await Leo.notebooks(namespace, cluster.clusterName).setCookie()
      window.location.href = `${cluster.clusterUrl}/terminals/1`
    } catch (error) {
      reportError('Error launching terminal', error)
      this.setState({ failed: true })
    }
  }

  render() {
    return null
  }
}


export const addNavPaths = () => {
  Nav.defPath('workspace-terminal-launch', {
    path: '/terminal/:namespace',
    component: TerminalLauncher
  })
}
