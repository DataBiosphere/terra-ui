import { b, div, img } from 'react-hyperscript-helpers'
import anvilLogo from 'src/images/brands/anvil/ANVIL-Logo.svg'
import anvilLogoWhite from 'src/images/brands/anvil/ANVIL-Logo-White.svg'
import baselineLogo from 'src/images/brands/baseline/baseline-logo-color.svg'
import baselineLogoWhite from 'src/images/brands/baseline/baseline-logo-white.svg'
import bioDataCatalystLogo from 'src/images/brands/bioDataCatalyst/bioDataCatalyst-Logo-color.svg'
import bioDataCatalystLogoWhite from 'src/images/brands/bioDataCatalyst/bioDataCatalyst-Logo-white.svg'
import datastageLogo from 'src/images/brands/datastage/DataSTAGE-Logo.svg'
import datastageLogoWhite from 'src/images/brands/datastage/DataSTAGE-Logo-White.svg'
import elwaziLogo from 'src/images/brands/elwazi/elwazi-logo-color.svg'
import elwaziLogoWhite from 'src/images/brands/elwazi/elwazi-logo-white.svg'
import fcLogo from 'src/images/brands/firecloud/FireCloud-Logo.svg'
import fcLogoWhite from 'src/images/brands/firecloud/FireCloud-Logo-White.svg'
import projectSingularLogo from 'src/images/brands/projectSingular/project-singular-logo-black.svg'
import projectSingularLogoWhite from 'src/images/brands/projectSingular/project-singular-logo-white.svg'
import rareXLogo from 'src/images/brands/rareX/rarex-logo-color.svg'
import rareXLogoWhite from 'src/images/brands/rareX/rarex-logo-white.svg'
import terraLogo from 'src/images/brands/terra/logo.svg'
import terraLogoWhite from 'src/images/brands/terra/logo-grey.svg'
import terraLogoShadow from 'src/images/brands/terra/logo-wShadow.svg'
import colors from 'src/libs/colors'
import {
  getEnabledBrand, isAnvil, isBaseline, isBioDataCatalyst, isDatastage, isElwazi, isFirecloud, isProjectSingular, isRareX, isTerra
} from 'src/libs/config'
import * as Utils from 'src/libs/utils'
import { nonBreakingHyphen } from 'src/pages/library/common'


export const getAppName = ({ longName = false, capitalizeThe = false } = {}) => {
  const maybeCapitalizedThe = capitalizeThe ? 'The' : 'the'

  return Utils.cond(
    [isFirecloud(), () => 'FireCloud'],
    [isDatastage(), () => 'DataStage'],
    [isAnvil(), () => longName ? `${maybeCapitalizedThe} NHGRI AnVIL (Genomic Data Science Analysis, Visualization, and Informatics Lab-space)` : 'AnVIL'],
    [isBioDataCatalyst(), () => 'NHLBI BioData Catalyst'],
    [isBaseline(), () => longName ? `${maybeCapitalizedThe} Baseline Health Study Data Portal` : 'Project Baseline'],
    [isElwazi(), () => longName ? `${maybeCapitalizedThe} eLwazi Open Data Science Platform` : 'eLwazi'],
    [isProjectSingular(), () => 'Project Singular'],
    [isRareX(), () => `${maybeCapitalizedThe} RARE${nonBreakingHyphen}X Data Analysis Platform`],
    () => longName ? 'Terra Community Workbench' : 'Terra'
  )
}

const pickBrandLogo = (color = false) => Utils.cond(
  [isFirecloud(), () => color ? fcLogo : fcLogoWhite],
  [isDatastage(), () => color ? datastageLogo : datastageLogoWhite],
  [isAnvil(), () => color ? anvilLogo : anvilLogoWhite],
  [isBioDataCatalyst(), () => color ? bioDataCatalystLogo : bioDataCatalystLogoWhite],
  [isBaseline(), () => color ? baselineLogo : baselineLogoWhite],
  [isElwazi(), () => color ? elwaziLogo : elwaziLogoWhite],
  [isProjectSingular(), () => color ? projectSingularLogo : projectSingularLogoWhite],
  [isRareX(), () => color ? rareXLogo : rareXLogoWhite]
)

export const terraLogoMaker = (logoVariant, style) => img({ alt: 'Terra', role: 'img', src: logoVariant, style })

const brandLogoMaker = (size, color = false) => img({
  alt: getEnabledBrand().name, role: 'img',
  src: pickBrandLogo(color),
  style: { height: size, marginRight: '1.5rem' }
})

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

export const versionTag = (version, styles) => b({
  style: {
    fontSize: 8, lineHeight: '9px',
    color: 'white', backgroundColor: colors.primary(1.5),
    padding: '3px 5px', verticalAlign: 'middle',
    borderRadius: 2, textTransform: 'uppercase',
    ...styles
  }
}, [version])

export const betaVersionTag = versionTag('Beta', { color: colors.primary(1.5), backgroundColor: 'white', border: `1px solid ${colors.primary(1.5)}` })
