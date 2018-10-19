import _ from 'lodash/fp'
import { createRef } from 'react'
import { h } from 'react-hyperscript-helpers'
import ReactNotification from 'react-notifications-component'
import 'react-notifications-component/dist/theme.css'
import 'animate.css'


const defaultNotificationProps = {
  type: 'success',
  container: 'top-right',
  animationIn: ['animated', 'fadeInRight'],
  animationOut: ['animated', 'fadeOutRight'],
  dismiss: { duration: 2000 }
}


const notificationsRef = createRef()
export const NotificationsContainer = h(ReactNotification, { ref: notificationsRef })

export const pushNotification = props => {
  notificationsRef.current.addNotification(_.merge(defaultNotificationProps, props))
}
