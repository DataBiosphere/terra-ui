import { useEffect } from 'react'
import { div } from 'react-hyperscript-helpers'
import { clearNotification, notify } from 'src/components/Notifications'
import { authStore } from 'src/libs/auth'
import * as Utils from 'src/libs/utils'
import * as Profile from 'src/pages/Profile'


export const NihLinkWarning = () => {
  const { nihStatus } = Utils.useAtom(authStore)

  useEffect(() => {
    const notificationId = 'nih-link-warning'

    if (nihStatus) {
      const { linkedNihUsername, linkExpireTime } = nihStatus
      const expireTime = linkExpireTime * 1000
      const expired = expireTime > Date.now()
      const expiringSoon = !expired && expireTime < (Date.now() + (1000 * 60 * 60 * 24))

      if (!!linkedNihUsername && (expired || expiringSoon)) {
        const expirationMessage = expired ? 'has expired' : 'will expire soon'
        notify('info', div({}, [
          `Your access to NIH Controlled Access workspaces and data ${expirationMessage} and your access to NIH Controlled Access workspaces will be revoked. `,
          Profile.renderShibbolethLink('Re-link'),
          ` your Terra and eRA Commons / NIH accounts (${linkedNihUsername}) to retain access to these workspaces and data.`
        ]), { id: notificationId })
      }
    } else {
      clearNotification(notificationId)
    }
  }, [nihStatus])

  return null
}
