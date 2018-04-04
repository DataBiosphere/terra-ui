import _ from 'lodash'
import { a, div, hh } from 'react-hyperscript-helpers'
import { buttonPrimary, link } from 'src/components/common'
import { icon, spinner } from 'src/components/icons'
import { DataTable } from 'src/components/table'
import { Buckets, Leo } from 'src/libs/ajax'
import * as Style from 'src/libs/style'
import * as Utils from 'src/libs/utils'
import { Component } from 'src/libs/wrapped-components'


export default hh(class WorkspaceNotebooks extends Component {
  componentWillMount() {
    this.loadClusters()
    this.getNotebooks()
  }

  loadClusters() {
    this.setState({ clusters: undefined })
    Leo.clustersList(
      list => {
        const owned = _.find(list,
          v => (v.creator === Utils.getUser().getBasicProfile().getEmail()))
        if (owned) {
          Leo.setCookie(owned.googleProject, owned.clusterName,
            () => this.setState({ clusterAccess: true }),
            () => this.setState({ clusterAccess: false })
          )
        }
        this.setState({ clusters: _.sortBy(list, 'clusterName') })
      },
      listFailure => this.setState({ listFailure })
    )
  }

  createCluster() {
    Leo.clusterCreate(this.props.namespace, window.prompt('Name for the new cluster'),
      {
        'labels': {}, 'machineConfig': {
          'numberOfWorkers': 0, 'masterMachineType': 'n1-standard-4',
          'masterDiskSize': 500, 'workerMachineType': 'n1-standard-4',
          'workerDiskSize': 500, 'numberOfWorkerLocalSSDs': 0,
          'numberOfPreemptibleWorkers': 0
        }
      },
      () => {
        this.setState({ creatingCluster: false })
        this.loadClusters()
      },
      creationFail => window.alert(
        `Couldn't create cluster: ${creationFail}`))
    this.setState({ creatingCluster: true })
  }

  getNotebooks() {
    this.setState({ notebooks: undefined })
    Buckets.listNotebooks('fc-bebc25c4-0f95-44b1-94ff-0dfcc63a8e93',
      notebooks => this.setState({ notebooks }),
      notebooksFailure => this.setState({ notebooksFailure })
    )
  }

  render() {
    const { clusters, creatingCluster, clusterAccess, listFailure, notebooks, notebooksFailure } = this.state

    return div({ style: { margin: '1rem' } }, [
      div({ style: { display: 'flex', alignItems: 'center' } }, [
        div(
          { style: { fontSize: 16, fontWeight: 500, color: Style.colors.title, flexGrow: 1 } },
          'CLUSTERS'),
        buttonPrimary({
          style: { display: 'flex' },
          disabled: creatingCluster,
          onClick: this.createCluster
        }, creatingCluster ?
          [
            spinner({ size: '1em', style: { color: 'white', marginRight: '1em' } }),
            'Creating cluster...'
          ] :
          'New cluster')
      ]),
      Utils.cond(
        [listFailure, () => `Couldn't load cluster list: ${listFailure}`],
        [!clusters, spinner],
        () => DataTable({
          dataSource: clusters,
          tableProps: {
            rowKey: 'clusterName',
            columns: [
              {
                title: 'Cluster Name', key: 'clusterName',
                render: ({ clusterName, clusterUrl, status, creator }) => {
                  const isAccessible = creator === Utils.getUser().getBasicProfile().getEmail() &&
                    status === 'Running'
                  return link({
                    title: clusterName,
                    disabled: !isAccessible,
                    href: isAccessible ? clusterUrl : undefined,
                    target: '_blank',
                    style: {
                      textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block',
                      overflow: 'hidden', width: 400
                    }
                  }, clusterName)
                }
              },
              {
                title: 'Authorized?', dataIndex: 'creator', key: 'access',
                render: creator => icon(
                  creator === Utils.getUser().getBasicProfile().getEmail() && clusterAccess ?
                    'check' : 'times', {
                    style: { margin: 'auto', display: 'block' }
                  })
              },
              { title: 'Google project', dataIndex: 'googleProject', key: 'googleProject' },
              { title: 'Status', dataIndex: 'status', key: 'status' },
              {
                title: 'Created', dataIndex: 'createdDate', key: 'createdDate',
                render: Utils.makePrettyDate
              },
              {
                title: 'Created by', dataIndex: 'creator', key: 'creator',
                render: creator => div({
                  title: creator,
                  style: {
                    textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block',
                    overflow: 'hidden'
                  }
                }, creator)
              },
              {
                title: 'Delete', key: 'delete',
                render: ({ clusterName, googleProject, status }) => {
                  if (status !== 'Deleting') {
                    return link({
                      onClick: () => {
                        Leo.clusterDelete(googleProject, clusterName,
                          () => this.loadClusters(),
                          deletionFail => window.alert(`Couldn't delete cluster: ${deletionFail}`)
                        )
                      },
                      title: `Delete cluster ${clusterName}`
                    }, [icon('trash', { style: { margin: 'auto', display: 'block' } })])
                  }
                }
              }
            ]
          }
        })
      ),
      div(
        { style: { fontSize: 16, fontWeight: 500, color: Style.colors.title, marginTop: '2rem' } },
        'NOTEBOOKS'),
      Utils.cond(
        [notebooksFailure, () => `Couldn't load cluster list: ${notebooksFailure}`],
        [!notebooks, spinner],
        () => div({ style: { display: 'flex' } },
          _.map(notebooks, ({ name, updated }) => a({
              target: '_blank',
              style: _.defaults({
                width: 200, height: 250,
                margin: '1.25rem', boxSizing: 'border-box',
                textDecoration: 'none',
                display: 'flex', flexDirection: 'column',
                justifyContent: 'space-between',
                color: Style.colors.text
              }, Style.elements.card)
            },
            [
              div({ style: Style.elements.cardTitle }, name.slice(10, -6)), // ignores 'notebooks/' and the .ipynb suffix
              icon('jupyterIcon',
                { style: { height: 125, width: 'auto', color: Style.colors.background } }),
              div({ style: { fontSize: '0.8rem' } }, [
                'Last changed:',
                div({}, Utils.makePrettyDate(updated))
              ])
            ])
          )
        )
      )
    ])
  }
})
