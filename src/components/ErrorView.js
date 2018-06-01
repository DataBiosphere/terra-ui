import { Fragment } from 'react'
import { div, h, iframe, pre } from 'react-hyperscript-helpers'
import Collapse from 'src/components/Collapse'
import * as Style from 'src/libs/style'
import * as Utils from 'src/libs/utils'
import { Component } from 'src/libs/wrapped-components'


class StackTraceView extends Component {
  render() {
    const { lines } = this.props

    return h(Collapse, {
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
  }
}


class JSONErrorView extends Component {
  render() {
    const { statusCode, source, causes, stackTrace, message, exceptionClass } = this.props

    return h(Fragment, [
      div({ style: Style.elements.cardTitle }, [
        statusCode && `Error ${statusCode}: `,
        message
      ]),
      source && div({}, [
        `Source: ${source}`,
        exceptionClass && ` (${exceptionClass})`
      ]),
      stackTrace && stackTrace[0] && h(StackTraceView, { lines: stackTrace }),
      causes && causes.map((cause, idx) => h(Collapse, {
        key: idx,
        style: { marginTop: '0.5rem' },
        title: causes.length === 1 ? 'Cause' : `Cause ${idx}`,
        defaultHidden: true
      }, [h(JSONErrorView, cause)]))
    ])
  }
}


export default class ErrorView extends Component {
  render() {
    const { collapses=true, containerStyle, error } = this.props

    const content = Utils.cond(
      [this.errorIsHTML(), () => this.renderHTMLError()],
      [this.errorIsJSON(), () => this.renderJSONError()],
      () => error
    )

    return collapses ? h(Collapse, {
      style: { marginTop: '1rem', ...containerStyle },
      title: 'Error details',
      defaultHidden: true
    }, [content]) :
      content
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
    return h(JSONErrorView, JSON.parse(error))
  }
}
