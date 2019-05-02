import _ from 'lodash/fp'
import { Fragment } from 'react'
import { div, h } from 'react-hyperscript-helpers'
import { commonPaths } from 'src/components/breadcrumbs'
import DataExplorer from 'src/components/DataExplorer'
import PrivateDataExplorer from 'src/components/PrivateDataExplorer'
import datasets from 'src/libs/datasets'
import * as Nav from 'src/libs/nav'
import * as Style from 'src/libs/style'
import TopBar from 'src/components/TopBar'
import * as Utils from 'src/libs/utils'

// name must be name from Data Explorer dataset.json
// authDomain must be authorization_domain from Data Explorer dataset.json
const datasets = [
  {
    name: '1000 Genomes',
    origin: 'https://test-data-explorer.appspot.com'
  },
  {
    name: 'AMP PD - 2019_v1beta_0220',
    origin: 'https://amp-pd-data-explorer.appspot.com',
    authDomain: 'amp-pd-researchers'
  },
  {
    name: 'Baseline Health Study',
    origin: 'https://baseline-baseline-explorer.appspot.com',
    authDomain: 'baseline-researchers'
  },
  {
    name: 'Nurses\' Health Study',
    origin: 'https://nhs-explorer.appspot.com',
    authDomain: 'nhs_saturn_users'
  },
  {
    name: 'UK Biobank',
    origin: 'https://biobank-explorer.appspot.com',
    authDomain: 'Kathiresan_UKBB'
  }
]

const DataExplorer = _.flow(
  ajaxCaller,
  Utils.connectAtom(authStore, 'authState')
)(class DataExplorer extends Component {
  constructor(props) {
    super(props)
    const { dataset } = props
    this.state = {
      completedDeOauth: undefined,
      groups: undefined
    }
    this.origin = datasets.filter(d => d.name === dataset)[0].origin
    this.authDomain = datasets.filter(d => d.name === dataset)[0].authDomain
  }

  async componentDidMount() {
    const { ajax: { Groups } } = this.props
    const groups = _.map(g => g.groupName, await Groups.list())
    this.setState({ groups: groups })

    try {
      // This fetch will succeed iff user has used this Data Explorer from this
      // browser.
      // Need to include credentials to include IAP login cookie, if it exists.
      await fetch(this.origin + '/favicon.ico', { credentials: 'include' })
      this.setState({ completedDeOauth: true })
    } catch (e) {
      // fetch will fail if:
      // - User has not completed oauth for this Data Explorer
      // - User has completed oauth but has not used DE from this browser
      // - User has used DE from this browser but IAP login cookie has expired
      this.setState({ completedDeOauth: false })
    }
  }

  async componentDidUpdate(prevProps) {
    const { ajax: { Groups }, authState: { profile: { email } } } = this.props
    const { groups } = this.state
    if (email === undefined && groups !== undefined && groups.length) {
      this.setState({ groups: [] })
    } else if (email !== prevProps.authState.profile.email) {
      const groups = _.map(g => g.groupName, await Groups.list())
      this.setState({ groups: groups })
    }
  }

  render() {
    const { dataset } = this.props
    const { completedDeOauth, groups } = this.state

    const header = h(TopBar, { title: 'Library', href: Nav.getLink('library-datasets') }, [
      div({ style: Style.breadcrumb.breadcrumb }, [
        div({}, commonPaths.datasetList()),
        div({ style: Style.breadcrumb.textUnderBreadcrumb }, [
          'Data Explorer - ' + dataset
        ])
      ])
    ])

    const dataExplorer = h(IframeResizer, {
      src: this.origin + '/?embed&' + Nav.history.location.search.slice(1),
      iframeResizerOptions: {
        onMessage: ({ iframe, message }) => {
          if (message.importDataQueryStr) {
            Nav.history.push({
              pathname: Nav.getPath('import-data'),
              search: '?' + message.importDataQueryStr
            })
          } else if (message.deQueryStr) {
            // Propagate Data Explorer URL params to app.terra.bio.
            // Don't call Nav.history.replace(). That will trigger a request and
            // cause the page to flicker.
            const url = window.location.origin + '#' + Nav.history.location.pathname.slice(1) + '?' + message.deQueryStr
            window.history.replaceState({}, 'Data Explorer - ' + dataset, url)
          }
        }
      }
    })

    const paragraphStyle = { style: { margin: '2rem' } }
    const notInAuthDomainError = div({
      style: {
        fontSize: 18,
        margin: '3rem',
        width: 800
      }
    }, [
      div(paragraphStyle, ['This Data Explorer requires you to be in the ',
        span({ style: { fontWeight: 'bold' } }, this.authDomain),
        ' Terra group.']),
      div(paragraphStyle, 'If you have a different Google account in that ' +
        'group, please sign out of Terra and sign in with that account. To ' +
        'sign out of Terra, click on the hamburger menu on the upper left, ' +
        'click on your name, then click Sign Out'),
      div(paragraphStyle, 'If you don\'t have a Google account in that ' +
        'group, please apply for access.')
    ])

    return h(Fragment, [
      header,
      Utils.cond(
        [this.authDomain === undefined, dataExplorer],
        [groups === undefined || completedDeOauth === undefined, centeredSpinner],
        [groups && groups.includes(this.authDomain) && completedDeOauth === false, () => { window.open(this.origin, '_self') }],
        [groups && groups.includes(this.authDomain), dataExplorer],
        notInAuthDomainError
      )
    ])
  }
})

export const navPaths = [
  {
    name: 'library-datasets-data-explorer-public',
    path: '/library/datasets/public/:dataset/data-explorer',
    component: DataExplorer,
    public: true,
    title: ({ dataset }) => `${dataset} - Data Explorer`
  },
  {
    name: 'library-datasets-data-explorer-private',
    path: '/library/datasets/:dataset/data-explorer',
    component: DataExplorer,
    title: ({ dataset }) => `${dataset} - Data Explorer`
  }
]
