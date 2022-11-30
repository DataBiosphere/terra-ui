import _ from 'lodash/fp'
import { useEffect, useState } from 'react'
import { div, h, h2 } from 'react-hyperscript-helpers'
import { ButtonOutline, ButtonPrimary, Clickable, HeroWrapper, Link } from 'src/components/common'
import { icon } from 'src/components/icons'
import hexButton from 'src/images/hex-button.svg'
import terraHero from 'src/images/terra-hero.png'
import { Ajax } from 'src/libs/ajax'
import { getEnabledBrand, isFirecloud, isTerra } from 'src/libs/brand-utils'
import colors from 'src/libs/colors'
import { withErrorHandling } from 'src/libs/error'
import Events from 'src/libs/events'
import * as Nav from 'src/libs/nav'
import { setLocalPref } from 'src/libs/prefs'
import { useCancellation, useStore } from 'src/libs/react-utils'
import { authStore } from 'src/libs/state'
import * as Style from 'src/libs/style'
import * as Utils from 'src/libs/utils'


const styles = {
  card: {
    height: 245,
    width: 225,
    marginRight: '1rem',
    justifyContent: undefined
  },
  callToActionBanner: {
    backgroundSize: 'cover', borderRadius: 5,
    boxShadow: '0 2px 5px 0 rgba(0,0,0,0.35), 0 3px 2px 0 rgba(0,0,0,0.12)',
    color: 'white', padding: '2rem 1rem'
  }
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

const makeDocLinks = _.map(
  ({ link, text }) => div({ style: { marginBottom: '1rem', fontSize: 18 } }, [
    h(Link,
      {
        href: link,
        ...Utils.newTabLinkProps,
        style: { fontSize: 18 }
      }, [
        text,
        icon('pop-out', { size: 18, style: { marginLeft: '0.5rem' } })
      ]
    )
  ])
)

const LandingPage = () => {
  const { isSignedIn } = useStore(authStore)
  const [billingProjects, setBillingProjects] = useState()
  const signal = useCancellation()

  useEffect(() => {
    const loadProjects = withErrorHandling(async error => {
      const errorObj = await error instanceof Response ? error.json() : error
      console.log(`Unable to load billing projects due to: ${errorObj?.message}`) // eslint-disable-line no-console
    })(async () => {
      const projects = await Ajax(signal).Billing.listProjects()
      setBillingProjects(projects)
    })
    if (isSignedIn) {
      loadProjects()
    }
  }, [isSignedIn, setBillingProjects, signal])

  return h(HeroWrapper, { bigSubhead: true }, [
    isTerra() && !_.isUndefined(billingProjects) && _.isEmpty(billingProjects) && div({
      style: {
        ...styles.callToActionBanner,
        width: `calc(${styles.card.width * 3}px + ${styles.card.marginRight} * 2)`,
        color: colors.dark(), backgroundColor: colors.light(), marginBottom: 15
      }
    }, [
      div([
        h2({ style: { fontSize: 18, fontWeight: 600, lineHeight: '28px', margin: 0 } },
          ['To use Terra, you need to link Terra to a cloud billing account for compute and storage costs.'])
      ]),
      h(ButtonPrimary, {
        style: { marginTop: '1.5rem', padding: '1.25rem 5rem', textTransform: 'none' },
        onClick: () => {
          Nav.goToPath('billing')
        }
      }, ['Get Started'])
    ]),
    // width is set to prevent text from overlapping the background image and decreasing legibility
    div({ style: { maxWidth: 'calc(100% - 460px)' } }, makeDocLinks(getEnabledBrand().docLinks)),
    div({ style: { display: 'flex', margin: '2rem 0 1rem 0' } }, [
      makeCard('workspaces', 'View Workspaces', [
        'Workspaces connect your data to popular analysis tools powered by the cloud. Use Workspaces to share data, code, and results easily and securely.'
      ]),
      makeCard('library-showcase', 'View Examples', 'Browse our gallery of showcase Workspaces to see how science gets done.'),
      makeCard('library-datasets', 'Browse Data', 'Access data from a rich ecosystem of data portals.')
    ]),
    isTerra() && div({
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
        h2({ style: { fontSize: 18, fontWeight: 500, lineHeight: '22px', margin: 0 } }, ['New Data Catalog']),
        'Preview the Data Catalog and provide valuable feedback.'
      ]),
      h(ButtonOutline, {
        style: { marginLeft: '2rem', padding: '1.5rem 1rem', textTransform: 'none' },
        onClick: () => {
          Ajax().Metrics.captureEvent(Events.catalogLandingPageBanner)
          setLocalPref('catalog-toggle', true)
          Nav.goToPath('library-datasets')
        }
      }, ['Preview the new Data Catalog'])
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
