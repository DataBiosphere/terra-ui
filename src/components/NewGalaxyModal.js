import _ from 'lodash/fp'
import PropTypes from 'prop-types'
import { Component, Fragment } from 'react'
import { div, fieldset, h, label, legend, span } from 'react-hyperscript-helpers'
import { ButtonPrimary, ButtonSecondary, IdContainer, Select } from 'src/components/common'
import { NumberInput } from 'src/components/input'
import { withModalDrawer } from 'src/components/ModalDrawer'
import { InfoBox } from 'src/components/PopupTrigger'
import TitleBar from 'src/components/TitleBar'
import { profiles } from 'src/data/machines'
import { formatRuntimeConfig, normalizeRuntimeConfig, runtimeConfigCost } from 'src/libs/cluster-utils'
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
  }
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

  getRuntimeConfig(isNew = false) {
    return formatRuntimeConfig({
      cloudService: !!this.state.sparkMode ? 'DATAPROC' : 'GCE',
      isNew,
      ..._.pick(
        ['numberOfWorkers', 'masterMachineType', 'masterDiskSize', 'workerMachineType', 'workerDiskSize', 'numberOfPreemptibleWorkers'],
        this.state)
    })
  }

  render() {
    const { currentCluster, onDismiss, onSuccess } = this.props
    const {
      profile, sparkMode, numberOfWorkers, numberOfPreemptibleWorkers,
    } = this.state

    const bottomButtons = () => {
      return h(Fragment, [
        div({ style: { display: 'flex', margin: '3rem 0 1rem' } }, [
          !!currentCluster && h(ButtonSecondary, { onClick: () => this.setState({ viewMode: 'delete' }) }, 'Delete Runtime'),
          div({ style: { flex: 1 } }),
          h(ButtonSecondary, { style: { marginRight: '2rem' }, onClick: onDismiss }, 'Cancel'),
          h(ButtonPrimary, {
            onClick: () => {
            }
          }, 'Create')
        ])
      ])
    }

    const runtimeConfig = () => h(Fragment, [
      div({
        style: {
          padding: '1rem', marginTop: '1rem',
          border: `2px solid ${colors.dark(0.3)}`, borderRadius: 9
        }
      }, [
        div({ style: { fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' } }, ['COMPUTE POWER']),
        div({ style: { marginBottom: '1rem' } }, ['Select from one of the default runtime profiles or define your own']),
        div({ style: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1.2fr 1fr 5.5rem', gridGap: '1rem', alignItems: 'center' } }, [
          h(IdContainer, [
            id => h(Fragment, [
              label({ htmlFor: id, style: styles.label }, 'Profile'),
              div({ style: { gridColumnEnd: 'span 5' } }, [
                h(Select, {
                  id,
                  value: profile,
                  onChange: ({ value }) => {
                    this.setState({
                      profile: value,
                      ...(value === 'custom' ?
                        {} :
                        _.pick(['masterMachineType', 'masterDiskSize'], normalizeRuntimeConfig(_.find({ name: value }, profiles).runtimeConfig)))
                    })
                  },
                  isSearchable: false,
                  isClearable: false,
                  options: [
                    ..._.map(({ name, label }) => ({ value: name, label: `${label} computer power` }), profiles),
                    { value: 'custom', label: 'Custom' }
                  ]
                })
              ])
            ])
          ])
        ]),
        sparkMode === 'cluster' && fieldset({ style: { margin: '1.5rem 0 0', border: 'none', padding: 0, position: 'relative' } }, [
          legend({
            style: {
              position: 'absolute', top: '-0.5rem', left: '0.5rem', padding: '0 0.5rem 0 0.25rem', backgroundColor: colors.light(), ...styles.label
            }
          }, ['Worker config']),
          // grid styling in a div because of display issues in chrome: https://bugs.chromium.org/p/chromium/issues/detail?id=375693
          div({
            style: {
              display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1.2fr 1fr 5.25rem', gridGap: '0.8rem', alignItems: 'center',
              padding: '1rem 0.8rem 0.8rem',
              border: `2px solid ${colors.dark(0.3)}`, borderRadius: 7
            }
          }, [
            h(IdContainer, [
              id => h(Fragment, [
                label({ htmlFor: id, style: styles.label }, 'Workers'),
                h(NumberInput, {
                  id,
                  min: 2,
                  isClearable: false,
                  onlyInteger: true,
                  value: numberOfWorkers,
                  onChange: v => this.setState({
                    numberOfWorkers: v,
                    numberOfPreemptibleWorkers: _.min([numberOfPreemptibleWorkers, v])
                  })
                })
              ])
            ]),
            h(IdContainer, [
              id => h(Fragment, [
                label({
                  htmlFor: id,
                  style: styles.label
                }, 'Preemptible'),
                h(NumberInput, {
                  id,
                  min: 0,
                  max: numberOfWorkers,
                  isClearable: false,
                  onlyInteger: true,
                  value: numberOfPreemptibleWorkers,
                  onChange: v => this.setState({ numberOfPreemptibleWorkers: v })
                })
              ])
            ]),
            div({ style: { gridColumnEnd: 'span 2' } })
          ])
        ]),
        div({
          style: { backgroundColor: colors.dark(0.2), borderRadius: 100, width: 'fit-content', padding: '0.75rem 1.25rem', ...styles.row }
        }, [
          span({ style: { ...styles.label, marginRight: '0.25rem', textTransform: 'uppercase' } }, ['cost:']),
          `${Utils.formatUSD(runtimeConfigCost(this.getRuntimeConfig(!currentCluster)))} per hour`
        ])
      ])
    ])

    return h(Fragment, [
      h(TitleBar, {
        title: 'Cloud Environmennt'
      }
      ),
      div({ style: { padding: '0.5rem 1.5rem 1.5rem', flexGrow: 1, display: 'flex', flexDirection: 'column' } }, [h(Fragment, [
        div({ style: { marginBottom: '1rem' } }, [
          'Create cloud compute to launch Jupyter Notebooks or a Project-Specific software application.'
        ]),
        h(IdContainer, [
          id => h(Fragment, [
            div({ style: { marginBottom: '0.5rem' } }, [
              label({ htmlFor: id, style: styles.label }, 'ENVIRONMENT'),
              h(InfoBox, { style: { marginLeft: '0.5rem' } }, [
                'Environment defines the software application + programming languages + packages used when you create your runtime. '
              ])
            ])
          ])
        ]),
        runtimeConfig(),
        bottomButtons()
      ])])
    ])
  }
})
