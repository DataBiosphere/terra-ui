import _ from 'lodash/fp'
import { Fragment } from 'react'
import { a, div, h } from 'react-hyperscript-helpers'
import Interactive from 'react-interactive'
import * as breadcrumbs from 'src/components/breadcrumbs'
import { buttonPrimary, contextMenu, link, spinnerOverlay } from 'src/components/common'
import { centeredSpinner, icon } from 'src/components/icons'
import { NotebookCreator, NotebookDeleter, NotebookDuplicator } from 'src/components/notebook-utils'
import ShowOnClick from 'src/components/ShowOnClick'
import { DataTable } from 'src/components/table'
import { Buckets, Leo, Rawls } from 'src/libs/ajax'
import { getBasicProfile } from 'src/libs/auth'
import * as Nav from 'src/libs/nav'
import * as StateHistory from 'src/libs/state-history'
import * as Style from 'src/libs/style'
import * as Utils from 'src/libs/utils'
import { Component } from 'src/libs/wrapped-components'
import WorkspaceContainer from 'src/pages/workspaces/workspace/WorkspaceContainer'


class StatusLabel extends Component {
  render() {
    const { status } = this.props

    return h(Fragment, [
      status,
      Utils.cond(
        [status === 'Stopped', () => this.renderStartIcon()],
        [status === 'Running', () => this.renderStopIcon()],
        () => null
      )
    ])
  }

  renderStartIcon() {
    const { clusterName, googleProject, refresh } = this.props

    return h(Interactive,
      {
        as: icon('play'), class: 'is-solid', title: 'Start Cluster',
        style: { color: Style.colors.primary },
        onClick: () => Leo.cluster(googleProject, clusterName).start().then(refresh)
      })
  }

  renderStopIcon() {
    const { clusterName, googleProject, refresh } = this.props

    return h(Interactive,
      {
        as: icon('pause'), class: 'is-solid', title: 'Stop Cluster',
        style: { color: Style.colors.primary },
        onClick: () => Leo.cluster(googleProject, clusterName).stop().then(refresh)
      })
  }
}


class NotebookCard extends Component {
  render() {
    const { namespace, name, updated, listView, notebookAccess, bucketName, clusterUrl, wsName, reloadList } = this.props
    const { renamingNotebook, copyingNotebook, deletingNotebook } = this.state
    const printName = name.slice(10, -6) // removes 'notebooks/' and the .ipynb suffix

    const hideMenu = () => this.notebookMenu.setVisibility(false)

    const notebookMenu = h(ShowOnClick, {
        ref: instance => this.notebookMenu = instance,
        button: h(Interactive, {
          as: icon('ellipsis-vertical'), size: 18,
          style: { marginLeft: '1rem', cursor: 'pointer' }, focus: 'hover'
        })
      },
      [
        div({
          style: _.merge({
            position: 'absolute', top: 0, lineHeight: 'initial', textAlign: 'initial',
            color: 'initial', textTransform: 'initial', fontWeight: 300
          }, listView ? { right: '1rem' } : { left: '2rem' })
        }, [
          contextMenu([
            [{ onClick: () => { this.setState({ renamingNotebook: true }, hideMenu) } }, 'Rename'], // hiding menu doesn't work when executed concurrently
            [{ onClick: () => { this.setState({ copyingNotebook: true }, hideMenu) } }, 'Duplicate'],
            [{ onClick: () => { this.setState({ deletingNotebook: true }, hideMenu) } }, 'Delete']
          ])
        ])
      ])

    const jupyterIcon = icon('jupyterIcon', {
      style: listView ? {
          height: '2em',
          width: '2em',
          margin: '-0.5em 0.5rem -0.5em 0',
          color: Style.colors.background
        } :
        {
          height: 125,
          width: 'auto',
          color: Style.colors.background
        }
    })

    const title = div({
      title: printName,
      style: {
        ...Style.elements.cardTitle,
        textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden',
        ...(notebookAccess ? {} : { color: Style.colors.disabled })
      }
    }, printName)

    const statusIcon = Utils.cond(
      [notebookAccess === false, () => icon('times', { title: 'Error' })],
      [notebookAccess, () => icon('check', { title: 'Ready' })],
      () => centeredSpinner({ size: null, style: null, title: 'Transferring to cluster' })
    )

    return h(Fragment, [
      a({
          target: '_blank',
          href: notebookAccess ?
            `${clusterUrl}/notebooks/${wsName}/${printName}.ipynb` : // removes 'notebooks/'
            undefined,
          style: {
            ...Style.elements.card,
            flexShrink: 0,
            width: listView ? undefined : 200,
            height: listView ? undefined : 250,
            margin: '1.25rem',
            color: Style.colors.text, textDecoration: 'none',
            cursor: notebookAccess === false ? 'not-allowed' : notebookAccess ? undefined : 'wait',
            display: 'flex', flexDirection: listView ? 'row' : 'column',
            justifyContent: listView ? undefined : 'space-between',
            alignItems: listView ? 'center' : undefined
          }
        },
        listView ? [
            jupyterIcon,
            title,
            div({ style: { flexGrow: 1 } }),
            div({ style: { fontSize: '0.8rem', marginRight: '0.5rem' } },
              `Last changed: ${Utils.makePrettyDate(updated)}`),
            statusIcon,
            notebookMenu
          ] :
          [
            div({ style: { display: 'flex', justifyContent: 'space-between' } },
              [title, notebookMenu]),
            jupyterIcon,
            div({ style: { display: 'flex', alignItems: 'flex-end' } }, [
              div({ style: { fontSize: '0.8rem', flexGrow: 1, marginRight: '0.5rem' } }, [
                'Last changed:',
                div({}, Utils.makePrettyDate(updated))
              ]),
              statusIcon
            ])
          ]),
      Utils.cond(
        [
          renamingNotebook,
          () => h(NotebookDuplicator, {
            printName, namespace, bucketName, destroyOld: true,
            onDismiss: () => this.setState({ renamingNotebook: false }),
            onSuccess: () => reloadList()
          })
        ],
        [
          copyingNotebook,
          () => h(NotebookDuplicator, {
            printName, namespace, bucketName, destroyOld: false,
            onDismiss: () => this.setState({ copyingNotebook: false }),
            onSuccess: () => reloadList()
          })
        ],
        [
          deletingNotebook,
          () => h(NotebookDeleter, {
            printName, namespace, bucketName,
            onDismiss: () => this.setState({ deletingNotebook: false }),
            onSuccess: () => reloadList()
          })
        ],
        () => null)
    ])
  }
}

class WorkspaceNotebooks extends Component {
  constructor(props) {
    super(props)
    this.state = { notebookAccess: {}, ...StateHistory.get() }
  }

  async refresh() {
    this.loadClusters()

    const { namespace, name } = this.props

    const { workspace: { bucketName } } = await Rawls.workspace(namespace, name).details()
    this.setState({ bucketName })
  }

  componentWillMount() {
    this.refresh()
  }

  loadClusters() {
    const { namespace } = this.props

    Leo.clustersList().then(
      list => {
        const cluster = _.find({ googleProject: namespace, creator: getBasicProfile().getEmail() }, list)
        if (cluster) {
          Leo.notebooks(namespace, cluster.clusterName).setCookie().then(() => this.setState({ cluster }, this.getNotebooks))
        }

        const owned = _.filter({ creator: getBasicProfile().getEmail() }, list)
        this.setState({ clusters: _.sortBy('clusterName', owned) })
      },
      listFailure => this.setState({ listFailure })
    )
  }

  createCluster() {
    Leo.cluster(this.props.namespace, window.prompt('Name for the new cluster')).create({
      'labels': {}, 'machineConfig': {
        'numberOfWorkers': 0, 'masterMachineType': 'n1-standard-4',
        'masterDiskSize': 500, 'workerMachineType': 'n1-standard-4',
        'workerDiskSize': 500, 'numberOfWorkerLocalSSDs': 0,
        'numberOfPreemptibleWorkers': 0
      }
    }).then(
      () => {
        this.setState({ creatingCluster: false })
        this.loadClusters()
      },
      creationFail => window.alert(`Couldn't create cluster: ${creationFail}`)
    )
    this.setState({ creatingCluster: true })
  }

  getNotebooks() {
    const { namespace, name: wsName } = this.props
    const { bucketName, cluster } = this.state

    if (cluster) {
      Buckets.listNotebooks(namespace, bucketName).then(
        notebooks => {
          const { clusterName } = cluster

          this.setState({ freshNotebooks: true, notebooks: _.reverse(_.sortBy('updated', notebooks)) })

          Leo.notebooks(namespace, clusterName).localize({
            [`~/${wsName}/.delocalize.json`]: `data:application/json,{"destination":"gs://${bucketName}/notebooks","pattern":""}`
          })

          _.forEach(({ bucket, name }) => {
            Leo.notebooks(namespace, clusterName).localize({
              [`~/${wsName}/${name.slice(10)}`]: `gs://${bucket}/${name}`
            }).then(
              () => this.setState(
                oldState => _.merge({ notebookAccess: { [name]: true } }, oldState)),
              () => this.setState(
                oldState => _.merge({ notebookAccess: { [name]: false } }, oldState))
            )
          }, notebooks)
        },
        notebooksFailure => this.setState({ notebooksFailure })
      )
    } else {
      this.setState({ notebooks: [] })
    }
  }

  renderNotebooks() {
    const { bucketName, cluster, notebooks, notebookAccess, listView } = this.state
    const { name: wsName, namespace } = this.props

    return div({ style: { display: listView ? undefined : 'flex', flexWrap: 'wrap' } },
      _.map(({ name, updated }) => h(NotebookCard, {
        name, updated, listView, notebookAccess: notebookAccess[name], bucketName,
        clusterUrl: cluster && cluster.clusterUrl, // on starting a paused cluster it will briefly report as blank
        namespace, wsName,
        reloadList: () => this.getNotebooks()
      }), notebooks)
    )
  }

  render() {
    const {
      freshNotebooks, bucketName, clusters, creatingCluster, listFailure, notebooks, notebooksFailure, listView
    } = this.state

    const { namespace, name } = this.props

    return h(WorkspaceContainer,
      {
        namespace, name, refresh: () => {
          this.setState({ freshNotebooks: false })
          this.refresh()
        },
        breadcrumbs: breadcrumbs.commonPaths.workspaceDashboard({ namespace, name }),
        title: 'Notebooks', activeTab: 'notebooks'
      },
      [
        div({ style: { padding: '1rem', flexGrow: 1, position: 'relative' } }, [
          !freshNotebooks && notebooks && spinnerOverlay,
          div({ style: { display: 'flex', alignItems: 'center' } }, [
            div(
              { style: { fontSize: 16, fontWeight: 500, color: Style.colors.title, flexGrow: 1 } },
              'CLUSTERS'),
            buttonPrimary({
              style: { display: 'flex' },
              disabled: creatingCluster,
              onClick: () => this.createCluster()
            }, creatingCluster ?
              [
                centeredSpinner({ size: '1em', style: { color: 'white', marginRight: '1em' } }),
                'Creating cluster...'
              ] :
              'New cluster')
          ]),
          Utils.cond(
            [listFailure, () => `Couldn't load cluster list: ${listFailure}`],
            [!clusters, centeredSpinner],
            () => h(Fragment, [
              h(DataTable, {
                allowPagination: false,
                dataSource: clusters,
                tableProps: {
                  rowKey: 'clusterName',
                  columns: [
                    {
                      title: 'Cluster Name', key: 'clusterName',
                      render: ({ clusterName, clusterUrl, status, creator }) => {
                        const isAccessible = creator === getBasicProfile().getEmail() &&
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
                    { title: 'Google project', dataIndex: 'googleProject', key: 'googleProject' },
                    {
                      title: 'Status', key: 'status',
                      render: ({ clusterName, googleProject, status }) =>
                        h(StatusLabel, { clusterName, googleProject, status, refresh: () => this.loadClusters() })
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
                              Leo.cluster(googleProject, clusterName).delete().then(
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
              }),
              div({
                style: {
                  color: Style.colors.title, marginTop: '2rem', display: 'flex', alignItems: 'center'
                }
              }, [
                div({ style: { fontSize: 16, fontWeight: 500 } }, 'NOTEBOOKS'),
                div({ style: { flexGrow: 1 } }),
                icon('view-cards', {
                  style: {
                    cursor: 'pointer',
                    boxShadow: listView ? undefined : `0 4px 0 ${Style.colors.highlight}`,
                    marginRight: '1rem', width: 26, height: 22
                  },
                  onClick: () => {
                    this.setState({ listView: false })
                  }
                }),
                icon('view-list', {
                  style: {
                    cursor: 'pointer', boxShadow: listView ? `0 4px 0 ${Style.colors.highlight}` : null
                  },
                  size: 26,
                  onClick: () => {
                    this.setState({ listView: true })
                  }
                }),
                h(NotebookCreator, { reloadList: () => this.getNotebooks(), namespace, bucketName })
              ]),
              Utils.cond(
                [notebooksFailure, () => `Couldn't load cluster list: ${notebooksFailure}`],
                [!notebooks, centeredSpinner],
                () => this.renderNotebooks()
              )
            ])
          )
        ])
      ]
    )
  }

  componentDidUpdate() {
    const { bucketName, clusters, cluster, notebooks, listView } = this.state

    StateHistory.update({ bucketName, clusters, cluster, notebooks, listView })
  }
}

export const addNavPaths = () => {
  Nav.defPath('workspace-notebooks', {
    path: '/workspaces/:namespace/:name/notebooks',
    component: WorkspaceNotebooks
  })
}
