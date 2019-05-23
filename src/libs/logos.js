import _ from 'lodash/fp'
import { div, img } from 'react-hyperscript-helpers'
import datastageLogoWhite from 'src/icons/brands/datastage/DataSTAGE-Logo-White.svg'
import datastageLogo from 'src/icons/brands/datastage/DataSTAGE-Logo.svg'
import fcLogoWhite from 'src/icons/brands/firecloud/FireCloud-Logo-White.svg'
import fcLogo from 'src/icons/brands/firecloud/FireCloud-Logo.svg'
import terraLogoWhite from 'src/icons/brands/terra/logo-grey.svg'
import terraLogoShadow from 'src/icons/brands/terra/logo-wShadow.svg'
import terraLogo from 'src/icons/brands/terra/logo.svg'
import colors from 'src/libs/colors'
import { isDatastage, isFirecloud, isTerra } from 'src/libs/config'
import * as Utils from 'src/libs/utils'


const pickBrandLogo = (color = false) => Utils.cond(
  [isFirecloud(), color ? fcLogo : fcLogoWhite],
  [isDatastage(), color ? datastageLogo : datastageLogoWhite]
)

const brandLongLogo = (size, color = false) => div({ style: { display: 'flex', maxHeight: size, marginRight: '1.5rem' } }, [
  div({ style: { color: color ? colors.secondary() : 'white', textAlign: 'right', fontSize: _.max([size / 10, 9]) } }, [
    img({ src: pickBrandLogo(color), style: { height: `calc(${size}px - 1rem)` } }),
    div(['POWERED BY'])
  ]),
  terraLogoMaker(color ? terraLogo : terraLogoWhite, { height: size, marginLeft: '0.5rem' })
])

export const terraLogoMaker = (logoVariant, style) => img({
  src: logoVariant, style
})

export const getAppName = () => Utils.cond(
  [isFirecloud(), 'FireCloud'],
  [isDatastage(), 'DataStage'],
  'Terra'
)

export const signInLogo = () => isTerra() ?
  terraLogoMaker(terraLogo, { height: 150 }) :
  brandLongLogo(70, true)

export const registrationLogo = () => isTerra() ?
  div({ style: { display: 'flex', alignItems: 'center' } }, [
    terraLogoMaker(terraLogo, { height: 100, marginRight: 20 }),
    div({ style: { fontWeight: 500, fontSize: 70 } }, ['TERRA'])
  ]) :
  brandLongLogo(100, true)

export const topBarLogo = () => isTerra() ?
  terraLogoMaker(terraLogoShadow, { height: 75, marginRight: '0.1rem' }) :
  brandLongLogo(50, true)

export const footerLogo = () => isTerra() ? terraLogoMaker(terraLogoWhite, { height: 40 }) : brandLongLogo(40)
