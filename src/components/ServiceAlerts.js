import _ from 'lodash/fp'
import { Fragment, useEffect, useState } from 'react'
import { div, h } from 'react-hyperscript-helpers'
import { link } from 'src/components/common'
import { notify } from 'src/components/Notifications'
import { Ajax } from 'src/libs/ajax'
import * as Utils from 'src/libs/utils'


export const ServiceAlerts = () => {
  const [alerts, setAlerts] = useState([])
  const prevAlerts = Utils.usePrevious(alerts)

  Utils.useOnMount(() => {
    const checkAlerts = async () => {
      while (true) {
        try {
          setAlerts(await Ajax().Buckets.getServiceAlerts())
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
      _.forEach(({ link: readMoreLink, message, title, 'link-title': linkTitle, severity }) => notify(
        severity === 'info' ? 'info' : 'warn',
        h(Fragment, [
          div({ style: { fontSize: 14 } }, title),
          div({ style: { fontSize: 12, fontWeight: 500 } }, [
            message,
            readMoreLink && div({ style: { marginTop: '1rem' } }, [
              link({
                target: '_blank',
                href: readMoreLink,
                style: { fontWeight: 700, color: 'white' },
                hover: { color: 'white', textDecoration: 'underline' }
              }, linkTitle || 'Read more')
            ])
          ])
        ])
      ),
      _.differenceWith(_.isEqual, alerts, prevAlerts)
      )
    }
  })

  return null
}

export default ServiceAlerts
