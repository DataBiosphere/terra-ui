import { Component } from 'react'
import { div, hh } from 'react-hyperscript-helpers'
import * as Style from 'src/libs/style'


/**
 * @param onDismiss
 * @param title
 * @param children
 * @param showCancel=true
 * @param okButton
 */
export default hh(class Modal extends Component {
  componentDidMount() {
    document.body.classList.add('overlayOpen')
    if (document.body.scrollHeight > window.innerHeight) {
      document.body.classList.add('overHeight')
    }
  }

  render() {
    const { onDismiss, title, children, showCancel = true, okButton } = this.props

    return div({
      style: {
        backgroundColor: 'black', opacity: '0.5',
        position: 'fixed', left: 0, right: 0, top: 0, bottom: 0
      }
    }, [
      div({
          style: {
            minHeight: '20%', maxHeight: '90%', minWidth: '30%', maxWidth: '90%', borderRadius: 5,
            padding: '1.5rem 1.25rem',
            backgroundColor: 'white', boxShadow: Style.modalShadow, cursor: 'default',
            position: 'fixed', left: '50%', top: '50%', transform: 'translate(-50%, -50%)'
          }
        },
        [
          title ? div({ style: Style.elements.modalTitle }, [title]) : null,
          children,
          showCancel ?
            div({
              style: Style.elements.button,
              onClick: onDismiss
            }, 'Cancel') :
            null,
          okButton
        ])
    ])
  }

  componentWillUnmount() {
    document.body.classList.remove('overlayOpen', 'overHeight')
  }
})
