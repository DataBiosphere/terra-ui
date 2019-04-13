import { useEffect } from 'react'
import { div } from 'react-hyperscript-helpers'
import { clearNotification, notify } from 'src/components/Notifications'
import { authStore } from 'src/libs/auth'
import colors from 'src/libs/colors'
import * as Utils from 'src/libs/utils'
import * as Profile from 'src/pages/Profile'


export const NihLinkWarning = () => {
  const { nihStatus } = Utils.useAtom(authStore)

  useEffect(() => {
    const notificationId = 'nih-link-warning'

    if (nihStatus) {
      const { linkedNihUsername, linkExpireTime } = nihStatus
      const expireTime = linkExpireTime * 1000
      const expired = expireTime < Date.now()
      const expiringSoon = !expired && expireTime < (Date.now() + (1000 * 60 * 60 * 24))

      if (!!linkedNihUsername && (expired || expiringSoon)) {
        const expirationMessage = expired ? 'has expired' : 'will expire soon'
        notify('info', div({}, [
          `Your access to NIH Controlled Access workspaces and data ${expirationMessage}. To regain access, `,
          Profile.renderShibbolethLink('re-link', colors.lightGreen),
          ` your eRA Commons / NIH account (${linkedNihUsername}) with Terra.`
        ]), { id: notificationId })
      }
    } else {
      clearNotification(notificationId)
    }
  }, [nihStatus])

  return null
}
