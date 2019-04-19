import 'animate.css'
import _ from 'lodash/fp'
import { createRef } from 'react'
import { div, h } from 'react-hyperscript-helpers'
import ReactNotification from 'react-notifications-component'
import 'react-notifications-component/dist/theme.css'
import { buttonPrimary, Clickable } from 'src/components/common'
import ErrorView from 'src/components/ErrorView'
import { icon } from 'src/components/icons'
import Modal from 'src/components/Modal'
import colors from 'src/libs/colors'
import * as StateHistory from 'src/libs/state-history'
import * as Style from 'src/libs/style'
import * as Utils from 'src/libs/utils'
import { Component } from 'src/libs/wrapped-components'
import uuid from 'uuid/v4'


// documentation: https://github.com/teodosii/react-notifications-component

const defaultNotificationProps = {
  type: 'success',
  container: 'top-right',
  animationIn: ['animated', 'slideInRight'],
  animationOut: ['animated', 'slideOutRight'],
  dismiss: { duration: 3000 }
}

export const sessionTimeoutProps = {
  id: 'sessionTimeout',
  detail: 'You have been signed out due to inactivity'
}

const notificationStore = Utils.atom([])

const notificationsRef = createRef()

const defaultId = n => !!n.timeout ? uuid() : `${n.type || 'info'}-${n.title}`

const makeNotification = props => {
  const { id = defaultId(props) } = props
  return { ...props, id }
}

export const notify = (type, title, props) => {
  const notification = makeNotification({ type, title, ...props })
  const visibleNotificationIds = _.map('id', notificationStore.get())
  notificationStore.update(Utils.append(notification))
  if (!_.includes(notification.id, visibleNotificationIds)) {
    showNotification(notification)
  }
  return notification.id
}

export const clearNotification = id => notificationsRef.current.removeNotification(id)

const NotificationDisplay = Utils.connectAtom(notificationStore, 'notificationState')(class NotificationDisplay extends Component {
  render() {
    const { notificationState, id } = this.props
    const { modal, notificationNumber = 0 } = this.state

    const notifications = _.filter(n => n.id === id, notificationState)
    const onFirst = notificationNumber === 0
    const onLast = notificationNumber + 1 === notifications.length

    const { title, message, detail, type } = notifications[notificationNumber]
    const color = Utils.cond(
      [type === 'success', colors.green],
      [type === 'info', colors.gray],
      [type === 'warn', colors.orange],
      [type === 'error', colors.red],
    ) || colors.gray
    const iconType = Utils.cond(
      [type === 'success', 'success-standard'],
      [type === 'warn' || type === 'error', 'warning-standard'],
      undefined
    )

    return div({
      style: {
        backgroundColor: color[0],
        borderRadius: '4px',
        boxShadow: Style.standardShadow,
        color: 'white',
        cursor: 'auto',
        display: 'flex',
        flexDirection: 'column',
        fontSize: 12
      }
    }, [
      // content and close button
      div({ style: { display: 'flex', padding: '0.75rem 1rem' } }, [
        // content
        div({ style: { display: 'flex', flex: 1, flexDirection: 'column' } }, [
          // icon and title
          div({ style: { display: 'flex' } }, [
            !!iconType && icon(iconType, { className: 'is-solid', size: 26, style: { flexShrink: 0, marginRight: '0.5rem' } }),
            div({ style: { fontWeight: 600 } }, [title])
          ]),
          !!message && div({ style: { marginTop: '0.5rem' } }, [message]),
          !!detail && h(Clickable, {
            style: { marginTop: '0.25rem', textDecoration: 'underline' },
            onClick: () => this.setState({ modal: true })
          }, ['Details'])
        ]),
        h(Clickable, {
          title: 'Dismiss notification',
          onClick: () => notificationsRef.current.removeNotification(id)
        }, [icon('times', { size: 20 })])
      ]),
      notifications.length > 1 && div({ style: { alignItems: 'center', borderTop: `1px solid ${color[1]}`, display: 'flex', fontSize: 10, padding: '0.75rem 1rem' } }, [
        h(Clickable, {
          disabled: onFirst,
          style: { color: onFirst ? color[1] : null },
          onClick: () => this.setState({ notificationNumber: notificationNumber - 1 })
        }, [icon('angle left', { size: 12 })]),
        div({
          style: {
            backgroundColor: color[1],
            borderRadius: 10,
            padding: '0.2rem 0.5rem'
          }
        }, [
          notificationNumber + 1, '/', notifications.length
        ]),
        h(Clickable, {
          disabled: onLast,
          style: { color: onLast ? color[1] : null },
          onClick: () => this.setState({ notificationNumber: notificationNumber + 1 })
        }, [icon('angle right', { size: 12 })])
      ]),
      modal && h(Modal, {
        width: 800,
        title,
        showCancel: false,
        showX: true,
        onDismiss: () => this.setState({ modal: false }),
        okButton: buttonPrimary({ onClick: () => refreshPage() }, 'Refresh Page')
      }, [
        h(ErrorView, { error: detail, collapses: false })
      ])
    ])
  }
})

const refreshPage = () => {
  StateHistory.clearCurrent()
  document.location.reload()
}

const showNotification = ({ id, timeout }) => {
  notificationsRef.current.addNotification(_.merge(defaultNotificationProps, {
    id,
    content: div({ style: { width: '100%' } }, [
      h(NotificationDisplay, { id })
    ]),
    dismiss: { duration: !!timeout ? timeout : 0 },
    dismissable: { click: false, touch: false },
    width: 350
  }))
}

class Notifications extends Component {
  render() {
    return h(ReactNotification, {
      ref: notificationsRef,
      onNotificationRemoval: id => {
        notificationStore.update(_.reject(n => n.id === id))
      }
    })
  }
}

export default Utils.connectAtom(notificationStore, 'notificationState')(Notifications)

// deprecated
export const pushNotification = props => {
  return notificationsRef.current.addNotification(_.merge(defaultNotificationProps, props))
}

// deprecated
export const popNotification = id => {
  notificationsRef.current.removeNotification(id)
}
