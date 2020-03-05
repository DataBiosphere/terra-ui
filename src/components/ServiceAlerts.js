import _ from 'lodash/fp'
import { Fragment, useEffect, useState } from 'react'
import { div, h } from 'react-hyperscript-helpers'
import { Link } from 'src/components/common'
import { Ajax } from 'src/libs/ajax'
import { withErrorIgnoring } from 'src/libs/error'
import { clearNotification, notify } from 'src/libs/notifications'
import * as Utils from 'src/libs/utils'


export const ServiceAlerts = () => {
  const [alerts, setAlerts] = useState([])
  const prevAlerts = Utils.usePrevious(alerts)

  Utils.usePollingEffect(withErrorIgnoring(
    async () => setAlerts(_.uniqWith(_.isEqual, await Ajax().Buckets.getServiceAlerts()))
  ), { ms: 60000, leading: true })

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
                h(Link, {
                  ...Utils.newTabLinkProps,
                  href: readMoreLink,
                  style: { fontWeight: 700 }
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
