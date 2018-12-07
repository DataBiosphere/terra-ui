import { h } from 'react-hyperscript-helpers'
import { Component } from 'react'
import _ from 'lodash/fp'
import * as Utils from 'src/libs/utils'


const loadConfig = _.memoize(async () => {
  const res = await fetch('config.json')
  return res.json()
})

export const configOverridesStore = Utils.atom(
  sessionStorage['config-overrides'] && JSON.parse(sessionStorage['config-overrides'])
)
configOverridesStore.subscribe(v => {
  if (!v) {
    sessionStorage.removeItem('config-overrides')
  } else {
    sessionStorage['config-overrides'] = JSON.stringify(v)
  }
})
// Values in this store will override config settings. This can be used from the console for testing.
window.configOverridesStore = configOverridesStore

export const getConfig = async () => {
  return _.merge(await loadConfig(), configOverridesStore.get())
}

export const withConfig = (name = 'config') => WrappedComponent => {
  class Wrapper extends Component {
    constructor(props) {
      super(props)
      this.state = { config: {} }
    }

    static displayName = 'withConfig()'

    async componentDidMount() {
      this.setState({ config: await getConfig() })
    }

    render() {
      const { config } = this.state
      return h(WrappedComponent, { ...this.props, [name]: config })
    }
  }
  return Wrapper
}
