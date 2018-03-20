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
      creatingCluster: false
    }
  }

  componentWillMount() {
    this.loadClusters()
  }

  loadClusters() {
    this.setState({ clusters: [] })
    Ajax.leo('api/clusters').then(response => response.json()).then(json => {
        json.forEach(({ clusterName, googleProject }) => {
          Ajax.leo(`notebooks/${googleProject}/${clusterName}/setCookie`).catch(e => {})
        })
        this.setState({ clusters: _.sortBy(json, 'clusterName') })
      }
    )
  }

  render() {
    const { namespace } = this.props
    const { clusters, creatingCluster } = this.state

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
                render: ({ clusterName, clusterUrl, status }) =>
                  link({
                    title: clusterName,
                    disabled: status !== 'Running',
                    href: clusterUrl,
                    target: '_blank',
                    style: {
                      textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block',
                      overflow: 'hidden', width: 400
                    }
                  }, clusterName)
              },
              {
                title: 'Google project', dataIndex: 'googleProject', key: 'googleProject',
                width: 150
              },
              {
                title: 'Status', dataIndex: 'status', key: 'status'
              },
              {
                title: 'Created', dataIndex: 'createdDate', key: 'createdDate',
                width: 175,
                render: Utils.makePrettyDate
              },
              {
                title: 'Created by', dataIndex: 'creator', key: 'creator',
                render: creator => div({
                  title: creator,
                  style: {
                    textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block',
                    overflow: 'hidden', width: 275
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
                    }, [icon('trash')])
                  }
                }
              }
            ]
          }
        })
      ])
  }
})
