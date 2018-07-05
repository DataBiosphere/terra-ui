import _ from 'lodash/fp'
import * as StateHistory from 'src/libs/state-history'
import * as Utils from 'src/libs/utils'


export const errorStore = Utils.atom([])

export const reportError = async (title, obj) => {
  const error = await (obj instanceof Response ? obj.text() : obj)
  errorStore.update(old => _.concat(old, { title, error }))
}

export const clearError = (hard = false) => {
  errorStore.set([])
  if (hard) {
    StateHistory.clearCurrent()
    document.location.reload()
  }
}
