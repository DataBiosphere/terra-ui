import _ from 'lodash/fp'
import PropTypes from 'prop-types'
import { Component, Fragment } from 'react'
import { div, h, li, p, span, ul } from 'react-hyperscript-helpers'
import { ButtonPrimary, Link } from 'src/components/common'
import { withModalDrawer } from 'src/components/ModalDrawer'
import TitleBar from 'src/components/TitleBar'
import { machineTypes, profiles } from 'src/data/machines'
import { normalizeRuntimeConfig } from 'src/libs/cluster-utils'
import colors from 'src/libs/colors'
import * as Utils from 'src/libs/utils'


const styles = {
  row: {
    display: 'flex',
    alignItems: 'center',
    marginTop: '1rem'
  },
  label: { fontWeight: 600, whiteSpace: 'pre' },
  disabledInputs: {
    border: `1px solid ${colors.dark(0.2)}`, borderRadius: 4, padding: '0.5rem'
  },
  whiteBoxContainer: { padding: '1rem', borderRadius: 3, backgroundColor: 'white' },
  drawerContent: { display: 'flex', flexDirection: 'column', flex: 1, padding: '1.5rem' }
}

export const NewGalaxyModal = withModalDrawer({ width: 675 })(class NewClusterModal extends Component {
  static propTypes = {
    currentCluster: PropTypes.object,
    namespace: PropTypes.string.isRequired,
    onDismiss: PropTypes.func.isRequired,
    onSuccess: PropTypes.func.isRequired
  }

  constructor(props) {
    super(props)
    const { currentCluster } = props
    const { cloudService, ...currentConfig } = normalizeRuntimeConfig(currentCluster?.runtimeConfig || profiles[0].runtimeConfig)
    const { masterDiskSize, masterMachineType, numberOfWorkers } = currentConfig // want these to be put into state below, unlike cloudService
    const matchingProfile = _.find(({ runtimeConfig }) => _.isMatch({ masterMachineType, masterDiskSize }, normalizeRuntimeConfig(runtimeConfig)),
      profiles)

    this.state = {
      profile: matchingProfile?.name || 'custom',
      jupyterUserScriptUri: '', customEnvImage: '', viewMode: undefined,
      sparkMode: cloudService === 'GCE' ? false : numberOfWorkers === 0 ? 'master' : 'cluster',
      ...currentConfig
    }
  }

  render() {
    const { onDismiss } = this.props
    const createGalaxy = () => {
    }

    const bottomButtons = () => {
      return h(Fragment, [
        div({ style: { display: 'flex', margin: '3rem 0 1rem' } }, [
          div({ style: { flex: 1 } }),
          h(ButtonPrimary, {
            disabled: true,
            onClick: () => createGalaxy()
          }, ['Create'])
        ])
      ])
    }

    const getMachineDetails = () => {
      return _.filter(({ name }) => name === 'n1-standard-8', machineTypes)[0]
    }

    return h(Fragment, [
      h(TitleBar, {
        title: 'Cloud environment',
        onDismiss
      }),
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
            }, ['Learn more about Galaxy interactive environments.']),

            div({ style: { backgroundColor: colors.accent(.1), padding: '1rem 2rem', borderRadius: 4 } }, [
              div({ style: { fontSize: 16, fontWeight: 600 } }, ['Set up duration']),
              p({ style: { margin: 0 } },
                ['Creating a cloud environment for Galaxy takes ', span({ style: { fontWeight: 600 } }, ['8-10 minutes.'])]),
              p({ style: { margin: 0 } }, ['You can navigate away, and we will notify you when it\'s ready. ']),

              div({ style: { fontSize: 16, fontWeight: 600 } }, ['Continuation cost']),
              p({ style: { margin: 0 } }, ['Please delete the cloud environment when finished; it will']),
              p({ style: { margin: 0 } }, ['continue to ', span({ style: { fontWeight: 600 } }, ['incur charges ']), 'if it keeps running.'])

            ])
          ]),
          bottomButtons()
        ])
      ])

    ])
  }
})
