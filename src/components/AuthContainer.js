import _ from 'lodash'
import { Component, Fragment } from 'react'
import { div, h, h4, hr, p } from 'react-hyperscript-helpers'
import Modal from 'src/components/Modal'
import { link } from 'src/components/common'
import { Leo, Rawls, Sam } from 'src/libs/ajax'
import * as Utils from 'src/libs/utils'


export default class AuthContainer extends Component {
  constructor(props) {
    super(props)
    this.state = { isSignedIn: undefined, isShowingNotRegisteredModal: false }
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
      Sam.getUserStatus().then(response => {
        if (response.status === 404) {
          return true
        } else if (!response.ok) {
          throw response
        } else {
          return response.json().then(({ enabled: { ldap } }) => !ldap)
        }
      }).then(show => {
        this.setState({ isShowingNotRegisteredModal: show })
      }, () => {
        console.warn('Error looking up user status')
      })

      /**
       * Developers can get access to a user's ID, so a determined person could compare user IDs to
       * hashes to identify a user in our analytics data. We trust our developers to refrain from
       * doing this.
       */
      window.newrelic.setCustomAttribute(
        'userIdHash',
        Utils.getAuthInstance().currentUser.get().getBasicProfile().getId()
      )

      const [billingProjects, clusters] = await Promise.all([Rawls.listBillingProjects(), Leo.clustersList()])
      const projectsWithoutClusters = _.difference(
        _.map(billingProjects, 'projectName'),
        _.map(clusters, 'googleProject')
      )

      projectsWithoutClusters.forEach(project => {
        Leo.cluster(project, `launchpad-${project}`).create({
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
  }

  renderNotRegisteredModal = () => {
    return h(Modal, {
      onDismiss: () => this.setState({ isShowingNotRegisteredModal: false }),
      title: 'Account Not Registered',
      showCancel: false
    }, 'Registering in Saturn is not yet supported. Please register by logging into FireCloud.')
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
    const { isSignedIn, isShowingNotRegisteredModal } = this.state
    return h(Fragment, [
      div({ id: 'signInButton', style: { display: isSignedIn ? 'none' : 'block' } }),
      isShowingNotRegisteredModal && this.renderNotRegisteredModal(),
      Utils.cond(
        [isSignedIn === false, this.renderSignedOut],
        [isSignedIn === true, children],
        null
      )
    ])
  }
}
