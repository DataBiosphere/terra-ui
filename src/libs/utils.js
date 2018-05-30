import _ from 'lodash/fp'
import { Component } from 'react'
import { h } from 'react-hyperscript-helpers'
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

  const todayOrYesterday =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    (date.getDate() === now.getDate() - 1 || date.getDate() === now.getDate())

  if (todayOrYesterday) {
    return (date.getDate() === now.getDate() ? 'Today' : 'Yesterday') + ' ' +
      date.toLocaleString(navigator.language, { hour: 'numeric', minute: 'numeric' })
  } else {
    return date.toLocaleString(navigator.language, {
      day: 'numeric',
      month: 'short',
      year: date.getFullYear() === now.getFullYear() ? undefined : 'numeric',
      hour: 'numeric',
      minute: 'numeric'
    })
  }
}

export const formatUSD = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format

export const workspaceAccessLevels = ['NO ACCESS', 'READER', 'WRITER', 'OWNER', 'PROJECT_OWNER']

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
 * Takes predicate/value pairs in arrays, followed by a default value.
 */
export const cond = function(...args) {
  const defaultValue = _.last(args)
  const pairs = args.slice(0, -1)

  const match = _.find(_.head, pairs)

  return maybeCall(match ? match[1] : defaultValue)
}

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
