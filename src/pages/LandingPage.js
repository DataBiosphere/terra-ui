import { Fragment } from 'react'
import { div, h, h2 } from 'react-hyperscript-helpers'
import { ButtonOutline, Clickable, HeroWrapper, Link } from 'src/components/common'
import { icon } from 'src/components/icons'
import covidHero from 'src/images/covid-hero.jpg'
import hexButton from 'src/images/hex-button.svg'
import terraHero from 'src/images/terra-hero.png'
import colors from 'src/libs/colors'
import { isFirecloud, isTerra } from 'src/libs/config'
import * as Nav from 'src/libs/nav'
import * as Style from 'src/libs/style'
import * as Utils from 'src/libs/utils'


const styles = {
  card: {
    height: 245,
    width: 225,
    marginRight: `1rem`,
    justifyContent: undefined
  },
  callToActionBanner: {
    backgroundSize: 'cover', borderRadius: 5,
    boxShadow: '0 2px 5px 0 rgba(0,0,0,0.35), 0 3px 2px 0 rgba(0,0,0,0.12)',
    color: 'white', padding: '2rem 1rem'
  }
}

const makeDocLink = (href, title) => {
  return div({
    style: { marginBottom: '1rem', fontSize: 18, width: 600 }
  }, [
    h(Link, {
      href,
      ...Utils.newTabLinkProps,
      style: { fontSize: 18 }
    }, [
      title,
      icon('pop-out', { size: 18, style: { marginLeft: '0.5rem' } })
    ])
  ])
}

const makeRightArrowWithBackgroundIcon = () => div({
  style: {
    height: 30, width: 30,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    alignSelf: 'flex-end',
    backgroundColor: colors.accent(),
    ...(isTerra() ?
      { mask: `url(${hexButton}) center no-repeat`, WebkitMask: `url(${hexButton}) center no-repeat` } :
      { borderRadius: '1rem' })
  }
}, [icon('arrowRight', { color: 'white' })])

const makeCard = (link, title, body) => h(Clickable, {
  href: Nav.getLink(link),
  style: { ...Style.elements.card.container, ...styles.card },
  hover: { boxShadow: '0 3px 7px 0 rgba(0,0,0,0.5), 0 5px 3px 0 rgba(0,0,0,0.2)' }
}, [
  h2({ style: { color: colors.accent(), fontSize: 18, fontWeight: 500, lineHeight: '22px', marginBottom: '0.5rem' } }, title),
  div({ style: { lineHeight: '22px' } }, body),
  div({ style: { flexGrow: 1 } }),
  makeRightArrowWithBackgroundIcon()
])

const LandingPage = () => {
  return h(HeroWrapper, { bigSubhead: true }, [
    makeDocLink('https://support.terra.bio/hc/en-us', 'Find how-to\'s, documentation, video tutorials, and discussion forums'),
    isTerra() && makeDocLink('https://support.terra.bio/hc/en-us/articles/360033416672',
      'Learn more about the Terra platform and our co-branded sites'),
    isFirecloud() && h(Fragment, [
      makeDocLink('https://support.terra.bio/hc/en-us/articles/360022694271',
        'Already a FireCloud user? Learn what\'s new.'),
      makeDocLink('https://support.terra.bio/hc/en-us/articles/360033416912',
        'Learn more about the Cancer Research Data Commons and other NCI Cloud Resources')
    ]),
    div({
      style: { display: 'flex', margin: '2rem 0 1rem 0' }
    }, [
      makeCard('workspaces', 'View Workspaces', [
        'Workspaces connect your data to popular analysis tools powered by the cloud. Use Workspaces to share data, code, and results easily and securely.'
      ]),
      makeCard('library-showcase', 'View Examples', 'Browse our gallery of showcase Workspaces to see how science gets done.'),
      makeCard('library-datasets', 'Browse Data', 'Access data from a rich ecosystem of data portals.')
    ]),
    isTerra() && div({
      style: {
        ...styles.callToActionBanner,
        backgroundColor: '#191a1c', // This fallback color was extracted from the left edge of the background image
        backgroundImage: `url(${covidHero})`,
        width: `calc(${styles.card.width * 3}px + ${styles.card.marginRight} * 2)`
      }
    }, [
      h2({ style: { fontSize: 18, fontWeight: 500, lineHeight: '22px', margin: 0 } }, ['Data & Tools for COVID-19/SARS CoV2 analysis']),
      h(Clickable, {
        href: 'https://support.terra.bio/hc/en-us/articles/360041068771--COVID-19-workspaces-data-and-tools-in-Terra',
        style: { textDecoration: 'underline' },
        ...Utils.newTabLinkProps
      }, ['See this article']),
      ' for a summary of available resources.'
    ]),
    div({
      style: {
        ...styles.callToActionBanner,
        backgroundColor: colors.primary(),
        backgroundImage: `url(${terraHero})`,
        display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        width: `calc(${styles.card.width * 3}px + ${styles.card.marginRight} * 2)`,
        marginTop: 15
      }
    }, [
      div([
        h2({ style: { fontSize: 18, fontWeight: 500, lineHeight: '22px', margin: 0 } }, ['BETA Data Catalog']),
        'Preview the Data Catalog and provide valuable feedback.'
      ]),
      h(ButtonOutline, {
        style: { marginLeft: '2rem', padding: '1.5rem 1rem', textTransform: 'none' },
        onClick: () => { Nav.goToPath('library-browser') }
      }, ['Preview BETA Data Catalog'])
    ]),
    (isTerra() || isFirecloud()) && div({ style: { width: 700, marginTop: '4rem' } }, [
      'This project has been funded in whole or in part with Federal funds from the National Cancer Institute, National Institutes of Health, ',
      'Task Order No. 17X053 under Contract No. HHSN261200800001E'
    ])
  ])
}


export const navPaths = [
  {
    name: 'root',
    path: '/',
    component: LandingPage,
    public: true
  }
]
