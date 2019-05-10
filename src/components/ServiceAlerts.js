import _ from 'lodash/fp'
import { Fragment, useEffect, useState } from 'react'
import { div, h } from 'react-hyperscript-helpers'
import { link } from 'src/components/common'
import { clearNotification, notify } from 'src/components/Notifications'
import { Ajax } from 'src/libs/ajax'
import * as Utils from 'src/libs/utils'


export const ServiceAlerts = () => {
  const [alerts, setAlerts] = useState([])
  const prevAlerts = Utils.usePrevious(alerts)

  Utils.useOnMount(() => {
    const checkAlerts = async () => {
      while (true) {
        try {
          setAlerts(_.uniqWith(_.isEqual, await Ajax().Buckets.getServiceAlerts()))
        } catch {
          // swallowing error, yum!
        }
        await Utils.delay(60000)
      }
    }

    checkAlerts()
  })

  useEffect(() => {
    if (prevAlerts) {
      _.forEach(alert => {
        const { link: readMoreLink, message, title, 'link-title': linkTitle, severity } = alert

        notify(
          severity === 'info' ? 'info' : 'warn',
          h(Fragment, [
            div({ style: { fontSize: 14 } }, title),
            div({ style: { fontSize: 12, fontWeight: 500 } }, [
              message,
              readMoreLink && div({ style: { marginTop: '1rem' } }, [
                link({
                  ...Utils.newTabLinkProps,
                  href: readMoreLink,
                  style: { fontWeight: 700, color: 'white' },
                  hover: { color: 'white', textDecoration: 'underline' }
                }, linkTitle || 'Read more')
              ])
            ])
          ]),
          { id: JSON.stringify(alert) }
        )
      }, _.differenceWith(_.isEqual, alerts, prevAlerts))
      _.forEach(alert => {
        clearNotification(JSON.stringify(alert))
      }, _.differenceWith(_.isEqual, prevAlerts, alerts))
    }
  })

  return null
}

export default ServiceAlerts
