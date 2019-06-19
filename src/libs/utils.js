import _ from 'lodash/fp'
import { useEffect, useRef, useState } from 'react'
import { div, h } from 'react-hyperscript-helpers'
import uuid from 'uuid/v4'


/**
 * A simple state container inspired by clojure atoms. Method names were chosen based on similarity
 * to lodash and Immutable. (deref => get, reset! => set, swap! => update, reset to go back to initial value)
 */
export const atom = initialValue => {
  let value = initialValue
  let subscribers = []
  const set = newValue => {
    const oldValue = value
    value = newValue
    subscribers.forEach(fn => fn(newValue, oldValue))
  }
  return {
    subscribe: fn => {
      subscribers = _.union(subscribers, [fn])
    },
    unsubscribe: fn => {
      console.assert(_.includes(fn, subscribers), 'Function is not subscribed')
      subscribers = _.difference(subscribers, [fn])
    },
    get: () => value,
    set,
    update: fn => set(fn(value)),
    reset: () => set(initialValue)
  }
}

/**
 * Hook that returns the value of a given atom. When the atom changes, the component will re-render
 */
export const useAtom = theAtom => {
  const [value, setValue] = useState(theAtom.get())
  useEffect(() => {
    const handleChange = v => setValue(v)
    theAtom.subscribe(handleChange)
    return () => theAtom.unsubscribe(handleChange)
  }, [theAtom, setValue])
  return value
}

/**
 * HOC that injects the value of the given atom as a prop. When the atom changes, the wrapped
 * component will re-render
 */
export const connectAtom = (theAtom, name) => WrappedComponent => {
  const Wrapper = props => {
    const value = useAtom(theAtom)
    return h(WrappedComponent, { ...props, [name]: value })
  }
  Wrapper.displayName = 'connectAtom()'
  return Wrapper
}

/**
 * Sets up the given atom to sync to/from sessionStorage at the given key.
 * On initialization, if the key exists, the value will be read in.
 * If it doesn't, the current value of the atom will be written out.
 */
export const syncAtomToSessionStorage = (theAtom, key) => {
  theAtom.subscribe(v => {
    if (v === undefined) {
      sessionStorage.removeItem(key)
    } else {
      sessionStorage[key] = JSON.stringify(v)
    }
  })
  const existing = (() => {
    try {
      return JSON.parse(sessionStorage[key])
    } catch (e) {
      return undefined
    }
  })()
  theAtom.update(v => existing === undefined ? v : existing)
}

const dateFormat = new Intl.DateTimeFormat('default', { day: 'numeric', month: 'short', year: 'numeric' })
const monthYearFormat = new Intl.DateTimeFormat('default', { month: 'short', year: 'numeric' })
const completeDateFormat = new Intl.DateTimeFormat('default', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: 'numeric' })

const truncateDay = date => {
  date.setHours(0)
  date.setMinutes(0)
  date.setSeconds(0)
  date.setMilliseconds(0)
}

export const makePrettyDate = dateString => {
  const date = new Date(dateString)
  const now = new Date() // cloning now below so it isn't mutated, slightly faster than from scratch https://jsperf.com/new-date-vs-clone-date
  const today = _.tap(truncateDay, new Date(now))
  const yesterday = _.tap(d => { d.setDate(d.getDate() - 1); truncateDay(d) }, new Date(now))
  const sixMonthsAgo = _.tap(d => d.setMonth(d.getMonth() - 6), new Date(now))

  return cond(
    [date >= today, () => 'Today'],
    [date >= yesterday, () => 'Yesterday'],
    [date >= sixMonthsAgo, () => dateFormat.format(date)],
    () => monthYearFormat.format(date)
  )
}

export const makeCompleteDate = dateString => completeDateFormat.format(new Date(dateString))

export const formatUSD = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format

export const formatNumber = new Intl.NumberFormat('en-US').format

export const workspaceAccessLevels = ['NO ACCESS', 'READER', 'WRITER', 'OWNER', 'PROJECT_OWNER']

export const hasAccessLevel = _.curry((required, current) => {
  return workspaceAccessLevels.indexOf(current) >= workspaceAccessLevels.indexOf(required)
})

export const canWrite = hasAccessLevel('WRITER')
export const canRead = hasAccessLevel('READER')
export const isOwner = hasAccessLevel('OWNER')

export const workflowStatuses = ['Queued', 'Launching', 'Submitted', 'Running', 'Aborting', 'Succeeded', 'Failed', 'Aborted']

export const log = (...args) => {
  console.log.apply(null, args)
  return _.last(args)
}

const maybeCall = maybeFn => _.isFunction(maybeFn) ? maybeFn() : maybeFn

/**
 * Returns the value for the first truthy predicate.
 * If the value is a function, it is invoked.
 *
 * Takes predicate/value pairs in arrays, followed by an optional default value.
 * Returns undefined if no predicate matches and there is no default value.
 */
export const cond = (...args) => {
  for (const arg of args) {
    if (_.isArray(arg)) {
      const [predicate, value] = arg
      if (predicate) return maybeCall(value)
    } else {
      return maybeCall(arg)
    }
  }
}

export const DEFAULT = Symbol()

export const switchCase = (value, ...pairs) => {
  const match = _.find(([v]) => v === value || v === DEFAULT, pairs)
  return match && match[1]()
}

export const toIndexPairs = _.flow(_.toPairs, _.map(([k, v]) => [k * 1, v]))

/**
 * Memoizes the given function, but expires after the specified duration (ms).
 * The resolver function is used to generate a cache key from the arguments.
 */
export const memoizeWithTimeout = (fn, resolver, ms) => {
  const cache = {}
  return (...args) => {
    const now = Date.now()
    const key = resolver(...args)
    const cached = cache[key]
    if (cached && now < cached.timestamp + ms) {
      return cached.value
    }
    const value = fn(...args)
    cache[key] = { timestamp: now, value }
    return value
  }
}

export const delay = ms => {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// Returns a promise that will never resolve or reject. Useful for cancelling async flows.
export const abandonedPromise = () => {
  return new Promise(() => {})
}

export const generateClusterName = () => `saturn-${uuid()}`

export const waitOneTick = () => new Promise(setImmediate)

export const entityAttributeText = value => {
  return cond(
    [_.has('entityName', value), () => value.entityName],
    [_.has('items', value), () => `${value.items.length} items`],
    () => value
  )
}

// Returns a message explaining why the user can't edit the workspace, or undefined if they can
export const editWorkspaceError = ({ accessLevel, workspace: { isLocked } }) => {
  return cond(
    [!canWrite(accessLevel), () => 'You do not have permission to modify this workspace.'],
    [isLocked, () => 'This workspace is locked']
  )
}

// Returns a message explaining why the user can't compute in the workspace, or undefined if they can
export const computeWorkspaceError = ({ canCompute, workspace: { isLocked } }) => {
  return cond(
    [!canCompute, () => 'You do not have access to run analyses on this workspace.'],
    [isLocked, () => 'This workspace is locked']
  )
}

export const textMatch = _.curry((needle, haystack) => {
  return haystack.toLowerCase().includes(needle.toLowerCase())
})

export const nextSort = ({ field, direction }, newField) => {
  return newField === field ?
    { field, direction: direction === 'asc' ? 'desc' : 'asc' } :
    { field: newField, direction: 'asc' }
}

export const summarizeErrors = errors => {
  const errorList = cond(
    [_.isPlainObject(errors), () => _.flatMap(_.values, errors)],
    [_.isArray(errors), () => errors],
    () => []
  )
  if (errorList.length) {
    return _.map(([k, v]) => {
      return div({ key: k, style: { marginTop: k !== '0' ? '0.5rem' : undefined } }, [v])
    }, _.toPairs(errorList))
  }
}

export const readFileAsText = file => {
  const reader = new FileReader()
  return new Promise((resolve, reject) => {
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsText(file)
  })
}

/**
 * Returns true if a value can't be coerced into a number.
 */
export const cantBeNumber = _.flow(_.toNumber, _.isNaN)

/**
 * Converts a value to a type. Auto-curries.
 * @param {string} type - 'string', 'number', or 'boolean'
 * @param value
 */
export const convertValue = _.curry((type, value) => {
  switch (type) {
    case 'string':
      return value.toString()
    case 'number':
      return _.toNumber(value)
    case 'boolean':
      return !(_.lowerCase(value) === 'false' || _.lowerCase(value) === 'no' || value === '0')
    default:
      throw new Error('unknown type for convertValue')
  }
})

/**
 * Converts a string to start case, for a label, but handles all caps correctly.
 */
export const normalizeLabel = _.flow(_.camelCase, _.startCase)

export const kvArrayToObject = _.reduce((acc, { key, value }) => _.set(key, value, acc), {})

export const isValidWsExportTarget = _.curry((sourceWs, destWs) => {
  const { workspace: { workspaceId: sourceId, authorizationDomain: sourceAD } } = sourceWs
  const { accessLevel, workspace: { workspaceId: destId, authorizationDomain: destAD } } = destWs

  return sourceId !== destId && canWrite(accessLevel) && (_.intersectionWith(_.isEqual, sourceAD, destAD).length === sourceAD.length)
})

export const normalizeMachineConfig = ({ masterMachineType, masterDiskSize, numberOfWorkers, numberOfPreemptibleWorkers, workerMachineType, workerDiskSize }) => {
  return {
    masterMachineType: masterMachineType || 'n1-standard-4',
    masterDiskSize: masterDiskSize || 50,
    numberOfWorkers: numberOfWorkers || 0,
    numberOfPreemptibleWorkers: (numberOfWorkers && numberOfPreemptibleWorkers) || 0,
    workerMachineType: (numberOfWorkers && workerMachineType) || 'n1-standard-4',
    workerDiskSize: (numberOfWorkers && workerDiskSize) || 50
  }
}

export const append = _.curry((value, arr) => _.concat(arr, [value]))

// Transforms an async function so that it updates a busy flag via the provided callback
export const withBusyState = _.curry((setBusy, fn) => async (...args) => {
  try {
    setBusy(true)
    return await fn(...args)
  } finally {
    setBusy(false)
  }
})

/**
 * Performs the given effect, but only on component mount.
 * React's hooks eslint plugin flags [] because it's a common mistake. However, sometimes this is
 * exactly the right thing to do. This function makes the intention clear and avoids the lint error.
 */
export const useOnMount = fn => {
  useEffect(fn, [])
}

export const usePrevious = value => {
  const ref = useRef()

  useEffect(() => {
    ref.current = value
  })

  return ref.current
}

/*
 * Given a value that changes over time, returns a getter function that reads the current value.
 * Useful for asynchronous processes that need to read the current value of e.g. props or state.
 */
export const useGetter = value => {
  const ref = useRef()
  ref.current = value
  return () => ref.current
}

export const trimClustersOldestFirst = _.flow(
  _.remove({ status: 'Deleting' }),
  _.sortBy('createdDate')
)

export const handleNonRunningCluster = ({ status, googleProject, clusterName }, JupyterAjax) => {
  switch (status) {
    case 'Stopped':
      return JupyterAjax.cluster(googleProject, clusterName).start()
    case 'Creating':
      return delay(15000)
    default:
      return delay(3000)
  }
}

export const newTabLinkProps = { target: '_blank', rel: 'noopener noreferrer' } // https://mathiasbynens.github.io/rel-noopener/

export const createHtmlElement = (doc, name, attrs) => {
  const element = doc.createElement(name)
  _.forEach(([k, v]) => element.setAttribute(k, v), _.toPairs(attrs))
  return element
}
