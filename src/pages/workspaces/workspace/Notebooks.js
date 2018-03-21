import _ from 'lodash'
import { Component } from 'react'
import { div, hh } from 'react-hyperscript-helpers/lib/index'
import { buttonPrimary, link } from 'src/components/common'
import { icon, spinner } from 'src/components/icons'
import { DataTable } from 'src/components/table'
import * as Ajax from 'src/libs/ajax'
import * as Style from 'src/libs/style'
import * as Utils from 'src/libs/utils'


export default hh(class WorkspaceNotebooks extends Component {
  constructor(props) {
    super(props)
    this.state = {
      clusters: [],
      creatingCluster: false,
      clusterAccess: false
    }
  }

  componentWillMount() {
    this.loadClusters()
  }

  loadClusters() {
    this.setState({ clusters: [] })
    Ajax.leo('api/clusters').then(response => response.json()).then(json => {
        const owned = _.find(json,
          v => (v['creator'] === Utils.getUser().getBasicProfile().getEmail()))
        if (owned) {
          Ajax.leo(`notebooks/${owned.googleProject}/${owned.clusterName}/setCookie`,
            { credentials: 'include' })
            .then(() => this.setState({ clusterAccess: true }))
            .catch(() => this.setState({ clusterAccess: false }))
        }
        this.setState({ clusters: _.sortBy(json, 'clusterName') })
      }
    )
  }

  render() {
    const { namespace } = this.props
    const { clusters, creatingCluster, clusterAccess } = this.state

    return _.isEmpty(clusters) ? spinner({ style: { marginTop: '1rem' } }) :
      div({ style: { margin: '1rem' } }, [
        div({ style: { display: 'flex', alignItems: 'center' } }, [
          div({ style: { fontSize: 16, fontWeight: 500, color: Style.colors.title, flexGrow: 1 } },
            'CLUSTERS'),
          buttonPrimary({
            style: { display: 'flex' },
            disabled: creatingCluster,
            onClick: () => {
              Ajax.leo(`api/cluster/${namespace}/${window.prompt('Name for the new cluster')}`,
                {
                  method: 'PUT',
                  body: JSON.stringify({
                    'labels': {}, 'machineConfig': {
                      'numberOfWorkers': 0, 'masterMachineType': 'n1-standard-4',
                      'masterDiskSize': 500, 'workerMachineType': 'n1-standard-4',
                      'workerDiskSize': 500, 'numberOfWorkerLocalSSDs': 0,
                      'numberOfPreemptibleWorkers': 0
                    }
                  })
                }).then(() => {
                this.setState({ creatingCluster: false })
                this.loadClusters()
              })
              this.setState({ creatingCluster: true })
            }
          }, creatingCluster ?
            [
              spinner({ size: '1em', style: { color: 'white', marginRight: '1em' } }),
              'Creating cluster...'
            ] :
            'New cluster')
        ]),
        DataTable({
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
              {
                title: 'Google project', dataIndex: 'googleProject', key: 'googleProject'
              },
              {
                title: 'Status', dataIndex: 'status', key: 'status'
              },
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
                        Ajax.leo(`/api/cluster/${googleProject}/${clusterName}`,
                          { method: 'DELETE' }).then(this.loadClusters())
                      },
                      title: `Delete cluster ${clusterName}`
                    }, [icon('trash', { style: { margin: 'auto', display: 'block' } })])
                  }
                }
              }
            ]
          }
        })
      ])
  }
})
