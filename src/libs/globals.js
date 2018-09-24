import _ from 'lodash/fp'
import { forwardRef } from 'react'
import { h } from 'react-hyperscript-helpers'
import * as Utils from 'src/libs/utils'
import { Component } from 'src/libs/wrapped-components'


const globals = Utils.atom(JSON.parse(sessionStorage['globals'] || '{}'))
globals.subscribe(v => {
  if (!v) {
    sessionStorage.removeItem('globals')
  } else {
    sessionStorage['globals'] = JSON.stringify(v)
  }
})

const get = key => globals.get()[key]
const set = _.curry((key, value) => globals.update(m => ({ ...m, [key]: value })))

export const globalObserver = key => WrappedComponent => {
  class GlobalWrapper extends Component {
    constructor(props) {
      super(props)
      this.state = { value: get(key) }
    }

    componentDidMount() {
      globals.subscribe(this.handleChange)
    }

    componentWillUnmount() {
      globals.unsubscribe(this.handleChange)
    }

    handleChange = value => {
      this.setState({ value: value[key] })
    }

    render() {
      const { forwardedRef, ...rest } = this.props
      const { value } = this.state

      return h(WrappedComponent, {
        ref: forwardedRef,
        [key]: value,
        updateGlobal: set(key),
        ...rest
      })
    }
  }

  return forwardRef((props, ref) => h(GlobalWrapper, { forwardedRef: ref, ...props }))
}
