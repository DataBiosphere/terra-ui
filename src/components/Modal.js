import _ from 'lodash'
import { Component, Fragment } from 'react'
import { div, h, hh } from 'react-hyperscript-helpers'
import * as Style from 'src/libs/style'


/**
 * @param onDismiss
 * @param title
 * @param children
 * @param showCancel=true
 * @param okButton
 */
export default hh(class Modal extends Component {

  listenForEscape = (e) => {
    if (e.key === 'Escape') {
      this.props.onDismiss()
    }
  }

  componentDidMount() {
    document.body.classList.add('overlayOpen')
    if (document.body.scrollHeight > window.innerHeight) {
      document.body.classList.add('overHeight')
    }

    window.addEventListener('keydown', this.listenForEscape)
  }

  render() {
    const { onDismiss, title, children, showCancel = true, okButton } = this.props

    return h(Fragment, [
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
            okButton
          ])
        ])
    ])
  }

  componentWillUnmount() {
    document.body.classList.remove('overlayOpen', 'overHeight')
    window.removeEventListener('keydown', this.listenForEscape)
  }
})
