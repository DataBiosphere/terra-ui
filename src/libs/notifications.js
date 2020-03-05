import _ from 'lodash/fp'
import { Component } from 'react'
import { div, h } from 'react-hyperscript-helpers'
import { store } from 'react-notifications-component'
import { ButtonPrimary, Clickable, Link } from 'src/components/common'
import ErrorView from 'src/components/ErrorView'
import { icon } from 'src/components/icons'
import Modal from 'src/components/Modal'
import colors from 'src/libs/colors'
import { notificationStore } from 'src/libs/state'
import * as StateHistory from 'src/libs/state-history'
import * as Utils from 'src/libs/utils'
import uuid from 'uuid/v4'


// documentation: https://github.com/teodosii/react-notifications-component

export const sessionTimeoutProps = {
  id: 'sessionTimeout',
  detail: 'You have been signed out due to inactivity'
}

const makeNotification = props => _.defaults({ id: uuid() }, props)

export const notify = (type, title, props) => {
  const notification = makeNotification({ type, title, ...props })
  const visibleNotificationIds = _.map('id', notificationStore.get())
  notificationStore.update(Utils.append(notification))
  if (!_.includes(notification.id, visibleNotificationIds)) {
    showNotification(notification)
  }
  return notification.id
}

export const clearNotification = id => store.removeNotification(id)

const NotificationDisplay = Utils.connectStore(notificationStore, 'notificationState')(class NotificationDisplay extends Component {
  constructor(props) {
    super(props)
    this.state = { modal: false, notificationNumber: 0 }
  }


  render() {
    const { notificationState, id } = this.props
    const { modal, notificationNumber } = this.state

    const notifications = _.filter(n => n.id === id, notificationState)
    const onFirst = notificationNumber === 0
    const onLast = notificationNumber + 1 === notifications.length

    const { title, message, detail, type } = notifications[notificationNumber]
    const baseColor = Utils.cond(
      [type === 'success', () => colors.success],
      [type === 'info', () => colors.accent],
      [type === 'welcome', () => colors.accent],
      [type === 'warn', () => colors.warning],
      [type === 'error', () => colors.danger],
      () => colors.accent
    )
    const iconType = Utils.switchCase(type,
      ['success', () => 'success-standard'],
      ['warn', () => 'warning-standard'],
      ['error', () => 'error-standard']
    )

    return div({
      style: {
        backgroundColor: baseColor(0.15),
        borderRadius: '4px',
        boxShadow: '0 0 4px 0 rgba(0,0,0,0.5)',
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
            !!iconType && icon(iconType, { size: 26, style: { color: baseColor(), flexShrink: 0, marginRight: '0.5rem' } }),
            div({ style: { fontWeight: 600 } }, [title])
          ]),
          !!message && div({ style: { marginTop: '0.5rem' } }, [message]),
          !!detail && h(Clickable, {
            style: { marginTop: '0.25rem', textDecoration: 'underline' },
            onClick: () => this.setState({ modal: true })
          }, ['Details'])
        ]),
        h(Link, {
          style: { alignSelf: 'start' },
          'aria-label': type ? `Dismiss ${type} notification` : 'Dismiss notification',
          title: 'Dismiss notification',
          onClick: () => store.removeNotification(id)
        }, [icon('times', { size: 20 })])
      ]),
      notifications.length > 1 && div({
        style: { alignItems: 'center', borderTop: `1px solid ${baseColor()}`, display: 'flex', fontSize: 10, padding: '0.75rem 1rem' }
      }, [
        h(Link, {
          disabled: onFirst,
          onClick: () => this.setState({ notificationNumber: notificationNumber - 1 })
        }, [icon('angle-left', { size: 12 })]),
        div({
          style: {
            backgroundColor: colors.accent(), color: 'white',
            fontWeight: 600,
            borderRadius: 10,
            padding: '0.2rem 0.5rem'
          }
        }, [
          notificationNumber + 1, '/', notifications.length
        ]),
        h(Link, {
          disabled: onLast,
          onClick: () => this.setState({ notificationNumber: notificationNumber + 1 })
        }, [icon('angle-right', { size: 12 })])
      ]),
      modal && h(Modal, {
        width: 800,
        title,
        showCancel: false,
        showX: true,
        onDismiss: () => this.setState({ modal: false }),
        okButton: h(ButtonPrimary, { onClick: () => refreshPage() }, 'Refresh Page')
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
  store.addNotification({
    id,
    onRemoval: () => notificationStore.update(_.reject({ id })),
    content: div({ style: { width: '100%' } }, [
      h(NotificationDisplay, { id })
    ]),
    container: 'top-right',
    dismiss: { duration: !!timeout ? timeout : 0, click: false, touch: false },
    animationIn: ['animated', 'slideInRight'],
    animationOut: ['animated', 'slideOutRight'],
    width: 350
  })
}
