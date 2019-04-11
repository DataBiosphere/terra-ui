import { notify } from 'src/components/Notifications'


const RedirectNotification = () => {
  const isFirecloud = () => (window.location.hostname === 'firecloud.terra.bio')

  isFirecloud() && notify('success', 'Welcome to Terra, the next version of FireCloud.')
}

export default RedirectNotification
