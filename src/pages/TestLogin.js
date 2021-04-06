import { useState } from 'react'
import { div, h, h1, label } from 'react-hyperscript-helpers'
import { ButtonPrimary, IdContainer } from 'src/components/common'
import { TextInput } from 'src/components/input'
import * as Nav from 'src/libs/nav'


const TestLogin = () => {
  const [token, setToken] = useState('')

  return h(IdContainer, [
    id => div({ role: 'main' }, [
      h1({ style: { textAlign: 'center' } }, 'Test Login'),
      div({ style: { margin: '2rem', display: 'flex', alignItems: 'center' } }, [
        h(label, { htmlFor: id }, ['Token:']),
        h(TextInput, {
          id,
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
    ])
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
