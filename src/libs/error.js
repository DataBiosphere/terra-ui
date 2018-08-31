import _ from 'lodash/fp'
import { getUser, signOut } from 'src/libs/auth'
import * as StateHistory from 'src/libs/state-history'
import * as Utils from 'src/libs/utils'


export const errorStore = Utils.atom([])

const addError = item => errorStore.update(state => _.concat(state, [item]))

export const reportError = async (title, obj) => {
  if (obj instanceof Response && obj.status === 401 && await getUser().reloadAuthResponse().then(() => false).catch(() => true)) {
    addError({ title: 'Session timed out', error: 'You have been signed out due to inactivity', code: 'sessionTimeout' })
    signOut()
  } else {
    addError({ title, error: await (obj instanceof Response ? obj.text() : obj) })
  }
}

export const clearError = (hard = false) => {
  errorStore.set([])
  if (hard) {
    StateHistory.clearCurrent()
    document.location.reload()
  }
}

export const clearErrorCode = key => {
  errorStore.update(_.remove({ code: key }))
}
