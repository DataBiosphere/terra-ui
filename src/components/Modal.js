import { Component } from 'react'
import { div, hh } from 'react-hyperscript-helpers'
import { buttonPrimary } from 'src/components/common'
import ShowOnClick from 'src/components/ShowOnClick'
import * as Style from 'src/libs/style'


/**
 * @param button
 * @param title
 * @param children
 * @param showCancel=true
 * @param confirmButtonLabel='OK'
 */
export default hh(class Modal extends Component {
  componentDidMount() {
    document.body.classList.add('overlayOpen')
    if (document.body.scrollHeight > window.innerHeight) {
      document.body.classList.add('overHeight')
    }
  }

  render() {
    const { button, title, children, showCancel = true, confirmButtonLabel = 'OK' } = this.props

    return ShowOnClick({
      ref: c => this.showOnClick = c,
      button,
      bgProps: { style: { backgroundColor: 'black', opacity: '0.5', cursor: 'default' } },
      closeOnClick: false
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
              onClick: () => this.showOnClick.setVisibility(false)
            }, 'Cancel') :
            null,
          buttonPrimary({
            onClick: () => this.showOnClick.setVisibility(false)
          }, [confirmButtonLabel])
        ])
    ])
  }

  componentWillUnmount() {
    document.body.classList.remove('overlayOpen', 'overHeight')
  }
})
