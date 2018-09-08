import { Component } from 'react'
import { reportError } from 'src/libs/error'

export default class ErrorWrapper extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  componentDidCatch(error) {
    reportError('An error occurred', error)
    this.setState({ hasError: true })
  }

  render() {
    const { children } = this.props
    const { hasError } = this.state
    return hasError ? null : children
  }
}
