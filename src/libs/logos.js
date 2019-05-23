import '@webcomponents/custom-elements' // this needs to be first, basically only for FF ESR now

import { ClarityIcons } from '@clr/icons'
import _ from 'lodash/fp'
import { div, img } from 'react-hyperscript-helpers'
import { icon } from 'src/components/icons'
import datastageLogoWhite from 'src/icons/brands/datastage/DataSTAGE-Logo-White.svg'
import datastageLogo from 'src/icons/brands/datastage/DataSTAGE-Logo.svg'
import fcIconWhite from 'src/icons/brands/firecloud/FireCloud-icon-white.svg'
import fcLogoWhite from 'src/icons/brands/firecloud/FireCloud-Logo-White.svg'
import fcLogo from 'src/icons/brands/firecloud/FireCloud-Logo.svg'
import terraLogoWhite from 'src/icons/brands/terra/logo-grey.svg'
import terraLogoShadow from 'src/icons/brands/terra/logo-wShadow.svg'
import terraLogo from 'src/icons/brands/terra/logo.svg'
import colors from 'src/libs/colors'
import { isDatastage, isFirecloud, isTerra } from 'src/libs/config'
import * as Utils from 'src/libs/utils'


ClarityIcons.add({ fcIconWhite, terraLogo, terraLogoWhite, terraLogoShadow })

const pickBrandLogo = (color = false) => Utils.cond(
  [isFirecloud(), color ? fcLogo : fcLogoWhite],
  [isDatastage(), color ? datastageLogo : datastageLogoWhite]
)

const brandLongLogo = (size, color = false) => div({ style: { display: 'flex', maxHeight: size, marginRight: '1.5rem' } }, [
  div({ style: { color: color ? colors.secondary() : 'white', textAlign: 'right', fontSize: _.max([size / 10, 9]) } }, [
    img({ src: `data:image/svg+xml,${encodeURIComponent(pickBrandLogo(color))}`, style: { height: `calc(${size}px - 1rem)` } }),
    div(['POWERED BY'])
  ]),
  icon(color ? 'terraLogo' : 'terraLogoWhite', { size, style: { marginLeft: '0.5rem' } })
])

export const getAppName = () => Utils.cond(
  [isFirecloud(), 'FireCloud'],
  [isDatastage(), 'DataStage'],
  'Terra'
)

export const signInLogo = () => isTerra() ?
  icon('terraLogo', { size: 150 }) :
  brandLongLogo(70, true)

export const registrationLogo = () => isTerra() ?
  div({ style: { display: 'flex', alignItems: 'center' } }, [
    icon('terraLogo', { size: 100, style: { marginRight: 20 } }),
    div({ style: { fontWeight: 500, fontSize: 70 } }, ['TERRA'])
  ]) :
  brandLongLogo(100, true)

export const topBarLogo = () => isTerra() ?
  icon('terraLogoShadow', { size: 75, style: { marginRight: '0.1rem' } }) :
  brandLongLogo(50, true)

export const footerLogo = () => isTerra() ? icon('terraLogoWhite', { size: 40 }) : brandLongLogo(40)
