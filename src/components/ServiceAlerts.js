import { differenceInDays, parseJSON } from 'date-fns/fp'
import _ from 'lodash/fp'
import { Fragment, useEffect, useState } from 'react'
import { div, h } from 'react-hyperscript-helpers'
import { Link } from 'src/components/common'
import { Ajax } from 'src/libs/ajax'
import { getDynamic, setDynamic } from 'src/libs/browser-storage'
import { withErrorIgnoring } from 'src/libs/error'
import { clearNotification, notify } from 'src/libs/notifications'
import * as Utils from 'src/libs/utils'


const alertHashes = alerts => {
  return Promise.all(_.map(alert => Utils.sha256(JSON.stringify(alert)), alerts))
}

export const ServiceAlerts = () => {
  const [alerts, setAlerts] = useState([])
  const prevAlerts = Utils.usePrevious(alerts)

  Utils.usePollingEffect(withErrorIgnoring(
    async () => setAlerts(_.uniqWith(_.isEqual, await Ajax().Buckets.getServiceAlerts()))
  ), { ms: 60000, leading: true })

  const displayNewAlerts = async () => {
    const now = new Date()
    const newAlerts = _.differenceWith(_.isEqual, alerts, prevAlerts)
    const newHashes = await alertHashes(newAlerts)
    const newAlertsWithHashes = _.filter(([, hash]) => {
      const dismissal = getDynamic(localStorage, `dismiss-alerts/${hash}`)
      return !dismissal || differenceInDays(parseJSON(dismissal.date), now) >= 1
    }, _.zip(newAlerts, newHashes))
    _.forEach(([{ link: readMoreLink, message, title, 'link-title': linkTitle, severity }, hash]) => {
      notify(
        severity === 'info' ? 'info' : 'warn',
        h(Fragment, [
          div({ style: { fontSize: 14 } }, title),
          div({ style: { fontSize: 12, fontWeight: 500 } }, [
            message,
            div({ style: { marginTop: '1rem', display: 'flex' } }, [
              readMoreLink && h(Link, { ...Utils.newTabLinkProps, href: readMoreLink, style: { fontWeight: 700 } }, [
                linkTitle || 'Read more'
              ]),
              h(Link, {
                onClick: () => {
                  clearNotification(`alert-${hash}`)
                  setDynamic(localStorage, `dismiss-alerts/${hash}`, { date: now })
                },
                style: { marginLeft: 'auto' }
              }, ['Dismiss'])
            ])
          ])
        ]),
        { id: `alert-${hash}` }
      )
    }, newAlertsWithHashes)
  }
  const clearOutdatedAlerts = async () => {
    const outdatedAlerts = _.differenceWith(_.isEqual, prevAlerts, alerts)
    const outdatedHashes = await alertHashes(outdatedAlerts)
    _.forEach(hash => clearNotification(`alert-${hash}`), outdatedHashes)
  }
  useEffect(() => {
    if (prevAlerts) {
      displayNewAlerts()
      clearOutdatedAlerts()
    }
  })

  return null
}

export default ServiceAlerts
