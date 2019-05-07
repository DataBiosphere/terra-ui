import { useState } from 'react'
import { div } from 'react-hyperscript-helpers'
import { buttonPrimary } from 'src/components/common'
import { textInput } from 'src/components/input'
import * as Nav from 'src/libs/nav'


const TestLogin = () => {
  const [token, setToken] = useState('')

  return div({ style: { margin: '2rem', display: 'flex', alignItems: 'center' } }, [
    'Token:',
    textInput({
      style: { margin: '0 1rem' },
      value: token,
      onChange: ({ target: { value } }) => setToken(value)
    }),
    buttonPrimary({
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
