import _ from 'lodash/fp'
import * as StateHistory from 'src/libs/state-history'
import * as Utils from 'src/libs/utils'


export const errorStore = Utils.atom([])

export const reportError = (title, error) => {
  errorStore.update(old => _.concat(old, { title, error }))
}

export const clearError = (hard = false) => {
  errorStore.set([])
  if (hard) {
    StateHistory.clearCurrent()
    document.location.reload()
  }
}
