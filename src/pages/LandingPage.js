import { Fragment } from 'react'
import { div, h, span } from 'react-hyperscript-helpers'
import { Clickable, Link, makeIconButton } from 'src/components/common'
import FooterWrapper from 'src/components/FooterWrapper'
import { icon } from 'src/components/icons'
import TopBar from 'src/components/TopBar'
import landingPageHero from 'src/images/landing-page-hero.jpg'
import colors from 'src/libs/colors'
import { isFirecloud, isTerra } from 'src/libs/config'
import { getAppName } from 'src/libs/logos'
import * as Nav from 'src/libs/nav'
import * as Style from 'src/libs/style'
import * as Utils from 'src/libs/utils'


const styles = {
  heavy: { fontWeight: 600 },
  nowrap: { whiteSpace: 'nowrap' }
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

const makeCard = (link, title, body) => h(Clickable, {
  'aria-label': title,
  href: Nav.getLink(link),
  style: { ...Style.elements.card.container, height: 245, width: 225, marginRight: '1rem', justifyContent: undefined },
  hover: { boxShadow: '0 3px 7px 0 rgba(0,0,0,0.5), 0 5px 3px 0 rgba(0,0,0,0.2)' }
}, [
  div({ style: { color: colors.accent(), fontSize: 18, fontWeight: 500, lineHeight: '22px', marginBottom: '0.5rem' } }, title),
  div({ style: { lineHeight: '22px' } }, body),
  div({ style: { flexGrow: 1 } }),
  makeIconButton('arrowRight', { tabIndex: '-1', 'aria-hidden': true, size: 30, style: { alignSelf: 'flex-end' } })
])

const LandingPage = () => {
  return h(FooterWrapper, [
    h(TopBar),
    div({
      role: 'main',
      style: {
        flexGrow: 1,
        color: colors.dark(),
        padding: '3rem 5rem',
        backgroundImage: `url(${landingPageHero})`,
        backgroundRepeat: 'no-repeat', backgroundSize: '750px', backgroundPosition: 'right 0 top 0'
      }
    }, [
      div({ style: { fontSize: 54 } }, `Welcome to ${getAppName()}`),
      div({ style: { fontSize: 20, lineHeight: '28px', margin: '1rem 0', width: 575 } }, [
        `${getAppName(true)} is a ${isTerra() ? 'cloud-native platform' : 'project powered by Terra'} for biomedical researchers to `,
        span({ style: { ...styles.heavy, ...styles.nowrap } }, 'access data'), ', ',
        span({ style: { ...styles.heavy, ...styles.nowrap } }, 'run analysis tools'), ', ',
        span({ style: styles.nowrap }, ['and', span({ style: styles.heavy }, ' collaborate'), '.'])
      ]),
      makeDocLink('https://support.terra.bio/hc/en-us', 'Find how-to\'s, documentation, video tutorials, and discussion forums'),
      isTerra() && makeDocLink('https://broadinstitute.zendesk.com/knowledge/articles/360033416672',
        'Learn more about the Terra platform and our co-branded sites'),
      isFirecloud() && h(Fragment, [
        makeDocLink('https://support.terra.bio/hc/en-us/articles/360022694271',
          'Already a FireCloud user? Learn what\'s new.'),
        makeDocLink('https://broadinstitute.zendesk.com/knowledge/articles/360033416912',
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
      (isTerra() || isFirecloud()) && div({ style: { width: 700, marginTop: '4rem' } }, [
        'This project has been funded in whole or in part with Federal funds from the National Cancer Institute, National Institutes of Health, ',
        'Task Order No. 17X053 under Contract No. HHSN261200800001E'
      ])
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
