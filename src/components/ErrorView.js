import PropTypes from 'prop-types'
import { Fragment } from 'react'
import { div, h, iframe, pre } from 'react-hyperscript-helpers'
import Collapse from 'src/components/Collapse'
import * as Style from 'src/libs/style'
import * as Utils from 'src/libs/utils'
import { Component } from 'src/libs/wrapped-components'


const stackTraceView = lines => h(Collapse, {
  style: { marginTop: '0.5rem' },
  title: 'Stack Trace',
  defaultHidden: true
}, [
  pre({ style: { overflowX: 'auto' } }, [
    lines.map(({ className, methodName, fileName, lineNumber }, idx) => div({ key: idx }, [
      `${className}.${methodName} (${fileName}:${lineNumber})`
    ]))
  ])
])


const jsonErrorView = ({ statusCode, source, causes, stackTrace, message, exceptionClass }) => h(Fragment, [
  div({ style: { ...Style.elements.card.title, overflowWrap: 'break-word' } }, [
    statusCode && `Error ${statusCode}: `,
    message
  ]),
  source && div({}, [
    `Source: ${source}`,
    exceptionClass && ` (${exceptionClass})`
  ]),
  stackTrace && stackTrace[0] && stackTraceView(stackTrace),
  causes && causes.map((cause, idx) => h(Collapse, {
    key: idx,
    style: { marginTop: '0.5rem' },
    title: causes.length === 1 ? 'Cause' : `Cause ${idx + 1}`,
    defaultHidden: true
  }, jsonErrorView(cause)))
])


export default class ErrorView extends Component {
  static propTypes = {
    collapses: PropTypes.bool,
    containerStyle: PropTypes.object,
    error: PropTypes.any.isRequired
  }

  static defaultProps = {
    collapses: true
  }

  render() {
    const { collapses, containerStyle, error } = this.props

    const content = Utils.cond(
      [this.errorIsHTML(), () => this.renderHTMLError()],
      [this.errorIsJSON(), () => this.renderJSONError()],
      // 502s due to a service being down result in TypeError in a bunch of places.
      () => error.message || error.toString()
    )

    return div({ style: { marginTop: '1rem' } }, [
      collapses ?
        h(Collapse, {
          style: containerStyle,
          title: 'Error details',
          defaultHidden: true
        }, [content]) :
        content
    ])
  }

  errorIsHTML() {
    const { error } = this.props
    return error[0] === '<'
  }

  renderHTMLError() {
    const { error } = this.props

    return iframe({
      style: {
        width: '100%',
        border: Style.standardLine, borderRadius: 3,
        padding: '1rem', backgroundColor: 'white'
      },
      srcDoc: error, sandbox: ''
    })
  }

  errorIsJSON() {
    const { error } = this.props
    return error[0] === '{'
  }

  renderJSONError() {
    const { error } = this.props
    return jsonErrorView(JSON.parse(error))
  }
}
