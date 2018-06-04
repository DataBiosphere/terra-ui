import { div, h } from 'react-hyperscript-helpers'
import Interactive from 'react-interactive'
import ErrorView from 'src/components/ErrorView'
import Modal from 'src/components/Modal'
import TopBanner from 'src/components/TopBanner'
import { clearError, errorStore } from 'src/libs/error'
import * as Utils from 'src/libs/utils'
import { Component } from 'src/libs/wrapped-components'


class ErrorBanner extends Component {
  render() {
    const { errorState } = this.props
    const { modal, errorNumber = 0 } = this.state
    const { title, error } = errorState[errorNumber] || {}

    return h(TopBanner, {
      isVisible: !!errorState.length,
      onDismiss: () => {
        clearError()
        this.setState({ errorNumber: 0 })
      }
    },
    [
      div({ style: { display: 'flex' } }, [
        div({
          style: {
            fontWeight: 500,
            backgroundColor: 'rgba(255, 255, 255, 0.2', borderRadius: '1rem',
            padding: '0.5rem 1rem', margin: '-0.25rem 1rem -0.25rem 0'
          }
        }, [errorNumber + 1, '/', errorState.length])
      ]),
      title,
      h(Interactive, {
        as: 'span',
        style: { textDecoration: 'underline', marginLeft: '1rem' },
        onClick: () => this.setState({ modal: true })
      }, ['Details...']),
      div({ style: { flexGrow: 1 } }),
      errorState.length > 1 && h(Interactive, {
        as: 'span',
        style: { textDecoration: 'underline', marginLeft: '1rem' },
        onClick: () => this.setState({ errorNumber: errorNumber + 1 })
      }, ['Next error']),
      modal && h(Modal, {
        width: 800,
        title,
        showCancel: false,
        onDismiss: () => this.setState({ modal: false })
      }, [
        h(ErrorView, { error, collapses: false })
      ])
    ])
  }
}

export default Utils.connectAtom(errorStore, 'errorState')(ErrorBanner)
