import _ from 'lodash'
import { Fragment } from 'react'
import * as ReactDOM from 'react-dom'
import { div, h } from 'react-hyperscript-helpers'
import { buttonPrimary } from 'src/components/common'
import * as Style from 'src/libs/style'
import * as Utils from 'src/libs/utils'
import { Component } from 'src/libs/wrapped-components'


const modalRoot = document.getElementById('modal-root')

/**
 * @param onDismiss
 * @param title
 * @param children
 * @param showCancel=true
 * @param okButton
 */
export default class Modal extends Component {
  constructor(props) {
    super(props)
    this.el = document.createElement('div')
  }

  listenForEscape = e => {
    if (e.key === 'Escape') {
      this.props.onDismiss()
    }
  }

  componentDidMount() {
    const root = document.getElementById('root')
    root.classList.add('overlayOpen')
    if (root.scrollHeight > window.innerHeight) {
      root.classList.add('overHeight')
    }

    window.addEventListener('keydown', this.listenForEscape)
    modalRoot.appendChild(this.el)
  }

  render() {
    const { onDismiss, title, children, showCancel = true, okButton } = this.props

    const component = h(Fragment, [
      div({
        style: {
          backgroundColor: 'black', opacity: '0.5',
          position: 'fixed', left: 0, right: 0, top: 0, bottom: 0
        }
      }),
      div({
        style: {
          minHeight: '20%', maxHeight: '90%', minWidth: '30%', maxWidth: '90%', borderRadius: 5,
          padding: '1.5rem 1.25rem',
          backgroundColor: 'white', boxShadow: Style.modalShadow,
          position: 'fixed', left: '50%', top: '50%', transform: 'translate(-50%, -50%)',
          display: 'flex', flexDirection: 'column'
        }
      },
      [
        title ? div({ style: { fontSize: 18, marginBottom: '1rem' } }, [title]) : null,
        children,
        div({
          style: {
            flexShrink: 0, marginTop: '1rem', alignSelf: 'flex-end',
            display: 'flex', alignItems: 'baseline'
          }
        }, [
          showCancel ?
            div({
              style: _.merge({ marginRight: '1rem' }, Style.elements.button),
              onClick: onDismiss
            }, 'Cancel') :
            null,
          Utils.cond(
            [okButton === undefined, () => buttonPrimary({ onClick: onDismiss }, 'OK')],
            [_.isString(okButton), () => buttonPrimary({ onClick: onDismiss }, okButton)],
            [_.isFunction(okButton), () => buttonPrimary({ onClick: okButton }, 'OK')],
            () => okButton
          )
        ])
      ])
    ])

    return ReactDOM.createPortal(component, this.el)
  }

  componentWillUnmount() {
    document.getElementById('root').classList.remove('overlayOpen', 'overHeight')
    window.removeEventListener('keydown', this.listenForEscape)
    modalRoot.removeChild(this.el)
  }
}
