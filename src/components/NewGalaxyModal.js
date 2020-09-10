import _ from 'lodash/fp'
import PropTypes from 'prop-types'
import { Component, Fragment } from 'react'
import { div, h, li, p, span, ul } from 'react-hyperscript-helpers'
import { ButtonPrimary, ButtonSecondary, Link } from 'src/components/common'
import { withModalDrawer } from 'src/components/ModalDrawer'
import TitleBar from 'src/components/TitleBar'
import { machineTypes } from 'src/data/machines'
import { Ajax } from 'src/libs/ajax'
import colors from 'src/libs/colors'
import * as Utils from 'src/libs/utils'


const styles = {
  whiteBoxContainer: { padding: '1rem', borderRadius: 3, backgroundColor: 'white' },
  drawerContent: { display: 'flex', flexDirection: 'column', flex: 1, padding: '1.5rem' }
}

export const NewGalaxyModal = withModalDrawer({ width: 675 })(class NewGalaxyModal extends Component {
  static propTypes = {
    onDismiss: PropTypes.func.isRequired,
    onSuccess: PropTypes.func.isRequired,
    namespace: PropTypes.string.isRequired,
    app: PropTypes.object
  }

  constructor(props) {
    super(props)
    const { app } = props

    this.state = {
      viewMode: undefined
    }
  }

  createGalaxy() {
    const { namespace, onSuccess } = this.props
    //return onSuccess(Ajax().Apps.app(namespace, Utils.generateKubernetesClusterName()).create(Utils.generatePersistentDiskName()))
    //todo work with leo team
  }


  render() {
    const { onDismiss } = this.props
    const { viewMode } = this.state

    const applyGalaxyChanges = () => {
      return Utils.switchCase(viewMode,
        ['delete', () => 'delete or something'],
        ['createWarn', () => this.createGalaxy()],
        [Utils.DEFAULT, () => this.setState({ viewMode: 'createWarn' })]
      )
    }

    const bottomButtons = () => {
      return h(Fragment, [
        div({ style: { display: 'flex', margin: '3rem 0 1rem' } }, [
          div({ style: { flex: 1 } }),
          h(ButtonPrimary, {
            onClick: () => applyGalaxyChanges()
          }, [
            Utils.switchCase(viewMode,
              ['delete', () => 'delete or something'],
              ['createWarn', () => 'Create'],
              [Utils.DEFAULT, () => 'Next']
            )
          ]),
          h(ButtonSecondary, { style: { margin: '0 2rem 0 1rem' }, onClick: onDismiss }, 'Cancel')
        ])
      ])
    }

    const getMachineDetails = () => {
      return _.filter(({ name }) => name === 'n1-standard-8', machineTypes)[0]
    }

    const contents = Utils.switchCase(viewMode,
      ['createWarn', () => {
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
      }],
      [Utils.DEFAULT, () => {
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
      }]
    )

    return h(Fragment, [
      h(TitleBar, {
        title: Utils.switchCase(viewMode,
          ['delete', () => 'delete something'],
          [Utils.DEFAULT, () => 'Cloud environment']
        ),
        onDismiss,
        onPrevious: !!viewMode ? () => this.setState({ viewMode: undefined }) : undefined
      }),
      div({ style: { padding: '0.5rem 1.5rem 1.5rem', flexGrow: 1, display: 'flex', flexDirection: 'column' } }, [contents, bottomButtons()])
    ])
  }
})
