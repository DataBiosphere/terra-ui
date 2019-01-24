import { notify, sessionTimeoutProps } from 'src/components/Notifications'
import { reloadAuthToken, signOut } from 'src/libs/auth'


export const reportError = async (title, obj) => {
  if (obj instanceof Response && obj.status === 401 && !(await reloadAuthToken())) {
    notify('Session timed out', sessionTimeoutProps)
    signOut()
  } else {
    notify('error', title, { detail: await (obj instanceof Response ? obj.text() : obj) })
  }
}
