import _ from 'lodash/fp'
import { Fragment, useState } from 'react'
import { div, h, h3 } from 'react-hyperscript-helpers'
import Collapse from 'src/components/Collapse'
import { DashboardInfoTile, Link, spinnerOverlay, WarningTitle } from 'src/components/common'
import { icon } from 'src/components/icons'
import IOTable from 'src/components/workflows/IOTable'
import { Ajax } from 'src/libs/ajax'
import colors from 'src/libs/colors'
import { withErrorReporting } from 'src/libs/error'
import * as Utils from 'src/libs/utils'


const ConfigDetails = ({
  namespace, name, snapshotId, createDate, incompatible,
  payloadObject
}) => {
  const [busy, setBusy] = useState(false)
  const [configDetails, setConfigDetails] = useState({})
  const [inputsOutputs, setInputsOutputs] = useState()

  const signal = Utils.useCancellation()

  Utils.useOnMount(() => {
    const loadConfig = _.flow(
      Utils.withBusyState(setBusy),
      withErrorReporting('Unable to load configuration')
    )(async () => {
      const [newConfigDetails, newInputsOutputs] = await Promise.all([
        await Ajax(signal).Methods.configuration(namespace, name, snapshotId).get(),
        await Ajax(signal).Methods.configInputsOutputs(payloadObject)
      ])

      setConfigDetails(newConfigDetails)
      setInputsOutputs(newInputsOutputs)
    })

    loadConfig()
  })

  const { public: isPublic, managers } = configDetails

  return h(Fragment, [
    incompatible && div({
      style: { padding: '1rem', backgroundColor: colors.warning(0.2), borderRadius: 0.5 }
    }, [h(WarningTitle, ['This version of this configuration is not fully compatible with the workflow snapshot you have selected.'])]),
    div({ style: { display: 'flex', flexWrap: 'wrap', marginTop: '1rem' } }, [
      div({ style: { flexGrow: 1 } }, [
        h3({ style: { margin: 0, marginBottom: '0.2rem' } }, ['Owners']),
        _.map(([i, email]) => h(Fragment, { key: email }, [
          h(Link, { href: `mailto:${email}` }, [email]), i < (_.size(managers) - 1) && ', '
        ]), Utils.toIndexPairs(managers))
      ]),
      h(DashboardInfoTile, { title: 'Creation date' }, [new Date(createDate).toLocaleDateString()]),
      h(DashboardInfoTile, { title: 'Created for' }, [`Snapshot ${payloadObject.methodRepoMethod.methodVersion}`]),
      h(DashboardInfoTile, { title: 'Shared publicly' }, [
        Utils.switchCase(isPublic,
          [true, () => icon('check', { 'aria-label': 'True', color: colors.success() })],
          [false, () => icon('times', { 'aria-label': 'False' })],
          [Utils.DEFAULT, () => icon('question', { 'aria-label': 'Unknown' })])
      ])
    ]),

    h(Collapse, {
      title: h3(['Inputs']),
      initialOpenState: true
    }, [h(IOTable, {
      which: 'inputs',
      inputsOutputs: inputsOutputs?.inputs,
      config: configDetails?.payloadObject,
      readOnly: true
    })]),

    h(Collapse, {
      title: h3(['Outputs']),
      initialOpenState: true
    }, [h(IOTable, {
      which: 'outputs',
      inputsOutputs: inputsOutputs?.outputs,
      config: configDetails?.payloadObject,
      readOnly: true
    })]),

    busy && spinnerOverlay
  ])
}

export default ConfigDetails
