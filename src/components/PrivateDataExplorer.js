import _ from 'lodash/fp'
import { Component, Fragment } from 'react'
import { b, div, h, p } from 'react-hyperscript-helpers'
import { Link } from 'src/components/common'
import DataExplorerFrame from 'src/components/DataExplorerFrame'
import { centeredSpinner } from 'src/components/icons'
import datasets from 'src/data/datasets'
import { ajaxCaller } from 'src/libs/ajax'
import { authStore, contactUsActive } from 'src/libs/state'
import * as Utils from 'src/libs/utils'

/*
  Note: In the following circumstance, this will not show DE even though DE
  could be shown: User logged into multiple Google accounts. One of the accounts
  that's not the current Terra user can see DE.
  We show notInAuthDomain instead of DE in this case because otherwise, user
  won't be able to save to Terra because the current Terra user won't be in
  right auth domain.
  To test "User has not completed oauth for this Data Explorer":
    1. Revoke DE at https://myaccount.google.com/permissions
    2. Clear browser cache
    3. Go to de.appspot.com/_gcp_iap/clear_login_cookie to delete IAP login cookie
  To test "User has completed oauth but has not used DE from this browser:
    2 and 3 from above.
  To test "Used DE from this browser but IAP login cookie has expired":
    No easy way to test, just have to wait for cookie to expire
*/

export default _.flow(
  ajaxCaller,
  Utils.connectAtom(authStore, 'authState')
)(class PrivateDataExplorer extends Component {
  constructor(props) {
    super(props)
    this.state = {
      completedDeOauth: undefined,
      groups: undefined
    }
  }

  async componentDidMount() {
    const { ajax: { Groups }, dataset } = this.props
    const { origin } = _.find({ name: dataset }, datasets)

    const [groupObjs] = await Promise.all([
      Groups.list(),
      fetch(origin + '/favicon.ico', {
        // The whole point of reading this file is to test IAP. Prevent future
        // fetches from getting this file from disk cache.
        cache: 'no-store',
        // Include IAP login cookie, if it exists
        credentials: 'include'
      })
        // fetch will succeed iff user has used this Data Explorer from
        // this browser.
        .then(() => this.setState({ completedDeOauth: true }))
        // fetch will fail if:
        // - User has not completed oauth for this Data Explorer
        // - User has completed oauth but has not used DE from this browser
        // - User has used DE from this browser but IAP login cookie has expired
        .catch(e => this.setState({ completedDeOauth: false }))
    ])
    this.setState({ groups: _.map(g => g.groupName, groupObjs) })
  }

  render() {
    const { dataset } = this.props
    const { completedDeOauth, groups } = this.state
    const { authDomain, origin, partner } = _.find({ name: dataset }, datasets)

    const notInAuthDomainError = div({
      style: { fontSize: 18, margin: '3rem 5rem', width: 800 }
    }, [
      p(['This Data Explorer requires you to be in the ', b([authDomain]), ' Terra group.']),
      p([
        'If you have a different Google account in that group, please sign out of Terra and sign in ',
        'with that account. To sign out of Terra, click on the menu on the upper left, click on your ',
        'name, then click Sign Out.'
      ]),
      Utils.switchCase(partner, [
        'AMP PD', () => p([
          'If you do not have a Google account in that group, please apply for access by emailing ',
          h(Link, { href: 'mailto:admin@amp-pd.org' }, ['admin@amp-pd.org.'])
        ])
      ], [
        'UKBB', () => h(Fragment, [
          p([
            'If you do not have a Google account in that group, you will not be able to browse UKB data at this time. ',
            'However, if you already have access to a copy of UKB data, you may upload it to a workspace, ',
            'provided you add appropriate permissions and/or Authorization Domains to keep the data protected.'
          ]),
          p(['We are actively working with UK Biobank to improve the process of accessing and working with UKB data.'])
        ])
      ], [
        Utils.DEFAULT, () => p([
          'If you do not have a Google account in that group, please ',
          h(Link, { onClick: () => { contactUsActive.set(true) } }, ['apply for access.'])
        ])
      ])
    ])

    return h(Fragment, [
      Utils.cond(
        [groups === undefined || completedDeOauth === undefined, centeredSpinner],
        [groups && groups.includes(authDomain) && completedDeOauth === false, () => { window.open(origin, '_self') }],
        [groups && groups.includes(authDomain), h(DataExplorerFrame, { dataset })],
        notInAuthDomainError
      )
    ])
  }
})
