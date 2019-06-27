import { div, img } from 'react-hyperscript-helpers'
import anvilLogoWhite from 'src/images/brands/anvil/ANVIL-Logo-White.svg'
import anvilLogo from 'src/images/brands/anvil/ANVIL-Logo.svg'
import datastageLogoWhite from 'src/images/brands/datastage/DataSTAGE-Logo-White.svg'
import datastageLogo from 'src/images/brands/datastage/DataSTAGE-Logo.svg'
import fcLogoWhite from 'src/images/brands/firecloud/FireCloud-Logo-White.svg'
import fcLogo from 'src/images/brands/firecloud/FireCloud-Logo.svg'
import terraLogoWhite from 'src/images/brands/terra/logo-grey.svg'
import terraLogoShadow from 'src/images/brands/terra/logo-wShadow.svg'
import terraLogo from 'src/images/brands/terra/logo.svg'
import { isAnvil, isDatastage, isFirecloud, isTerra } from 'src/libs/config'
import * as Utils from 'src/libs/utils'


export const getAppName = (longName = false) => Utils.cond(
  [isFirecloud(), 'FireCloud'],
  [isDatastage(), 'DataStage'],
  [isAnvil(), longName ? 'The NHGRI AnVIL (Genomic Data Science Analysis, Visualization, and Informatics Lab-space)' : 'AnVIL'],
  'Terra'
)

export const returnParam = () => getAppName().toLowerCase()

const pickBrandLogo = (color = false) => Utils.cond(
  [isFirecloud(), color ? fcLogo : fcLogoWhite],
  [isDatastage(), color ? datastageLogo : datastageLogoWhite],
  [isAnvil(), color ? anvilLogo : anvilLogoWhite]
)

export const terraLogoMaker = (logoVariant, style) => img({ src: logoVariant, style })

const brandLogoMaker = (size, color = false) => img({ src: pickBrandLogo(color), style: { height: size, marginRight: '1.5rem' } })

export const signInLogo = () => isTerra() ?
  terraLogoMaker(terraLogo, { height: 150 }) :
  brandLogoMaker(70, true)

export const registrationLogo = () => isTerra() ?
  div({ style: { display: 'flex', alignItems: 'center' } }, [
    terraLogoMaker(terraLogo, { height: 100, marginRight: 20 }),
    div({ style: { fontWeight: 500, fontSize: 70 } }, ['TERRA'])
  ]) :
  brandLogoMaker(100, true)

export const topBarLogo = () => isTerra() ?
  terraLogoMaker(terraLogoShadow, { height: 75, marginRight: '0.1rem' }) :
  brandLogoMaker(50, true)

export const footerLogo = () => isTerra() ? terraLogoMaker(terraLogoWhite, { height: 40 }) : brandLogoMaker(40)
