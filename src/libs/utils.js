import { isToday, isYesterday } from 'date-fns'
import { differenceInCalendarMonths, differenceInSeconds, parseJSON } from 'date-fns/fp'
import _ from 'lodash/fp'
import * as qs from 'qs'
import { div, span } from 'react-hyperscript-helpers'
import { v4 as uuid } from 'uuid'


export const subscribable = () => {
  let subscribers = []
  return {
    subscribe: fn => {
      subscribers = append(fn, subscribers)
      return {
        unsubscribe: () => {
          subscribers = _.without([fn], subscribers)
        }
      }
    },
    next: (...args) => {
      _.forEach(fn => fn(...args), subscribers)
    }
  }
}

/**
 * A simple state container inspired by clojure atoms. Method names were chosen based on similarity
 * to lodash and Immutable. (deref => get, reset! => set, swap! => update, reset to go back to initial value)
 * Implements the Store interface
 */
export const atom = initialValue => {
  let value = initialValue
  const { subscribe, next } = subscribable()
  const get = () => value
  const set = newValue => {
    const oldValue = value
    value = newValue
    next(newValue, oldValue)
  }
  return { subscribe, get, set, update: fn => set(fn(get())), reset: () => set(initialValue) }
}

const dateFormat = new Intl.DateTimeFormat('default', { day: 'numeric', month: 'short', year: 'numeric' })
const monthYearFormat = new Intl.DateTimeFormat('default', { month: 'short', year: 'numeric' })
const completeDateFormat = new Intl.DateTimeFormat('default', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: 'numeric' })
const completeDateFormatParts = [
  new Intl.DateTimeFormat('default', { day: 'numeric', month: 'short', year: 'numeric' }),
  new Intl.DateTimeFormat('default', { hour: 'numeric', minute: 'numeric' })
]

export const makePrettyDate = dateString => {
  const date = new Date(dateString)

  return cond(
    [isToday(date), () => 'Today'],
    [isYesterday(date), () => 'Yesterday'],
    [differenceInCalendarMonths(date, Date.now()) <= 6, () => dateFormat.format(date)],
    () => monthYearFormat.format(date)
  )
}

export const makeStandardDate = dateString => dateFormat.format(new Date(dateString))

export const makeCompleteDate = dateString => completeDateFormat.format(new Date(dateString))

export const makeCompleteDateParts = dateString => {
  return _.map(part => part.format(new Date(dateString)), completeDateFormatParts)
}

/**
 * Returns difference in seconds between current time and supplied JSON formatted date (which is assumed to be older).
 */
export const differenceFromNowInSeconds = jsonDateString => {
  return differenceInSeconds(parseJSON(jsonDateString), Date.now())
}

const usdFormatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })
export const formatUSD = v => cond(
  [_.isNaN(v), () => 'unknown'],
  [(v > 0) && (v < 0.01), () => '< $0.01'],
  () => usdFormatter.format(v)
)

export const formatNumber = new Intl.NumberFormat('en-US').format

export const workspaceAccessLevels = ['NO ACCESS', 'READER', 'WRITER', 'OWNER', 'PROJECT_OWNER']

export const hasAccessLevel = _.curry((required, current) => {
  return workspaceAccessLevels.indexOf(current) >= workspaceAccessLevels.indexOf(required)
})

export const canWrite = accessLevel => hasAccessLevel('WRITER', accessLevel)
export const canRead = accessLevel => hasAccessLevel('READER', accessLevel)
export const isOwner = accessLevel => hasAccessLevel('OWNER', accessLevel)

export const workflowStatuses = ['Queued', 'Launching', 'Submitted', 'Running', 'Aborting', 'Succeeded', 'Failed', 'Aborted']

/**
 * Convenience helper for debugging _.flow pipelines.
 *
 * To inspect intermediate values in a pipeline, use:
 * _.flow(step1, Utils.log, step2)
 */
export const log = (...args) => {
  console.log.apply(null, args) // eslint-disable-line no-console
  return _.last(args)
}

const maybeCall = maybeFn => _.isFunction(maybeFn) ? maybeFn() : maybeFn

/**
 * Takes any number of [predicate, value] pairs, followed by an optional default value.
 * Returns value() for the first truthy predicate, otherwise returns the default value().
 * Returns undefined if no predicate matches and there is no default value.
 *
 * DEPRECATED: If a value is not a function, it will be returned directly instead.
 * This behavior is deprecated, and will be removed in the future.
 */
export const cond = (...args) => {
  console.assert(_.every(arg => {
    return _.isFunction(arg) || (_.isArray(arg) && arg.length === 2 && _.isFunction(arg[1]))
  }, args), 'Invalid arguments to Utils.cond')
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
 * Memoizes an async function for up to `expires` ms.
 * Rejected promises are immediately removed from the cache.
 */
export const memoizeAsync = (asyncFn, { keyFn = _.identity, expires = Infinity }) => {
  const cache = {}
  return (...args) => {
    const now = Date.now()
    const key = keyFn(...args)
    const entry = cache[key]
    if (entry && now < entry.timestamp + expires) {
      return entry.value
    }
    const value = asyncFn(...args)
    cache[key] = { timestamp: now, value }
    value.catch(() => {
      if (cache[key] && cache[key].value === value) {
        delete cache[key]
      }
    })
    return value
  }
}

export const delay = ms => {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export const withDelay = _.curry((ms, wrappedFn) => async (...args) => {
  await delay(ms)
  return wrappedFn(...args)
})

export const onNextTick = (fn, ...args) => setTimeout(() => fn(...args), 0)

// Returns a promise that will never resolve or reject. Useful for cancelling async flows.
export const abandonedPromise = () => {
  return new Promise(() => {})
}

export const generateRuntimeName = () => `saturn-${uuid()}`

export const generateAppName = () => `terra-app-${uuid()}`

export const generatePersistentDiskName = () => `saturn-pd-${uuid()}`

export const waitOneTick = () => new Promise(setImmediate)

// Returns a message explaining that the desired snapshot reference could not be found by name
export const snapshotReferenceMissingError = snapshotReferenceName => {
  return `The requested snapshot reference '${snapshotReferenceName}' could not be found in this workspace.`
}

// Returns a message explaining why the user can't edit the workspace, or undefined if they can
export const editWorkspaceError = ({ accessLevel, workspace: { isLocked } }) => {
  return cond(
    [!canWrite(accessLevel), () => 'You do not have permission to modify this workspace.'],
    [isLocked, () => 'This workspace is locked.']
  )
}

// Returns a message explaining why the user can't compute in the workspace, or undefined if they can
export const computeWorkspaceError = ({ canCompute, workspace: { isLocked } }) => {
  return cond(
    [!canCompute, () => 'You do not have access to run analyses on this workspace.'],
    [isLocked, () => 'This workspace is locked.']
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
      // known issue where toString is incorrectly flagged:
      // eslint-disable-next-line lodash-fp/preferred-alias
      return _.toString(value)
    case 'number':
      return _.toNumber(value)
    case 'boolean':
      return !['false', 'no', '0', ''].includes(_.lowerCase(value))
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

export const append = _.curry((value, arr) => _.concat(arr, [value]))

// Transforms an async function so that it updates a busy flag via the provided callback 'setBusy'
// Note that 'fn' does not get called during the transformation.
export const withBusyState = _.curry((setBusy, fn) => async (...args) => {
  try {
    setBusy(true)
    return await fn(...args)
  } finally {
    setBusy(false)
  }
})

export const newTabLinkProps = { target: '_blank', rel: 'noopener noreferrer' } // https://mathiasbynens.github.io/rel-noopener/

export const newTabLinkPropsWithReferrer = { target: '_blank', rel: 'noopener' }

export const createHtmlElement = (doc, name, attrs) => {
  const element = doc.createElement(name)
  _.forEach(([k, v]) => element.setAttribute(k, v), _.toPairs(attrs))
  return element
}

export const mergeQueryParams = (params, urlString) => {
  const url = new URL(urlString)
  url.search = qs.stringify({ ...qs.parse(url.search, { ignoreQueryPrefix: true, plainObjects: true }), ...params })
  return url.href
}

export const durationToMillis = ({ hours = 0, minutes = 0, seconds = 0 }) => ((hours * 60 * 60) + (minutes * 60) + seconds) * 1000

/**
 * Returns the aria-label to use for a component if applicable.
 *
 * If aria-label was provided, it will be returned
 * If aria-labelledby was provided, or an id was provided and allowId is true, then this will return nothing because the component is already labeled
 * If a tooltip was provided without any of the other attributes, it will be returned to be used as the aria-label
 */
export const getAriaLabelOrTooltip = ({ allowId = false, 'aria-label': ariaLabel, 'aria-labelledby': ariaLabelledBy, id, tooltip }) => {
  return (ariaLabel || ariaLabelledBy || (allowId && id)) ? ariaLabel : tooltip
}

export const maybeParseJSON = maybeJSONString => {
  try {
    return JSON.parse(maybeJSONString)
  } catch {
    return undefined
  }
}

export const sanitizeEntityName = unsafe => unsafe.replace(/[^\w]/g, '-')

export const makeTSV = rows => {
  return _.join('', _.map(row => `${_.join('\t', row)}\n`, rows))
}

export const commaJoin = (list, conjunction = 'or') => {
  return span(_.flow(
    toIndexPairs,
    _.flatMap(([i, val]) => {
      return [(i === 0 ? '' : i === list.length - 1 ? ` ${conjunction} ` : ', '), val]
    })
  )(list))
}

export const sha256 = async message => {
  const hashBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(message))
  return _.flow(
    _.map(v => v.toString(16).padStart(2, '0')),
    _.join('')
  )(new Uint8Array(hashBuffer))
}

export const formatBytes = bytes => {
  if (bytes < 2 ** 10) {
    return `${bytes} B`
  }

  const [prefix, divisor] = [
    ['P', 2 ** 50],
    ['T', 2 ** 40],
    ['G', 2 ** 30],
    ['M', 2 ** 20],
    ['K', 2 ** 10]
  ].find(([_p, d]) => bytes >= d)
  return `${(bytes / divisor).toPrecision(3)} ${prefix}iB`
}

//Truncates an integer to the thousands, i.e. 10363 -> 10k
export const truncateInteger = integer => {
  if (integer < 10000) {
    return `${integer}`
  }

  return `${Math.floor(integer / 1000)}k`
}

/**
 * Polls using a given function until the pollUntil function returns true.
 * @param {() => { result: A, shouldContinue: boolean }} pollFn - The function to poll using
 * @param {number} pollTime - How much time there should be in ms between calls of the pollFn
 * @param {boolean} leading - Whether the function should wait {pollTime} ms before running for the first time

 * @returns {A} - The response of pollFn
 */
export const poll = async (pollFn, pollTime, leading = true) => {
  do {
    leading || await delay(pollTime)
    const r = await pollFn()
    if (!r.shouldContinue) { return r.result }
    leading = false
  } while (true)
}

export const pollWithCancellation = (pollFn, pollTime, leading, signal) => {
  poll(async () => {
    return { result: !signal.aborted && await pollFn(), shouldContinue: !signal.aborted }
  }, pollTime, leading)
}

/**
 * Convert a list of keys into an enum object.
 * @param {string[]} keys
 * @returns {Object}
 */
export const enumify = _.flow(_.map(key => [key, key]), _.fromPairs)
