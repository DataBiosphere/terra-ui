import _ from 'lodash/fp'
import { div } from 'react-hyperscript-helpers'
import { Rawls, Leo } from 'src/libs/ajax'
import { getBasicProfile } from 'src/libs/auth'
import { reportError } from 'src/libs/error'
import * as Nav from 'src/libs/nav'
import { Component } from 'src/libs/wrapped-components'


class NotebookLauncher extends Component {
  constructor(props) {
    super(props)

    this.creator = getBasicProfile().getEmail()
    this.state = {
      bucketName: undefined,
      clusterStatus: 'Not yet loaded',
      localized: false
    }
  }

  async componentDidMount() {
    const bucketName = await this.resolveBucketName()
    this.setState({ bucketName })
    this.startCluster(cluster => this.localizeNotebook(cluster))
  }

  async resolveBucketName() {
    const { namespace, name } = this.props

    try {
      const { workspace: { bucketName } } = await Rawls.workspace(namespace, name).details()
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

  async startCluster(onDone) {
    const cluster = await this.getCluster()
    const { status, googleProject, clusterName } = cluster
    this.setState({ clusterStatus: status })

    if (status === 'Running') {
      onDone(cluster)
    } else if (status === 'Stopped') {
      Leo.cluster(googleProject, clusterName).start()
      setTimeout(() => this.startCluster(onDone), 10000)
    } else {
      setTimeout(() => this.startCluster(onDone), 3000)
    }
  }

  async localizeNotebook(cluster) {
    const { namespace, name, notebookName } = this.props
    const { bucketName } = this.state
    const { clusterName } = cluster

    try {
      await Promise.all([
        Leo.notebooks(namespace, clusterName).setCookie(),
        Leo.notebooks(namespace, clusterName).localize({
          [`~/${name}/.delocalize.json`]: `data:application/json,{"destination":"gs://${bucketName}/notebooks","pattern":""}`
        })
      ])
      await Leo.notebooks(namespace, clusterName).localize({
        [`~/${name}/${notebookName}`]: `gs://${bucketName}/notebooks/${notebookName}`
      })
    } catch (error) {
      reportError('Error during notebook localization', error)
    }

    this.setState({ localized: true })
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
