import { h } from 'react-hyperscript-helpers'
import ErrorView from 'src/components/ErrorView'
import Modal from 'src/components/Modal'
import { errorStore, reportError } from 'src/libs/error'
import * as Utils from 'src/libs/utils'

export default Utils.connectAtom(errorStore, 'errorState')(
  ({ errorState }) => {
    if (errorState) {
      const { title, error } = errorState

      return h(Modal, {
        width: 800,
        title,
        showCancel: false,
        onDismiss: () => reportError(undefined)
      }, [
        h(ErrorView, { error, collapses: false })
      ])
    } else {
      return null
    }
  }
)
