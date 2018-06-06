import _ from 'lodash/fp'
import { div } from 'react-hyperscript-helpers'
import { Rawls, Leo } from 'src/libs/ajax'
import { getBasicProfile } from 'src/libs/auth'
import { reportError } from 'src/libs/error'
import * as Nav from 'src/libs/nav'
import { Component } from 'src/libs/wrapped-components'


const wait = ms => new Promise(resolve => setTimeout(resolve, ms))


class NotebookLauncher extends Component {
  constructor(props) {
    super(props)

    this.creator = getBasicProfile().getEmail()
    this.state = {
      bucketName: undefined,
      clusterStatus: 'Not yet loaded'
    }
  }

  async componentDidMount() {
    const bucketName = await this.resolveBucketName()
    this.setState({ bucketName })
    const cluster = await this.startCluster()
    await this.localizeNotebook(cluster)

    const { name: workspaceName, notebookName } = this.props
    window.location.href = `${cluster.clusterUrl}/notebooks/${workspaceName}/${notebookName}`
  }

  async resolveBucketName() {
    const { namespace, name: workspaceName } = this.props

    try {
      const { workspace: { bucketName } } = await Rawls.workspace(namespace, workspaceName).details()
      return bucketName
    } catch (error) {
      reportError('Error during Google bucket lookup', error)
    }
  }

  async getCluster() {
    const { namespace } = this.props

    return _.flow(
      _.filter({ googleProject: namespace, creator: this.creator }),
      _.remove({ status: 'Deleting' }),
      _.sortBy('createdDate'),
      _.last
    )(await Leo.clustersList())
  }

  async startCluster() {
    while (true) {
      const cluster = await this.getCluster()
      const { status, googleProject, clusterName } = cluster
      this.setState({ clusterStatus: status })

      if (status === 'Running') {
        return cluster
      } else if (status === 'Stopped') {
        await Leo.cluster(googleProject, clusterName).start()
        await wait(10000)
      } else {
        await wait(3000)
      }
    }
  }

  async localizeNotebook(cluster) {
    const { namespace, name: workspaceName, notebookName } = this.props
    const { bucketName } = this.state
    const { clusterName } = cluster

    try {
      await Promise.all([
        Leo.notebooks(namespace, clusterName).setCookie(),
        Leo.notebooks(namespace, clusterName).localize({
          [`~/${workspaceName}/.delocalize.json`]: `data:application/json,{"destination":"gs://${bucketName}/notebooks","pattern":""}`
        })
      ])
      await Leo.notebooks(namespace, clusterName).localize({
        [`~/${workspaceName}/${notebookName}`]: `gs://${bucketName}/notebooks/${notebookName}`
      })
    } catch (error) {
      reportError('Error during notebook localization', error)
    }
  }

  render() {
    return div({}, [
      div({}, 'Props:'),
      div({}, JSON.stringify(this.props)),
      div({}, 'State:'),
      div({}, JSON.stringify(this.state))
    ])
  }
}


export const addNavPaths = () => {
  Nav.defPath('workspace-notebook-launch', {
    path: '/workspaces/:namespace/:name/notebooks/launch/:notebookName',
    component: NotebookLauncher
  })
}
