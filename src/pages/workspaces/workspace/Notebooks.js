import _ from 'lodash/fp'
import { Fragment } from 'react'
import { a, div, h } from 'react-hyperscript-helpers'
import Interactive from 'react-interactive'
import * as breadcrumbs from 'src/components/breadcrumbs'
import { contextMenu, spinnerOverlay } from 'src/components/common'
import { centeredSpinner, icon } from 'src/components/icons'
import { NotebookCreator, NotebookDeleter, NotebookDuplicator } from 'src/components/notebook-utils'
import ShowOnClick from 'src/components/ShowOnClick'
import { Buckets, Leo, Rawls } from 'src/libs/ajax'
import { getBasicProfile } from 'src/libs/auth'
import { reportError } from 'src/libs/error'
import * as Nav from 'src/libs/nav'
import * as StateHistory from 'src/libs/state-history'
import * as Style from 'src/libs/style'
import * as Utils from 'src/libs/utils'
import { Component } from 'src/libs/wrapped-components'
import WorkspaceContainer from 'src/pages/workspaces/workspace/WorkspaceContainer'


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
    const { namespace, name } = this.props
    try {
      const [{ workspace: { bucketName } }, clusters] = await Promise.all([
        Rawls.workspace(namespace, name).details(),
        Leo.clustersList()
      ])
      const notebooks = await Buckets.listNotebooks(namespace, bucketName)
      this.setState({ bucketName, notebooks: _.reverse(_.sortBy('updated', notebooks)), isFreshData: true })
      const currentCluster = _.flow(
        _.filter({ googleProject: namespace, creator: getBasicProfile().getEmail() }),
        _.remove({ status: 'Deleting' }),
        _.sortBy('createdDate'),
        _.last
      )(clusters)
      if (currentCluster && currentCluster.status === 'Running') {
        this.setState({ clusterUrl: currentCluster.clusterUrl })
        await Promise.all([
          Leo.notebooks(namespace, currentCluster.clusterName).setCookie(),
          Leo.notebooks(namespace, currentCluster.clusterName).localize({
            [`~/${name}/.delocalize.json`]: `data:application/json,{"destination":"gs://${bucketName}/notebooks","pattern":""}`
          })
        ])
        _.forEach(({ bucket, name: nbName }) => {
          Leo.notebooks(namespace, currentCluster.clusterName).localize({
            [`~/${name}/${nbName.slice(10)}`]: `gs://${bucket}/${nbName}`
          }).then(() => true, () => false).then(status => {
            this.setState(({ notebookAccess }) => ({
              notebookAccess: { ...notebookAccess, [nbName]: status }
            }))
          })
        }, notebooks)
      } else {
        this.setState({
          notebookAccess: _.fromPairs(_.map(({ name: nbName }) => [nbName, false], notebooks))
        })
      }
    } catch (error) {
      reportError(`Error loading notebooks: ${error}`)
    }
  }

  componentWillMount() {
    this.refresh()
  }

  renderNotebooks() {
    const { bucketName, clusterUrl, notebooks, notebookAccess, listView } = this.state
    const { name: wsName, namespace } = this.props

    return div({ style: { display: listView ? undefined : 'flex', flexWrap: 'wrap' } },
      _.map(({ name, updated }) => h(NotebookCard, {
        name, updated, listView, notebookAccess: notebookAccess[name], bucketName,
        clusterUrl,
        namespace, wsName,
        reloadList: () => this.refresh()
      }), notebooks)
    )
  }

  render() {
    const {
      isFreshData, bucketName, notebooks, listView
    } = this.state
    const { namespace, name } = this.props

    return h(WorkspaceContainer,
      {
        namespace, name, refresh: () => {
          this.setState({ isFreshData: false, notebookAccess: {} })
          this.refresh()
        },
        breadcrumbs: breadcrumbs.commonPaths.workspaceDashboard({ namespace, name }),
        title: 'Notebooks', activeTab: 'notebooks'
      },
      [
        div({ style: { padding: '1rem', flexGrow: 1, position: 'relative' } }, [
          Utils.cond(
            [!notebooks, centeredSpinner],
            () => h(Fragment, [
              div({
                style: {
                  color: Style.colors.title, display: 'flex', alignItems: 'center'
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
                h(NotebookCreator, { reloadList: () => this.refresh(), namespace, bucketName })
              ]),
              this.renderNotebooks()
            ])
          ),
          !isFreshData && notebooks && spinnerOverlay
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
