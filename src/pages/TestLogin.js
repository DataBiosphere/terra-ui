import { useState } from 'react'
import { div, h } from 'react-hyperscript-helpers'
import { ButtonPrimary } from 'src/components/common'
import { TextInput } from 'src/components/input'
import * as Nav from 'src/libs/nav'


const TestLogin = () => {
  const [token, setToken] = useState('')

  return div({ role: 'main', style: { margin: '2rem', display: 'flex', alignItems: 'center' } }, [
    'Token:',
    h(TextInput, {
      style: { margin: '0 1rem' },
      value: token,
      onChange: setToken
    }),
    h(ButtonPrimary, {
      onClick: async () => {
        await window.forceSignIn(token)
        Nav.goToPath('root')
      }
    }, 'Force sign-in')
  ])
}

export const navPaths = [
  {
    name: 'test-login',
    path: '/test-login',
    component: TestLogin,
    public: true,
    title: 'Test Login'
  }
]
