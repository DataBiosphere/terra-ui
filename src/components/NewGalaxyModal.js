import _ from 'lodash/fp'
import PropTypes from 'prop-types'
import { Component, Fragment } from 'react'
import { div, h, li, p, span, ul } from 'react-hyperscript-helpers'
import { ButtonPrimary, ButtonSecondary, Link } from 'src/components/common'
import { withModalDrawer } from 'src/components/ModalDrawer'
import TitleBar from 'src/components/TitleBar'
import { machineTypes } from 'src/data/machines'
import { Ajax } from 'src/libs/ajax'
import { currentApp } from 'src/libs/cluster-utils'
import colors from 'src/libs/colors'
import * as Utils from 'src/libs/utils'


const styles = {
  whiteBoxContainer: { padding: '1rem', borderRadius: 3, backgroundColor: 'white' },
  drawerContent: { display: 'flex', flexDirection: 'column', flex: '0 1 0%', padding: '1.5rem' }
}

export const NewGalaxyModal = withModalDrawer({ width: 675 })(class NewGalaxyModal extends Component {
  static propTypes = {
    onDismiss: PropTypes.func.isRequired,
    onSuccess: PropTypes.func.isRequired,
    namespace: PropTypes.string.isRequired,
    apps: PropTypes.array
  }

  constructor(props) {
    super(props)
    const { app } = props

    this.state = {
      viewMode: undefined,
      isDeleting: false
    }
  }

  getOldEnvironmentConfig() {
    // Currently, we only care about the existence of an app, and no other data.
    const { apps } = this.props
    const app = currentApp(apps)
    return {
      app: !!app ? {} : {}
    }
  }

  createGalaxy() {
    const { namespace, onSuccess } = this.props
    //return onSuccess(Ajax().Apps.app(namespace, Utils.generateKubernetesClusterName()).create(Utils.generatePersistentDiskName()))
    //todo work with leo team
  }

  applyGalaxyChanges() {
    const { viewMode } = this.state
    const { app: oldApp } = this.getOldEnvironmentConfig()
    return Utils.switchCase(viewMode,
      ['deleteWarn', () => Ajax().Apps.app(oldApp.googleProject, oldApp.appName).delete()],
      ['createWarn', () => this.createGalaxy()],
      [Utils.DEFAULT, () => !!oldApp ? this.setState({ viewMode: 'deleteWarn' }) : this.setState({ viewMode: 'createWarn' })]
    )
  }

  render() {
    const { apps, onDismiss } = this.props
    const { viewMode } = this.state

    const app = currentApp(apps)



    const renderBottomButtons = () => {
      return h(Fragment, [
        div({ style: { display: 'flex', margin: '3rem 0 1rem' } }, [
          div({ style: { flex: 1 } }),
          this.renderActionButton(),
          h(ButtonSecondary, { style: { margin: '0 2rem 0 1rem' }, onClick: onDismiss }, 'Cancel')
        ])
      ])
    }

    const getMachineDetails = () => {
      return _.filter(({ name }) => name === 'n1-standard-8', machineTypes)[0]
    }

    const renderCreateWarning = () => {
      return h(Fragment, [
        div({ style: { backgroundColor: colors.accent(.1), padding: '1rem 2rem', borderRadius: 4 } }, [
          div({ style: { fontSize: 16, fontWeight: 600 } }, ['Set up duration']),
          p({ style: { margin: 0 } },
            ['Creating a cloud environment for Galaxy takes ', span({ style: { fontWeight: 600 } }, ['8-10 minutes.'])]),
          p({ style: { margin: 0 } }, ['You can navigate away, and we will notify you when it\'s ready. ']),
          div({ style: { fontSize: 16, fontWeight: 600 } }, ['Continuation cost']),
          p({ style: { margin: 0 } }, ['Please delete the cloud environment when finished; it will']),
          p({ style: { margin: 0 } }, ['continue to ', span({ style: { fontWeight: 600 } }, ['incur charges ']), 'if it keeps running.'])
        ])
      ])
    }

    const renderDeleteWarning = () => {
      return div({ style: { lineHeight: '22px' } }, [
        div({ style: { marginTop: '0.5rem' } }, [
          'Deleting your Cloud Environment will also ',
          span({ style: { fontWeight: 600 } }, ['delete any files on the associated hard disk']),
          ' (e.g. results files). Double check that your workflow results were written to ',
          'the data tab in the workspace before clicking “Delete”'
        ]),
        div({ style: { marginTop: '1rem' } }, ['Deleting your Cloud Environment will stop your ',
          'running Galaxy application and all associated costs. You can create a new Cloud Environment ',
          'for Galaxy later, which will take 8-10 minutes.'])
      ])
    }

    const renderDefaultCase = () => {
      return h(Fragment, [
        div({ style: { ...styles.drawerContent, paddingTop: '0.5rem' } }, [
          div(['Environment consists of an application and cloud compute.']),
          div({ style: { ...styles.whiteBoxContainer, marginTop: '1rem' } }, [
            div([
              div({ style: { fontSize: 16, fontWeight: 600 } }, ['Environment Settings']),
              ul({ style: { paddingLeft: '1rem', lineHeight: 1.5 } }, [
                li({ style: { marginTop: '1rem' } }, [
                  'Galaxy version xxx'
                ]),
                li({ style: { marginTop: '1rem' } }, [
                  'Cloud Compute size of ', span({ style: { fontWeight: 600 } },
                    [`${getMachineDetails().cpu} CPUS, ${getMachineDetails().memory}  GB of memory, 50 GB disk space`])
                  //TODO: Define the disk space using DEFAULT_DISK_SIZE from the mob_pd branch
                ]),
                li({ style: { marginTop: '1rem' } }, [
                  'Running cloud compute costs $0.19 per hr'
                ])
              ]),
              h(Link, {
                ...Utils.newTabLinkProps,
                href: ''
              }, ['Learn more about Galaxy interactive environments.'])
            ])
          ])
        ])
      ])
    }

    const contents = Utils.switchCase(viewMode,
      ['createWarn', renderCreateWarning],
      ['deleteWarn', renderDeleteWarning],
      [Utils.DEFAULT, renderDefaultCase]
    )

    return h(Fragment, [
      h(TitleBar, {
        title: Utils.switchCase(viewMode,
          ['deleteWarn', () => 'Delete Cloud Environment for Galaxy'],
          [Utils.DEFAULT, () => 'Cloud environment']
        ),
        onDismiss,
        onPrevious: !!viewMode ? () => this.setState({ viewMode: undefined }) : undefined
      }),
      div({ style: { padding: '0.5rem 1.5rem 1.5rem', flexGrow: 1, display: 'flex', flexDirection: 'column' } }, [contents, renderBottomButtons()])
    ])
  }

  renderActionButton() {
    const { viewMode } = this.state
    const { app: oldApp } = this.getOldEnvironmentConfig()

    return h(ButtonPrimary, {
      onClick: () => this.applyGalaxyChanges()
    }, [
      Utils.switchCase(viewMode,
        ['deleteWarn', () => 'Delete'],
        ['createWarn', () => 'Create'],
        [Utils.DEFAULT, () => !!oldApp ? 'Delete' : 'Next']
      )
    ])
  }
})
