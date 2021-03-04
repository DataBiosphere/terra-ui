import _ from 'lodash/fp'
import { Fragment, useState } from 'react'
import { div, h, hr } from 'react-hyperscript-helpers'
import ReactJson from 'react-json-view'
import Select from 'react-select'
import { ButtonPrimary, ButtonSecondary } from 'src/components/common'
import ErrorView from 'src/components/ErrorView'
import { icon } from 'src/components/icons'
import { TextInput } from 'src/components/input'
import { breadcrumbHistoryCaret } from 'src/components/job-common'
import Modal from 'src/components/Modal'
import { Ajax } from 'src/libs/ajax'
import * as Style from 'src/libs/style'
import * as Utils from 'src/libs/utils'


const CallCacheWizard = ({
  onDismiss, workflowId, callFqn, attempt, index
}) => {
  /*
   * State setup
   */

  const [otherWorkflowIdTextboxValue, setOtherWorkflowIdTextboxValue] = useState()
  const [otherWorkflowId, setOtherWorkflowId] = useState()
  const [otherWorkflowMetadata, setOtherWorkflowMetadata] = useState()
  const [otherCallFqnDropdownValue, setOtherCallFqnDropdownValue] = useState()
  const [otherIndexDropdownValue, setOtherIndexDropdownValue] = useState()
  const [otherCallSelected, setOtherCallSelected] = useState(false)
  const [diff, setDiff] = useState()
  const [metadataFetchError, setMetadataFetchError] = useState()
  const [diffError, setDiffError] = useState()

  const signal = Utils.useCancellation()

  /*
   * Data Fetchers
   */

  const readCalls = async otherWf => {
    try {
      const includeKey = [
        'end', 'start', 'executionStatus'
      ]
      const excludeKey = []
      const wf = await Ajax(signal).CromIAM.workflowMetadata(otherWf, includeKey, excludeKey)
      setOtherWorkflowMetadata(wf)
    } catch (error) {
      if (error instanceof Response) setMetadataFetchError(await error.text())
      else setMetadataFetchError(error)
    }
  }

  const fetchDiff = async (otherWf, otherCall, otherIx) => {
    try {
      const diff = await Ajax(signal).CromIAM.callCacheDiff({
        workflowId,
        callFqn,
        index: Number(index)
      }, {
        workflowId: otherWf,
        callFqn: otherCall,
        index: Number(otherIx)
      })
      setDiff(diff)
    } catch (error) {
      if (error instanceof Response) setDiffError(await error.text())
      else setDiffError(error)
    }
  }

  const otherCallFqnSelectionOptions = _.flow(
    _.keys,
    _.map(name => ({ value: name, label: name }))
  )

  const resetDiffResult = () => {
    setDiff(undefined)
    setDiffError(undefined)
  }

  const resetCallSelection = () => {
    resetDiffResult()
    setOtherCallFqnDropdownValue(undefined)
    setOtherIndexDropdownValue(undefined)
    setOtherCallSelected(false)
  }

  const resetWorkflowSelection = (value = undefined) => {
    resetCallSelection()
    setOtherWorkflowId(value)
    setMetadataFetchError(undefined)
  }

  /*
   * Page render
   */

  const divider = hr({ style: { width: '100%', marginTop: '1rem', marginBottom: '1rem', border: '1px ridge lightgray' } })

  const step1 = () => {
    return h(Fragment, [
      div({ style: { paddingTop: '0.5rem', fontSize: 16, fontWeight: 500, ...Style.noWrapEllipsis } }, ['Step 1: Select the workflow you expected to cache from']),
      div({ style: { marginTop: '0.5rem', marginBottom: '1rem', display: 'flex', flexDirection: 'row', alignItems: 'center' } }, [
        div({ style: { paddingRight: '0.5rem' } }, ['Workflow ID:']),
        div({ style: { paddingRight: '0.5rem', flex: '2 1 auto' } }, [h(TextInput, {
          style: Style.codeFont,
          value: otherWorkflowIdTextboxValue,
          onChange: setOtherWorkflowIdTextboxValue,
          id: 'otherWorkflowId'
        })]),
        h(ButtonPrimary, {
          onClick: () => {
            resetWorkflowSelection(otherWorkflowIdTextboxValue)
            readCalls(otherWorkflowIdTextboxValue)
          }
        }, ['Continue'])
      ]),
      metadataFetchError && [
        'Error loading workflow metadata',
        h(ErrorView, { error: metadataFetchError })
      ]
    ])
  }

  const step2 = () => {
    const selectedCallIndex = otherIndexDropdownValue ? otherIndexDropdownValue : (
      otherWorkflowMetadata && otherCallFqnDropdownValue ? (
        otherWorkflowMetadata.calls[otherCallFqnDropdownValue].length === 1 ? otherWorkflowMetadata.calls[otherCallFqnDropdownValue][0].shardIndex : undefined
      ) : undefined
    )

    const otherCallIndexSelectionElement = (metadata, fqn) => {
      const shardOptions = _.uniqBy(_.map(({ shardIndex: i }) => { return { value: i, label: i } }, metadata.calls[fqn]), _.identity)
      return h(Select, { options: shardOptions, onChange: i => { setOtherIndexDropdownValue(i.value) } })
    }

    const otherCallSucceeded = (metadata, fqn, index) => {
      return _.flow(
        _.filter(c => c.shardIndex === index && c.executionStatus === 'Done'),
        _.map(c => c.attempt),
        _.first,
        !_.isEmpty
      )(metadata.calls[fqn])
    }

    return h(Fragment, [
      div({ style: { display: 'flex', alignItems: 'center', fontSize: 16, fontWeight: 500 } }, [
        div(['Selected workflow B: ']),
        div({ style: { display: 'flex', flexDirection: 'row', alignItems: 'center', flex: '1 1 100px' } }, [
          div({ style: { marginLeft: '0.5rem', ...Style.noWrapEllipsis, ...Style.codeFont } }, otherWorkflowId)
        ]),
        h(ButtonSecondary, { style: { textTransform: 'none', paddingLeft: '1rem', height: '20px', justifyContent: 'right' }, onClick: () => resetWorkflowSelection() }, ['Reset'])
      ]),
      div({ style: { paddingTop: '0.5rem', fontSize: 16, fontWeight: 500, ...Style.noWrapEllipsis } }, ['Step 2: Select which call in that workflow you expected to cache from']),
      otherWorkflowMetadata ?
        div([
          div({ style: { marginTop: '1rem', display: 'flex', flexDirection: 'row', alignItems: 'center' } }, [
            div({ style: { paddingRight: '0.5rem' } }, ['Call FQN:']),
            div({ style: { paddingRight: '0.5rem', flex: '2 1 auto' } }, [
              h(Select, { id: 'otherCallFqn', options: otherCallFqnSelectionOptions(otherWorkflowMetadata.calls), onChange: v => setOtherCallFqnDropdownValue(v.value) })
            ])
          ]),
          otherCallFqnDropdownValue && div({ style: { marginTop: '0.25rem', display: 'flex', flexDirection: 'row', alignItems: 'center' } }, [
            div({ style: { paddingRight: '0.5rem' } }, ['Shard Index:']),
            selectedCallIndex === -1 ? '-1 (not scattered)' : (
              selectedCallIndex ? String(selectedCallIndex) : (
                otherCallIndexSelectionElement(otherWorkflowMetadata, otherCallFqnDropdownValue)
              )
            )
          ]),
          otherCallFqnDropdownValue && selectedCallIndex && !otherCallSucceeded && 'The call/index you have selected cannot be call cached from because it did not succeed.',
          !!(otherCallFqnDropdownValue && selectedCallIndex && otherCallSucceeded) && h(ButtonPrimary, { style: { float: 'right' }, onClick: () => { fetchDiff(otherWorkflowId, otherCallFqnDropdownValue, selectedCallIndex); setOtherCallSelected(true) } }, ['Compare Diff'])
        ]) :
        'Loading workflow B\'s calls...'
    ])
  }

  const compareDiffs = () => {
    return h(Fragment, [
      div({ style: { paddingBottom: '0.5rem', display: 'flex', alignItems: 'center', fontSize: 16, fontWeight: 500 } }, [
        div(['Selected workflow B: ']),
        div({ style: { display: 'flex', flexDirection: 'row', alignItems: 'center', flex: '1 1 100px' } }, [
          div({ style: { marginLeft: '0.5rem', ...Style.noWrapEllipsis, ...Style.codeFont } }, otherWorkflowId)
        ]),
        h(ButtonSecondary, { style: { textTransform: 'none', paddingLeft: '1rem', height: '20px', justifyContent: 'right' }, onClick: () => resetWorkflowSelection() }, ['Reset'])
      ]),
      div({ style: { display: 'flex', flexDirection: 'row', alignItems: 'center', fontSize: 16, fontWeight: 500 } }, [
        div(['Selected call B: ']),
        div({ style: { display: 'flex', flexDirection: 'row', alignItems: 'center', flex: '1 1 100px' } }, [
          div({ style: { marginLeft: '0.5rem', ...Style.noWrapEllipsis, ...Style.codeFont } }, otherCallFqnDropdownValue),
          otherIndexDropdownValue && [breadcrumbHistoryCaret,
            div({ style: { marginLeft: '0.5rem', ...Style.noWrapEllipsis, ...Style.codeFont } }, `index ${otherIndexDropdownValue}`)]
        ]),
        h(ButtonSecondary, { style: { textTransform: 'none', paddingLeft: '1rem', height: '20px', justifyContent: 'right' }, onClick: () => resetCallSelection() }, ['Reset'])
      ]),
      divider,
      div({ style: { display: 'flex', alignItems: 'center', fontSize: 16, fontWeight: 500 } }, ['Result: View cache diff']),
      diffError ?
        h(ErrorView, { error: diffError }) :
        (diff ?
          [div({ style: { marginTop: '0.5rem', marginBottom: '0.5rem' } }, ['Note: the diff is expressed in terms of hashes of values rather than raw values because it is hashes that determine cache hits.']),
            h(ReactJson, {
              style: { whiteSpace: 'pre-wrap', border: 'ridge', padding: '0.5rem' },
              name: false,
              shouldCollapse: ({ name }) => { return name === 'callA' || name === 'callB' },
              enableClipboard: false,
              displayDataTypes: false,
              displayObjectSize: false,
              src: { hashDifferential: diff.hashDifferential, ...diff }
            })] :
          'Cache diff loading...')
    ])
  }

  const chooseStep = () => {
    if (!otherWorkflowId || metadataFetchError) {
      return step1()
    } else if (!otherCallSelected) {
      return step2()
    } else {
      return compareDiffs()
    }
  }

  return h(Modal, {
    title: [
      icon('search'),
      ' Call Cache Miss Debugging Wizard'
    ],
    onDismiss,
    width: '50%',
    showButtons: false,
    showX: true
  }, [
    div({ style: { padding: '1rem 2rem 2rem', flex: 1, display: 'flex', flexDirection: 'column' } }, [
      div({ style: { display: 'flex', alignItems: 'center', fontSize: 16, fontWeight: 500 } }, [
        div(['Debugging workflow A: ']),
        div({ style: { display: 'flex', flexDirection: 'row', alignItems: 'center', flex: '1 1 100px' } }, [
          div({ style: { marginLeft: '0.5rem', ...Style.noWrapEllipsis, ...Style.codeFont } }, workflowId)
        ])
      ]),
      div({ style: { paddingTop: '0.5rem', display: 'flex', flexDirection: 'row', alignItems: 'center', fontSize: 16, fontWeight: 500 } }, [
        div(['Debugging call A: ']),
        div({ style: { display: 'flex', flexDirection: 'row', alignItems: 'center', flex: '1 1 100px' } }, [
          div({ style: { marginLeft: '0.5rem', ...Style.noWrapEllipsis, ...Style.codeFont } }, callFqn),
          index && index >= 0 && [breadcrumbHistoryCaret,
            div({ style: { marginLeft: '0.5rem', ...Style.noWrapEllipsis, ...Style.codeFont } }, `index ${index}`)]
        ])
      ]),
      divider,
      chooseStep()
    ])
  ])
}

export default CallCacheWizard
