import _ from 'lodash/fp'
import { div, h } from 'react-hyperscript-helpers'
import { Link, Select } from 'src/components/common'
import { icon } from 'src/components/icons'
import { TextInput } from 'src/components/input'
import TooltipTrigger from 'src/components/TooltipTrigger'
import { Ajax } from 'src/libs/ajax'
import colors from 'src/libs/colors'
import { getConfig } from 'src/libs/config'
import { notify } from 'src/libs/notifications'
import { differenceFromDatesInSeconds, differenceFromNowInSeconds } from 'src/libs/utils'
import * as Utils from 'src/libs/utils'


export const AutoRefreshInterval = 1000 * 60 // 1 minute
export const WdsPollInterval = 1000 * 30 // 30 seconds

const iconSize = 24
export const addCountSuffix = (label, count = undefined) => {
  return label + (count === undefined ? '' : `: ${count}`)
}

export const statusType = {
  succeeded: {
    id: 'succeeded', // Must match variable name for collection unpacking.
    label: () => 'Succeeded',
    icon: style => icon('check', { size: iconSize, style: { color: colors.success(), ...style } })
  },
  failed: {
    id: 'failed', // Must match variable name for collection unpacking.
    label: () => 'Failed',
    icon: style => icon('warning-standard', { size: iconSize, style: { color: colors.danger(), ...style } })
  },
  running: {
    id: 'running', // Must match variable name for collection unpacking.
    label: () => 'Running',
    icon: style => icon('sync', { size: iconSize, style: { color: colors.dark(), ...style } })
  },
  submitted: {
    id: 'submitted', // Must match variable name for collection unpacking.
    label: () => 'Submitted',
    icon: style => icon('clock', { size: iconSize, style: { color: colors.dark(), ...style } })
  },
  waitingForQuota: {
    id: 'waitingForQuota', // Must match variable name for collection unpacking.
    label: () => 'Submitted, Awaiting Cloud Quota',
    icon: style => icon('error-standard', { size: iconSize, style: { color: colors.warning(), ...style } }),
    moreInfoLink: 'https://support.terra.bio/hc/en-us/articles/360029071251',
    moreInfoLabel: 'Learn more about cloud quota',
    tooltip: 'Delayed by Google Cloud Platform (GCP) quota limits. Contact Terra Support to request a quota increase.'
  },
  unknown: {
    id: 'unknown', // Must match variable name for collection unpacking.
    label: executionStatus => `Unexpected status (${executionStatus})`,
    icon: style => icon('question', { size: iconSize, style: { color: colors.dark(), ...style } })
  },
  canceling: {
    id: 'canceling', // Must match variable name for collection unpacking.
    label: () => 'Canceling',
    icon: style => icon('sync', { size: iconSize, style: { color: colors.dark(), ...style } })
  },
  canceled: {
    id: 'canceled', // Must match variable name for collection unpacking.
    label: () => 'Canceled',
    icon: style => icon('warning-standard', { size: iconSize, style: { color: colors.dark(), ...style } })
  }
}

/**
 * Returns the rendered status line, based on icon function, label, and style.
 */
export const makeStatusLine = (iconFn, label, style) => div(
  { style: { display: 'flex', alignItems: 'center', fontSize: 14, ...style } },
  [iconFn({ marginRight: '0.5rem' }), label]
)

const RunSetTerminalStates = ['ERROR', 'COMPLETE', 'CANCELED']
export const isRunSetInTerminalState = runSetStatus => RunSetTerminalStates.includes(runSetStatus)

const RunTerminalStates = ['COMPLETE', 'CANCELED', 'SYSTEM_ERROR', 'ABORTED', 'EXECUTOR_ERROR']
export const isRunInTerminalState = runStatus => RunTerminalStates.includes(runStatus)

const Covid19Methods = ['fetch_sra_to_bam', 'assemble_refbased', 'sarscov2_nextstrain']
export const isCovid19Method = methodName => Covid19Methods.includes(methodName)

export const getDuration = (state, submissionDate, lastModifiedTimestamp, stateCheckCallback) => {
  return stateCheckCallback(state) ?
    differenceFromDatesInSeconds(submissionDate, lastModifiedTimestamp) :
    differenceFromNowInSeconds(submissionDate)
}

export const loadAllRunSets = async signal => {
  try {
    const getRunSets = await Ajax(signal).Cbas.runSets.get()
    const durationEnhancedRunSets = _.map(r => _.merge(r, { duration: getDuration(r.state, r.submission_timestamp, r.last_modified_timestamp, isRunSetInTerminalState) }), getRunSets.run_sets)
    return _.merge(getRunSets, { run_sets: durationEnhancedRunSets })
  } catch (error) {
    notify('error', 'Error getting run set data', { detail: await (error instanceof Response ? error.text() : error) })
  }
}

/***
NOTE: This function has been modified during the experimental port from cbas repo into terra UI.
      It's Michael's best guess effort on adapting this function for more general use.
***/

// Invokes logic to determine the appropriate app for WDS
// If WDS is not running, a URL will not be present, in this case we return empty string
// Note: This logic has been copied from how DataTable finds WDS app in Terra UI (https://github.com/DataBiosphere/terra-ui/blob/ac13bdf3954788ca7c8fd27b8fd4cfc755f150ff/src/libs/ajax/data-table-providers/WdsDataTableProvider.ts#L94-L147)
export const resolveApp = (apps, prefix) => {
  // WDS looks for Kubernetes deployment statuses (such as RUNNING or PROVISIONING), expressed by Leo
  // See here for specific enumerations -- https://github.com/DataBiosphere/leonardo/blob/develop/core/src/main/scala/org/broadinstitute/dsde/workbench/leonardo/kubernetesModels.scala
  // look explicitly for a RUNNING app named 'wds-${app.workspaceId}' -- if WDS is healthy and running, there should only be one app RUNNING
  // an app may be in the 'PROVISIONING', 'STOPPED', 'STOPPING', which can still be deemed as an OK state for WDS
  const healthyStates = ['RUNNING', 'PROVISIONING', 'STOPPED', 'STOPPING']

  // WDS appType is checked first and takes precedence over CROMWELL apps in the workspace
  for (const appTypeName of getConfig().wdsAppTypeNames) {
    const namedApp = apps.filter(app => app.appType === appTypeName && app.appName === `${prefix}-${app.workspaceId}` && healthyStates.includes(app.status))
    if (namedApp.length === 1) {
      return namedApp[0]
    }

    //Failed to find an app with the proper name, look for a RUNNING WDS app
    const runningWdsApps = apps.filter(app => app.appType === appTypeName && app.status === 'RUNNING')
    if (runningWdsApps.length > 0) {
      // Evaluate the earliest-created WDS app
      runningWdsApps.sort((a, b) => new Date(a.auditInfo.createdDate).valueOf() - new Date(b.auditInfo.createdDate).valueOf())
      return runningWdsApps[0]
    }

    // If we reach this logic, we have more than one Leo app with the associated workspace Id...
    const allWdsApps = apps.filter(app => app.appType === appTypeName && ['PROVISIONING', 'STOPPED', 'STOPPING'].includes(app.status))
    if (allWdsApps.length > 0) {
      // Evaluate the earliest-created WDS app
      allWdsApps.sort((a, b) => new Date(a.auditInfo.createdDate).valueOf() - new Date(b.auditInfo.createdDate).valueOf())
      return allWdsApps[0]
    }
  }

  return ''
}

// Extract WDS proxy URL from Leo response. Exported for testing
export const resolveWdsUrl = apps => {
  const foundApp = resolveApp(apps, 'wds')
  if (foundApp?.status === 'RUNNING') {
    return foundApp.proxyUrls.wds
  }
  return ''
}

// Extract CBAS proxy URL from Leo response. Exported for testing
export const resolveCbasUrl = apps => {
  const foundApp = resolveApp(apps, 'cbas')
  if (foundApp?.status === 'RUNNING') {
    return foundApp.proxyUrls.cbas
  }
  return ''
}

export const loadAppUrls = async workspaceId => {
  // for local testing - since we use local WDS setup, we don't need to call Leo to get proxy url
  // for CBAS UI deployed in app - we don't want to decouple CBAS and WDS yet. Until then we keep using WDS url passed in config.
  //                               When we are ready for that change to be released, we should remove `wdsUrlRoot` from cromwhelm configs
  //                               and then CBAS UI will talk to Leo to get WDS url root.

  const wdsUrlRoot = getConfig().wdsUrlRoot
  const cbasUrlRoot = getConfig().cbasUrlRoot

  let wdsProxyUrlResponse = { status: 'None', state: '' }
  let cbasProxyUrlResponse = { status: 'None', state: '' }

  if (wdsUrlRoot) {
    wdsProxyUrlResponse = { status: 'Ready', state: wdsUrlRoot }
    // setWdsProxyUrl(wdsProxyUrlResponse)
  } else {
    try {
      const wdsUrl = await Ajax().Apps.listAppsV2(workspaceId).then(resolveWdsUrl)
      if (!!wdsUrl) {
        wdsProxyUrlResponse = { status: 'Ready', state: wdsUrl }
      }
    } catch (error) {
      if (error.status === 401) wdsProxyUrlResponse = { status: 'Unauthorized', state: error }
      else wdsProxyUrlResponse = { status: 'Error', state: error }
    }
  }

  if (cbasUrlRoot) {
    cbasProxyUrlResponse = { status: 'Ready', state: cbasUrlRoot }
  } else {
    try {
      const cbasUrl = await Ajax().Apps.listAppsV2(workspaceId).then(resolveCbasUrl)
      if (!!cbasUrl) {
        cbasProxyUrlResponse = { status: 'Ready', state: cbasUrl }
      }
    } catch (error) {
      if (error.status === 401) cbasProxyUrlResponse = { status: 'Unauthorized', state: error }
      else cbasProxyUrlResponse = { status: 'Error', state: error }
    }
  }

  return {
    wds: wdsProxyUrlResponse,
    cbas: cbasProxyUrlResponse
  }
}

export const parseMethodString = methodString => {
  const methodNameParts = methodString.split('.')
  return {
    workflow: methodNameParts[0],
    call: methodNameParts.length === 3 ? methodNameParts[1] : '',
    variable: methodNameParts[methodNameParts.length - 1]
  }
}

export const inputSourceLabels = {
  literal: 'Type a Value',
  record_lookup: 'Fetch from Data Table',
  object_builder: 'Use Struct Builder',
  none: 'None'
}
const inputSourceTypes = _.invert(inputSourceLabels)

const inputTypeParamDefaults = {
  literal: { parameter_value: '' },
  record_lookup: { record_attribute: '' },
  object_builder: { fields: [] }
}

export const RecordLookupSelect = props => {
  const {
    source,
    setSource,
    dataTableAttributes
  } = props

  return h(Select, {
    isDisabled: false,
    'aria-label': 'Select an Attribute',
    isClearable: false,
    value: source.record_attribute,
    onChange: ({ value }) => {
      const newAttribute = _.get(`${value}.name`, dataTableAttributes)
      const newSource = {
        type: source.type,
        record_attribute: newAttribute
      }
      setSource(newSource)
    },
    placeholder: source.record_attribute || 'Select Attribute',
    options: _.keys(dataTableAttributes),
    // ** https://stackoverflow.com/questions/55830799/how-to-change-zindex-in-react-select-drowpdown
    styles: { container: old => ({ ...old, display: 'inline-block', width: '100%' }), menuPortal: base => ({ ...base, zIndex: 9999 }) },
    menuPortalTarget: document.body,
    menuPlacement: 'top'
  })
}

export const WithWarnings = props => {
  const {
    baseComponent,
    warningMessage
  } = props

  return div({ style: { display: 'flex', alignItems: 'center', width: '100%', paddingTop: '0.5rem', paddingBottom: '0.5rem' } }, [
    baseComponent,
    warningMessage && h(TooltipTrigger, { content: warningMessage }, [
      icon('error-standard', {
        size: 14, style: { marginLeft: '0.5rem', color: colors.warning(), cursor: 'help' }
      })
    ])
  ])
}


export const ParameterValueTextInput = props => {
  const {
    id,
    inputType,
    source,
    setSource
  } = props

  const updateSourceValueToExpectedType = (primitiveType, value) => {
    if (isPrimitiveTypeInputValid(primitiveType, value)) {
      const updatedValue = convertToPrimitiveType(primitiveType, value)

      const newSource = {
        type: source.type,
        parameter_value: updatedValue
      }
      setSource(newSource)
    }
  }

  return h(TextInput, {
    id,
    'aria-label': 'Enter a value',
    style: { display: 'block', width: '100%' },
    value: source.parameter_value,
    onChange: value => {
      const newSource = {
        type: source.type,
        parameter_value: value
      }
      setSource(newSource)
    },
    onBlur: () => {
      if (source.parameter_value) {
        // for primitive and optional primitive inputs we convert value of these inputs to expected types
        if (inputType.type === 'primitive') {
          updateSourceValueToExpectedType(inputType.primitive_type, source.parameter_value)
        }

        if (inputType.type === 'optional' && inputType.optional_type.type === 'primitive') {
          updateSourceValueToExpectedType(inputType.optional_type.primitive_type, source.parameter_value)
        }
      }
    }
  })
}

export const InputSourceSelect = props => {
  const {
    source,
    setSource,
    inputType
  } = props
  const isOptional = inputType.type === 'optional'
  const innerInputType = isOptional ? inputType.optional_type.type : inputType.type
  const editorType = innerInputType === 'struct' ? 'object_builder' : 'literal'

  return h(Select, {
    isDisabled: false,
    'aria-label': 'Select an Option',
    isClearable: false,
    value: (source && _.get(source.type, inputSourceLabels)) || null,
    onChange: ({ value }) => {
      const newType = _.get(value, inputSourceTypes)
      let newSource

      if (newType === 'none') {
        newSource = {
          type: newType
        }
      } else {
        const paramDefault = _.get(newType, inputTypeParamDefaults)
        newSource = {
          type: newType,
          ...paramDefault
        }
      }
      setSource(newSource)
    },
    placeholder: 'Select Source',
    options: [
      inputSourceLabels[editorType],
      inputSourceLabels['record_lookup'],
      ...isOptional ? [inputSourceLabels.none] : []
    ],
    // ** https://stackoverflow.com/questions/55830799/how-to-change-zindex-in-react-select-drowpdown
    styles: { container: old => ({ ...old, display: 'inline-block', width: '100%' }), menuPortal: base => ({ ...base, zIndex: 9999 }) },
    menuPortalTarget: document.body,
    menuPlacement: 'top'
  })
}

export const StructBuilderLink = props => {
  const {
    onClick, structBuilderVisible
  } = props
  return h(Link, {
    display: 'block',
    width: '100%',
    onClick
  },
  structBuilderVisible ? 'Hide Struct' : 'View Struct'
  )
}

const validateRequirements = (inputSource, inputType) => {
  if (inputType.type === 'optional') {
    return true
  }

  if (inputSource) {
    if (inputSource.type === 'none') {
      return false
    }
    if (inputSource.type === 'object_builder') {
      if (_.isEmpty(inputSource.fields)) {
        return false
      }

      const fieldsValidated = _.map(
        field => validateRequirements(field.source, field.field_type), _.merge(inputSource.fields, inputType.fields))
      return _.every(Boolean, fieldsValidated)
    }
    if (inputSource.type === 'literal') {
      return !!inputSource.parameter_value
    }
  } else return false

  return true
}

const validateRecordLookups = (source, recordAttributes) => {
  if (source) {
    if (source.type === 'record_lookup' && !recordAttributes.includes(source.record_attribute)) {
      return false
    }
    if (source.type === 'object_builder') {
      if (source.fields) {
        const fieldsValidated = _.map(field => field && validateRecordLookups(field.source, recordAttributes), source.fields)
        return _.every(Boolean, fieldsValidated)
      } else return false
    }

    return true
  } else return false
}

// Note: this conversion function is called only after checking that values being converted are valid.
//       Hence we don't check the validity of inputs here
export const convertToPrimitiveType = (primitiveType, value) => {
  return Utils.cond(
    [primitiveType === 'Int', () => parseInt(value)],
    [primitiveType === 'Float', () => parseFloat(value)],
    [primitiveType === 'Boolean' && typeof value != 'boolean', () => value === 'true'],
    () => value
  )
}

export const isPrimitiveTypeInputValid = (primitiveType, value) => {
  return Utils.cond(
    [primitiveType === 'Int', () => !isNaN(value) && Number.isInteger(Number(value))],
    [primitiveType === 'Float', () => !isNaN(value) && !isNaN(parseFloat(value))],
    [primitiveType === 'Boolean', () => value.toString().toLowerCase() === 'true' || value.toString().toLowerCase() === 'false'],
    () => true
  )
}

const validateParameterValueSelect = (inputSource, inputType) => {
  if (inputSource) {
    // for user entered values and inputs that have primitive type, we validate that value matches expected type
    if (inputSource.type === 'literal') {
      if (inputType.type === 'primitive') {
        return isPrimitiveTypeInputValid(inputType.primitive_type, inputSource.parameter_value)
      }

      if (inputType.type === 'optional' && inputType.optional_type.type === 'primitive') {
        return isPrimitiveTypeInputValid(inputType.optional_type.primitive_type, inputSource.parameter_value)
      }
    }

    // for object_builder source type, we check that each field with user entered values and inputs that have
    // primitive type have values that match the expected input type
    if (inputSource.type === 'object_builder') {
      if (inputSource.fields) {
        const fieldsValidated = _.map(field => field && validateParameterValueSelect(field.source, field.field_type), _.merge(inputSource.fields, inputType.fields))
        return _.every(Boolean, fieldsValidated)
      }
    }
  }

  return true
}

export const requiredInputsWithoutSource = inputDefinition => {
  return _.filter(i => !validateRequirements(i.source, i.input_type || i.field_type), inputDefinition)
}

export const inputsMissingRequiredAttributes = (inputDefinition, dataTableAttributes) => {
  return _.filter(i => !validateRecordLookups(i.source, _.keys(dataTableAttributes)), inputDefinition)
}

export const inputsWithIncorrectValues = inputDefinition => {
  return _.filter(i => !validateParameterValueSelect(i.source, i.input_type || i.field_type), inputDefinition)
}
