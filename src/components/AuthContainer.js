import _ from 'lodash'
import { Component, Fragment } from 'react'
import { br, div, h, h2, h4, hr, p } from 'react-hyperscript-helpers'
import { buttonPrimary, link } from 'src/components/common'
import { logo, spinner } from 'src/components/icons'
import { textInput } from 'src/components/input'
import { Leo, Orchestration, Rawls, Sam } from 'src/libs/ajax'
import { colors } from 'src/libs/style'
import * as Utils from 'src/libs/utils'


function getUserIsRegisteredAndEnabled() {
  return Sam.getUserStatus().then(response => {
    if (response.status === 404) {
      return false
    } else if (!response.ok) {
      throw response
    } else {
      return response.json().then(({ enabled: { ldap } }) => ldap)
    }
  })
}

async function createClusters() {
  const userProfile = Utils.getUser().getBasicProfile()
  const [billingProjects, clusters] = await Promise.all(
    [Rawls.listBillingProjects(), Leo.clustersList()])
  const projectsWithoutClusters = _.difference(
    _.uniq(_.map(billingProjects, 'projectName')), // in case of being both a user and an admin of a project
    _.map(
      _.filter(clusters, c => c.creator === userProfile.getEmail()),
      'googleProject'
    )
  )

  projectsWithoutClusters.forEach(project => {
    Leo.cluster(project,
      `saturn-${userProfile.getId()}-${project}`.match(/(?:[a-z](?:[-a-z0-9]{0,49}[a-z0-9])?)/)[0] // regex used by google for valid names
    ).create({
      'labels': {},
      'machineConfig': {
        'numberOfWorkers': 0, 'masterMachineType': 'n1-standard-4',
        'masterDiskSize': 500, 'workerMachineType': 'n1-standard-4',
        'workerDiskSize': 500, 'numberOfWorkerLocalSSDs': 0,
        'numberOfPreemptibleWorkers': 0
      },
      'stopAfterCreation': true
    }).catch(error => Utils.log(`Error auto-creating cluster for project ${project}`, error))
  })
}

export default class AuthContainer extends Component {
  constructor(props) {
    super(props)
    this.state = { isSignedIn: undefined, isRegistered: undefined }
  }

  componentDidMount() {
    Utils.isSignedIn.subscribe(this.handleSignIn)
    this.loadAuth()
  }

  componentWillUnmount() {
    Utils.isSignedIn.unsubscribe(this.handleSignIn)
  }

  loadAuth = async () => {
    await Utils.initializeAuth()
    window.gapi.signin2.render('signInButton', { scope: 'openid profile email' })
  }

  handleSignIn = async isSignedIn => {
    this.setState({ isSignedIn })
    if (isSignedIn) {
      const profile = Utils.getAuthInstance().currentUser.get().getBasicProfile()
      this.setState({
        givenName: profile.getGivenName(), familyName: profile.getFamilyName(),
        email: profile.getEmail()
      })
      const isRegistered = await getUserIsRegisteredAndEnabled()
      this.setState({ isRegistered })

      /**
       * Developers can get access to a user's ID, so a determined person could compare user IDs to
       * hashes to identify a user in our analytics data. We trust our developers to refrain from
       * doing this.
       */
      window.newrelic.setCustomAttribute(
        'userGoogleId',
        Utils.getAuthInstance().currentUser.get().getBasicProfile().getId()
      )

      if (isRegistered) {
        createClusters()
      }
    }
  }

  renderRegistration = () => {
    return div({ style: { padding: '4rem' } }, [
      div({ style: { fontSize: 60, fontWeight: 400, color: colors.title } }, [
        logo({ size: 100, style: { marginRight: 20 } }), 'SATURN'
      ]),
      h2({ style: { marginTop: '4rem', color: colors.textFaded } }, 'New User Registration'),
      div({ style: { marginTop: '3rem', display: 'flex' } }, [
        div({ style: { lineHeight: '170%' } }, [
          'First Name', br(),
          textInput({
            value: this.state.givenName,
            onChange: e => this.setState({ givenName: e.target.value })
          })
        ]),
        div({ style: { width: '1rem' } }),
        div({ style: { lineHeight: '170%' } }, [
          'Last Name', br(), textInput({
            value: this.state.familyName,
            onChange: e => this.setState({ familyName: e.target.value })
          })
        ])
      ]),
      div({ style: { lineHeight: '170%' } }, [
        div({ style: { marginTop: '2rem' } }, 'Contact Email for Notifications'),
        div({}, [
          textInput({
            value: this.state.email,
            onChange: e => this.setState({ email: e.target.value }),
            style: { width: '50ex' }
          })
        ])
      ]),
      div({ style: { marginTop: '3rem' } }, [
        buttonPrimary({ disabled: this.state.busy, onClick: () => this.register() },
          'Register'
        ),
        this.state.busy && spinner({
          size: 34, style: { display: null, margin: null, marginLeft: '1ex' }
        })
      ])
    ])
  }

  async register() {
    this.setState({ busy: true })
    await Sam.createUser()
    const firstName = this.state.givenName
    const lastName = this.state.familyName
    const contactEmail = this.state.email
    await Orchestration.profile.set({ firstName, lastName, contactEmail })
    this.setState({ busy: false, isRegistered: true })
  }

  renderSignedOut = () => {
    return div({ style: { paddingLeft: '1rem', paddingRight: '1rem' } }, [
      h4('WARNING NOTICE'),
      p([
        'You are accessing a US Government web site which may contain information that must be ',
        'protected under the US Privacy Act or other sensitive information and is intended for ',
        'Government authorized use only.'
      ]),
      p([
        'Unauthorized attempts to upload information, change information, or use of this web site ',
        'may result in disciplinary action, civil, and/or criminal penalties. Unauthorized users ',
        'of this website should have no expectation of privacy regarding any communications or ',
        'data processed by this website.'
      ]),
      p([
        'Anyone accessing this website expressly consents to monitoring of their actions and all ',
        'communications or data transiting or stored on related to this website and is advised ',
        'that if such monitoring reveals possible evidence of criminal activity, NIH may provide ',
        'that evidence to law enforcement officials.'
      ]),
      h4('WARNING NOTICE (when accessing TCGA controlled data)'),
      p([
        'You are reminded that when accessing TCGA controlled access information you are bound by ',
        'the dbGaP TCGA ',
        link({ target: '_blank', href: 'http://cancergenome.nih.gov/pdfs/Data_Use_Certv082014' }, [
          'DATA USE CERTIFICATION AGREEMENT (DUCA)'
        ])
      ]),
      hr(),
      p([
        'Copyright © 2018, Broad Institute, Inc., Verily Life Sciences LLC'
      ])
    ])
  }

  render() {
    const { children } = this.props
    const { isSignedIn, isRegistered } = this.state
    return h(Fragment, [
      div({ id: 'signInButton', style: { display: isSignedIn ? 'none' : 'block' } }),
      Utils.cond(
        [isSignedIn === undefined, null],
        [isSignedIn === false, this.renderSignedOut],
        [isSignedIn === true && isRegistered === undefined, null],
        [isSignedIn === true && isRegistered === false, this.renderRegistration],
        children
      )
    ])
  }
}
