import { ClarityIcons } from '@clr/icons'
import _ from 'lodash/fp'
import { div, img } from 'react-hyperscript-helpers'
import { icon } from 'src/components/icons'
import fcIconWhite from 'src/icons/brands/firecloud/FireCloud-icon-white.svg'
import fcIcon from 'src/icons/brands/firecloud/FireCloud-icon.svg'
import fcLogoWhite from 'src/icons/brands/firecloud/FireCloud-Logo-White.svg'
import fcLogo from 'src/icons/brands/firecloud/FireCloud-Logo.svg'
import terraLogoWhite from 'src/icons/brands/terra/logo-grey.svg'
import terraLogoShadow from 'src/icons/brands/terra/logo-wShadow.svg'
import terraLogo from 'src/icons/brands/terra/logo.svg'
import { getConfig } from 'src/libs/config'


ClarityIcons.add({ fcIcon, fcIconWhite, terraLogo, terraLogoWhite, terraLogoShadow })

const isFirecloud = () => (window.location.hostname === 'firecloud.terra.bio') || getConfig().useFcLogo

const fcLongLogo = (size, color = false) => div({ style: { display: 'flex', maxHeight: size, marginRight: '1.5rem' } }, [
  div({ style: { color: color ? '#4e7dbf' : 'white', textAlign: 'right', fontSize: _.max([size / 10, 9]) } }, [
    img({ src: `data:image/svg+xml,${encodeURIComponent(color ? fcLogo : fcLogoWhite)}`, style: { height: `calc(${size}px - 1rem)` } }),
    div(['POWERED BY'])
  ]),
  icon(color ? 'terraLogo' : 'terraLogoWhite', { size, style: { marginLeft: '0.5rem' } })
])


export const logo = props => icon(isFirecloud() ? 'fcIcon' : 'terraLogo', props)

export const signInLogo = () => isFirecloud() ?
  fcLongLogo(70, true) :
  icon('terraLogo', { size: 150 })

export const registrationLogo = () => isFirecloud() ?
  fcLongLogo(100, true) :
  div({ style: { display: 'flex', alignItems: 'center' } }, [
    icon('terraLogo', { size: 100, style: { marginRight: 20 } }),
    div({ style: { fontWeight: 500, fontSize: 70 } }, ['TERRA'])
  ])

export const menuOpenLogo = () => icon(isFirecloud() ? 'fcIconWhite' : 'terraLogoShadow',
  { size: isFirecloud() ? 50 : 75, style: { marginRight: '0.5rem' } })

export const topBarLogo = () => isFirecloud() ?
  fcLongLogo(50) :
  icon('terraLogoShadow', { size: 75, style: { marginRight: '0.1rem' } })

export const footerLogo = () => isFirecloud() ?
  fcLongLogo(40) :
  icon('terraLogoWhite', { size: 40 })
