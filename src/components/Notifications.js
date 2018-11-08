import _ from 'lodash/fp'
import { createRef } from 'react'
import { h } from 'react-hyperscript-helpers'
import ReactNotification from 'react-notifications-component'
import 'react-notifications-component/dist/theme.css'
import 'animate.css'


// documentation: https://github.com/teodosii/react-notifications-component

const defaultNotificationProps = {
  type: 'success',
  container: 'top-right',
  animationIn: ['animated', 'slideInRight'],
  animationOut: ['animated', 'slideOutRight'],
  dismiss: { duration: 3000 }
}


const notificationsRef = createRef()
export const NotificationsContainer = h(ReactNotification, { ref: notificationsRef })

export const pushNotification = props => {
  return notificationsRef.current.addNotification(_.merge(defaultNotificationProps, props))
}

export const popNotification = id => {
  notificationsRef.current.removeNotification(id)
}
