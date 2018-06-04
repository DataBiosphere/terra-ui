import { div, h } from 'react-hyperscript-helpers'
import Interactive from 'react-interactive'
import ErrorView from 'src/components/ErrorView'
import { icon } from 'src/components/icons'
import Modal from 'src/components/Modal'
import TopBanner from 'src/components/TopBanner'
import { clearError, errorStore } from 'src/libs/error'
import * as Style from 'src/libs/style'
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
      h(Interactive, {
        as: icon('angle left'),
        disabled: onFirst,
        style: onFirst ? { color: Style.colors.disabled } : {},
        onClick: () => this.setState({ errorNumber: errorNumber - 1 })
      }),
      div({
        style: {
          fontWeight: 500,
          backgroundColor: 'rgba(255, 255, 255, 0.2', borderRadius: '1rem',
          padding: '0.5rem 1rem', margin: '-0.25rem 0'
        }
      }, [errorNumber + 1, '/', errorState.length]),
      h(Interactive, {
        as: icon('angle right'),
        disabled: onLast,
        style: { marginRight: '1rem', color: onLast ? Style.colors.disabled : null },
        onClick: () => this.setState({ errorNumber: errorNumber + 1 })
      }),
      title,
      h(Interactive, {
        as: 'span',
        style: { textDecoration: 'underline', marginLeft: '1rem' },
        onClick: () => this.setState({ modal: true })
      }, ['Details...']),
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
