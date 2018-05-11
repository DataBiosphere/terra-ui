import _ from 'lodash'
import { Component, Fragment } from 'react'
import { div, h } from 'react-hyperscript-helpers'
import Modal from 'src/components/Modal'
import { Leo, Rawls, Sam } from 'src/libs/ajax'
import * as Utils from 'src/libs/utils'


export default class AuthContainer extends Component {
  constructor(props) {
    super(props)
    this.state = { isSignedIn: false, isShowingNotRegisteredModal: false }
  }

  componentDidMount() {
    this.loadAuth()
  }

  loadAuth = async () => {
    await Utils.initializeAuth()
    this.handleSignIn(Utils.getAuthInstance().isSignedIn.get())
    Utils.getAuthInstance().isSignedIn.listen(this.handleSignIn)
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

  render() {
    const { children } = this.props
    const { isSignedIn, isShowingNotRegisteredModal } = this.state
    return h(Fragment, [
      div({ id: 'signInButton', style: { display: isSignedIn ? 'none' : 'block' } }),
      isShowingNotRegisteredModal && this.renderNotRegisteredModal(),
      isSignedIn && children
    ])
  }
}
