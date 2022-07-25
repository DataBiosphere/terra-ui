import { b, div, img } from 'react-hyperscript-helpers'
import terraLogo from 'src/images/brands/terra/logo.svg'
import terraLogoWhite from 'src/images/brands/terra/logo-grey.svg'
import terraLogoShadow from 'src/images/brands/terra/logo-wShadow.svg'
import { getEnabledBrand, isTerra, pickBrandLogo } from 'src/libs/brand-utils'
import colors from 'src/libs/colors'


export const terraLogoMaker = (logoVariant, style) => img({ alt: 'Terra', role: 'img', src: logoVariant, style })

const brandLogoMaker = (size, color = false) => img({
  alt: getEnabledBrand().name, role: 'img',
  src: pickBrandLogo(color),
  style: { height: size, marginRight: '1.5rem' }
})

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
