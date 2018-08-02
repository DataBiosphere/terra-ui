import _ from 'lodash/fp'
import { Component } from 'react'
import { div, h } from 'react-hyperscript-helpers'
import uuid from 'uuid/v4'


/**
 * A simple state container inspired by clojure atoms. Method names were chosen based on similarity
 * to lodash and Immutable. (deref => get, reset! => set, swap! => update)
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
    update: fn => set(fn(value))
  }
}

/**
 * HOC that injects the value of the given atom as a prop. When the atom changes, the wrapped
 * component will re-render
 */
export const connectAtom = (theAtom, name) => WrappedComponent => {
  return class AtomWrapper extends Component {
    constructor(props) {
      super(props)
      this.state = { value: theAtom.get() }
    }

    componentDidMount() {
      theAtom.subscribe(this.handleChange)
    }

    componentWillUnmount() {
      theAtom.unsubscribe(this.handleChange)
    }

    handleChange = value => {
      this.setState({ value })
    }

    render() {
      const { value } = this.state
      return h(WrappedComponent, { ...this.props, [name]: value })
    }
  }
}

export const makePrettyDate = function(dateString) {
  const date = new Date(dateString)
  const now = new Date()
  const oneDayAgo = _.tap(d => d.setDate(d.getDate() - 1), new Date(now))
  const twoDaysAgo = _.tap(d => d.setDate(d.getDate() - 2), new Date(now))
  const oneYearAgo = _.tap(d => d.setFullYear(d.getFullYear() - 1), new Date(now))
  const format = opts => date.toLocaleString(navigator.language, opts)

  return cond(
    [date > oneDayAgo, () => format({ hour: 'numeric', minute: 'numeric' })],
    [date > twoDaysAgo, () => 'Yesterday'],
    [date > oneYearAgo, () => format({ month: 'short', day: 'numeric' })],
    () => format({ year: 'numeric' })
  )
}

export const formatUSD = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format

export const formatNumber = new Intl.NumberFormat('en-US').format

export const workspaceAccessLevels = ['NO ACCESS', 'READER', 'WRITER', 'OWNER', 'PROJECT_OWNER']

const hasAccessLevel = _.curry((required, current) => {
  return workspaceAccessLevels.indexOf(current) >= workspaceAccessLevels.indexOf(required)
})

export const canWrite = hasAccessLevel('WRITER')
export const canRead = hasAccessLevel('READER')

export const log = function(...args) {
  console.groupCollapsed.apply(null, args)
  console.trace('Stack trace:')
  console.groupEnd()
  return _.last(args)
}

const maybeCall = function(maybeFn) {
  return _.isFunction(maybeFn) ? maybeFn() : maybeFn
}

/**
 * Returns the value for the first truthy predicate.
 * If the value is a function, it is invoked.
 *
 * Takes predicate/value pairs in arrays, followed by an optional default value.
 * Returns undefined if no predicate matches and there is no default value.
 */
export const cond = function(...args) {
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

export const generateClusterName = () => `saturn-${uuid()}`

export const waitOneTick = () => new Promise(setImmediate)

export const entityAttributeText = value => {
  return cond(
    [_.has('entityName', value), () => value.entityName],
    [_.has('items', value), () => `[${value.items.length}]`],
    () => value
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

export const bucketBrowserUrl = id => {
  return `https://accounts.google.com/AccountChooser?continue=https://console.cloud.google.com/storage/browser/${id}`
}
