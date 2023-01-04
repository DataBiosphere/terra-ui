import { Fragment } from 'react'
import { div, h, h1 } from 'react-hyperscript-helpers'
import { Link } from 'src/components/common'
import FooterWrapper from 'src/components/FooterWrapper'
import TopBar from 'src/components/TopBar'
import landingPageHero from 'src/images/landing-page-hero.jpg'
import { getEnabledBrand } from 'src/libs/brand-utils'
import colors from 'src/libs/colors'
import * as Utils from 'src/libs/utils'


export const HeroWrapper = ({ showMenu = true, bigSubhead = false, showDocLink = false, children }) => {
  const brand = getEnabledBrand()

  return h(FooterWrapper, { alwaysShow: true }, [
    h(TopBar, { showMenu }),
    div({
      role: 'main',
      style: {
        flexGrow: 1,
        color: colors.dark(),
        padding: '3rem 5rem',
        backgroundColor: '#fafbfd', // This not-quite-white fallback color was extracted from the background image
        backgroundImage: `url(${landingPageHero})`,
        backgroundRepeat: 'no-repeat', backgroundSize: '750px', backgroundPosition: 'right 0 top 0'
      }
    }, [
      // width is set to prevent text from overlapping the background image and decreasing legibility
      h1({ style: { fontSize: 54, width: 'calc(100% - 460px)' } }, [brand.welcomeHeader]),
      div({
        style: {
          margin: '1rem 0', width: 'calc(100% - 460px)', maxWidth: 700, ...(bigSubhead ?
            { fontSize: 20, lineHeight: '28px' } :
            { fontSize: 16, lineHeight: 1.5 })
        }
      }, [
        brand.description,
        showDocLink ?
          h(Fragment, [
            ' ',
            h(Link, {
              style: { textDecoration: 'underline' },
              href: 'https://support.terra.bio/hc/en-us',
              ...Utils.newTabLinkProps
            }, ['Learn more about Terra.'])
          ]) : null
      ]),
      children
    ])
  ])
}
