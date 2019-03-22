import { div } from 'react-hyperscript-helpers'
import { link } from 'src/components/common'
import { signOut } from 'src/libs/auth'


export const Disabled = () => {
  return div({ style: { padding: '1rem' } }, [
    div([
      'Thank you for registering. Your account is currently inactive. ',
      'You will be contacted via email when your account is activated.'
    ]),
    div({ style: { marginTop: '1rem' } }, [
      link({ onClick: signOut }, 'Sign out')
    ])
  ])
}

export const Unlisted = () => {
  return div({ style: { padding: '1rem' } }, [
    div([
      'Terra is currently in a closed-access beta phase. If you are interested in contributing early-access feedback as part of our user panel, please email us at ',
      link({ href: 'mailto:info@terra.bio' }, 'info@terra.bio'),
      '.'
    ]),
    div({ style: { marginTop: '1rem' } }, [
      link({ onClick: signOut }, 'Sign out')
    ])
  ])
}
