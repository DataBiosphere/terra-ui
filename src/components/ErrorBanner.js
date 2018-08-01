import { div, h } from 'react-hyperscript-helpers'
import { buttonPrimary, Clickable } from 'src/components/common'
import ErrorView from 'src/components/ErrorView'
import { icon } from 'src/components/icons'
import Modal from 'src/components/Modal'
import TopBanner from 'src/components/TopBanner'
import colors from 'src/libs/colors'
import { clearError, errorStore } from 'src/libs/error'
import * as Utils from 'src/libs/utils'
import { Component } from 'src/libs/wrapped-components'


class ErrorBanner extends Component {
  render() {
    const { errorState } = this.props
    const { modal, errorNumber = 0 } = this.state
    const { title, error } = errorState[errorNumber] || {}

    const onFirst = errorNumber === 0
    const onLast = errorNumber + 1 === errorState.length

    return h(TopBanner, {
      isVisible: !!errorState.length,
      onDismiss: () => {
        this.setState({ errorNumber: 0 })
        clearError()
      }
    },
    [
      h(Clickable, {
        disabled: onFirst,
        style: { display: 'flex', color: onFirst ? colors.gray[2] : null },
        onClick: () => this.setState({ errorNumber: errorNumber - 1 })
      }, [icon('angle left')]),
      div({
        style: {
          fontWeight: 500,
          backgroundColor: 'rgba(255, 255, 255, 0.2', borderRadius: '1rem',
          padding: '0.5rem 1rem', margin: '-0.25rem 0'
        }
      }, [errorNumber + 1, '/', errorState.length]),
      h(Clickable, {
        disabled: onLast,
        style: { marginRight: '1rem', display: 'flex', color: onLast ? colors.gray[2] : null },
        onClick: () => this.setState({ errorNumber: errorNumber + 1 })
      }, [icon('angle right')]),
      title,
      h(Clickable, {
        style: { textDecoration: 'underline', marginLeft: '1rem' },
        onClick: () => this.setState({ modal: true })
      }, ['Details...']),
      modal && h(Modal, {
        width: 800,
        title,
        showCancel: false,
        showX: true,
        onDismiss: () => this.setState({ modal: false }),
        okButton: buttonPrimary({ onClick: () => clearError(true) }, 'Refresh Page')
      }, [
        h(ErrorView, { error, collapses: false })
      ])
    ])
  }
}

export default Utils.connectAtom(errorStore, 'errorState')(ErrorBanner)
