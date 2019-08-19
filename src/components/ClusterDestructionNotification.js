import _ from 'lodash/fp'
import { Component } from 'react'
import { a, div, h, span, b, br } from 'react-hyperscript-helpers'
import * as Utils from '../libs/utils'
import { authStore } from '../libs/state'
import Modal from './Modal'
import { ButtonPrimary, LabeledCheckbox } from './common'
import * as StateHistory from '../libs/state-history'
import { icon } from 'src/components/icons'
import colors from 'src/libs/colors'

//TODO: questions
//is profile needed? what is it for?
//I'm assuming the connectAtom authStore is what gives me the props on the first line of render?
//On new browser
//INPUT DATE INTO THE MESSAGE
export const ClusterDestructionNotification = Utils.connectAtom(authStore, 'authState')(class ClusterDestructionNotification extends Component {

  shouldRemoveKey = 'shouldRemoveClusterDestructionNotification'

  constructor(props) {
    super(props)
  }

  render () {
    const { authState: { isSignedIn, acceptedTos } } = _.omit('isVisible', this.props)
    const shouldRemove = localStorage.getItem(this.shouldRemoveKey) //TODO compute initial value based on persistent

    if (!isSignedIn || !acceptedTos || shouldRemove === 'true') return null

    // const title = [
    //   ico
    // ]
    return h(Modal, {
      title: div({ style: { 'color': colors.warning() } },
        [ icon('warning-standard'),
          ' Please save files generated on your notebook runtime'
      ]),
      showCancel: false,
      onDismiss: () => {}, //dismissing is not allowed
      okButton: h(ButtonPrimary, {
        onClick: () => this.dismiss()
      }, 'OK')
    }, [
      this.divWithNewline([
        b({key: '1'},
          'If you have generated data from a notebook analysis, please copy it to your workspace bucket prior to September 4th'),
        ' (Notebook files in your home directory are auto-saved, but other folders and file types are not).'
      ]),
      this.divWithNewline('We\'re releasing new functionality on Terra that makes it easier to work together by locking a notebook when it\'s in-use.'),
      this.divWithNewline('To enable this upgrade, we need to recreate your runtime environment, which will cause files on disk to be lost'),
      this.divWithNewline(
        b( [
          a({ href: 'http://google.com', style: { color: '#5472a6', fontVariant: 'small-caps' } },
          'READ HERE FOR DETAILS')
        ]))
    ])
  }

  refreshPage = () => {
    StateHistory.clearCurrent()
    document.location.reload()
  }

  divWithNewline = (content) => {
    return div(
      [
        content,
        br(), br()
      ]
    )
  }

  //we dismiss until they open terra in a new browser
  dismiss = (shouldHideForever) => {
    localStorage.setItem(this.shouldRemoveKey, 'true')
    this.refreshPage()
  }
})
