import { addDays, differenceInDays, parseJSON } from 'date-fns/fp'
import _ from 'lodash/fp'
import { Fragment, useEffect, useState } from 'react'
import { h } from 'react-hyperscript-helpers'
import { FrameworkServiceLink, ShibbolethLink, UnlinkFenceAccount } from 'src/components/external-account-links'
import { getEnabledBrand } from 'src/libs/brand-utils'
import * as Nav from 'src/libs/nav'
import allProviders from 'src/libs/providers'
import { authStore } from 'src/libs/state'


const getNihLinkExpirationAlert = (status, now) => {
  // Orchestration API returns NIH link expiration time in seconds since epoch
  const dateOfExpiration = status && new Date(status.linkExpireTime * 1000)
  const shouldNotify = Boolean(dateOfExpiration) && now >= addDays(-1, dateOfExpiration)
  if (!shouldNotify) {
    return null
  }

  const hasExpired = now >= dateOfExpiration
  const expireStatus = hasExpired ? 'has expired' : 'will expire soon'

  return {
    id: 'nih-link-expiration',
    title: `Your access to NIH Controlled Access workspaces and data ${expireStatus}.`,
    message: h(Fragment, [
      'To regain access, ',
      h(ShibbolethLink, { style: { color: 'unset', fontWeight: 600, textDecoration: 'underline' } }, ['re-link']),
      ` your eRA Commons / NIH account (${status.linkedNihUsername}) with ${getEnabledBrand().name}.`
    ]),
    severity: 'info'
  }
}

const getFenceLinkExpirationAlert = (provider, status, now) => {
  const { key, name } = provider

  // Bond API returns link time as an ISO formatted string.
  const dateOfExpiration = status && addDays(provider.expiresAfter, parseJSON(status.issued_at))
  const shouldNotify = Boolean(dateOfExpiration) && now >= addDays(-5, dateOfExpiration)

  if (!shouldNotify) {
    return null
  }

  const hasExpired = now >= dateOfExpiration
  const expireStatus = hasExpired ?
    'has expired' :
    `will expire in ${differenceInDays(now, dateOfExpiration)} day(s)`

  const redirectUrl = `${window.location.origin}/${Nav.getLink('fence-callback')}`
  return {
    id: `fence-link-expiration/${key}`,
    title: `Your access to ${name} ${expireStatus}.`,
    message: h(Fragment, [
      'Log in to ',
      h(FrameworkServiceLink, { linkText: expireStatus === 'has expired' ? 'restore ' : 'renew ', provider: key, redirectUrl }),
      ' your access or ',
      h(UnlinkFenceAccount, { linkText: 'unlink ', provider: { key, name } }),
      ' your account.'
    ]),
    severity: 'info'
  }
}


export const getLinkExpirationAlerts = authState => {
  const now = Date.now()

  return _.compact([
    getNihLinkExpirationAlert(authState.nihStatus, now),
    ..._.map(provider => getFenceLinkExpirationAlert(provider, _.get(['fenceStatus', provider.key], authState), now), allProviders)
  ])
}


export const useLinkExpirationAlerts = () => {
  const [alerts, setAlerts] = useState(() => getLinkExpirationAlerts(authStore.get()))
  useEffect(() => {
    return authStore.subscribe(authState => setAlerts(getLinkExpirationAlerts(authState))).unsubscribe
  }, [])
  return alerts
}
