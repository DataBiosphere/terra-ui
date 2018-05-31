import { Fragment } from 'react'
import { div, h, iframe } from 'react-hyperscript-helpers'
import Collapse from 'src/components/Collapse'
import * as Style from 'src/libs/style'
import * as Utils from 'src/libs/utils'
import { Component } from 'src/libs/wrapped-components'


export default class ErrorView extends Component {
  render() {
    const { containerStyle, error } = this.props

    return h(Collapse, {
      style: { marginTop: '1rem', ...containerStyle },
      title: 'Error details',
      defaultHidden: true
    }, [
      Utils.cond(
        [this.errorIsHTML(), () => this.renderHTMLError()],
        () => `Unknown, text is: ${error}`
      )
    ])
  }

  errorIsHTML() {
    const { error } = this.props
    return error[0] === '<'
  }

  renderHTMLError() {
    const { error } = this.props

    const htmlDoc = new DOMParser().parseFromString(error, 'text/xml')
    const textContent = htmlDoc.getElementsByTagName('body')[0].textContent

    return h(Fragment, [
      'The server returned an HTML document, its content is:',
      div({ style: { padding: '0.5rem', fontWeight: 400 } }, [
        decodeURIComponent(textContent)
      ]),
      h(Collapse, {
        style: { padding: '0.5rem' },
        title: 'Full response',
        defaultHidden: true
      }, [
        iframe({
          style: {
            width: '100%',
            border: Style.standardLine, borderRadius: 3,
            padding: '1rem', backgroundColor: 'white'
          },
          srcDoc: error, sandbox: ''
        })
      ])
    ])
  }
}
