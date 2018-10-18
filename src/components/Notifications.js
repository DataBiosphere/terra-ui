import _ from 'lodash/fp'
import { createRef } from 'react'
import { h } from 'react-hyperscript-helpers'
import ReactNotification from 'react-notifications-component'
import { Component } from 'src/libs/wrapped-components'
import 'react-notifications-component/dist/theme.css'
import 'animate.css'


let notificationsInstance


const defaultNotificationProps = {
  type: 'success',
  container: 'top-right',
  animationIn: ['animated', 'fadeInRight'],
  animationOut: ['animated', 'fadeOutRight'],
  dismiss: { duration: 2000 }
}


export class NotificationsContainer extends Component {
  constructor(props) {
    super(props)

    this.notificationRef = createRef()
    notificationsInstance = this
  }

  render() {
    return h(ReactNotification, {
      ref: this.notificationRef
    })
  }

  pushNotification(props) {
    this.notificationRef.current.addNotification(_.merge(defaultNotificationProps, props))
  }
}


export const pushNotification = props => {
  console.assert(notificationsInstance, 'Notifications not set up')
  notificationsInstance.pushNotification(props)
}
