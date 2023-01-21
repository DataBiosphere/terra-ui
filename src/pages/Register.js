import { useState } from 'react'
import { div, h, label } from 'react-hyperscript-helpers'
import { ButtonPrimary, ButtonSecondary, IdContainer } from 'src/components/common'
import { centeredSpinner } from 'src/components/icons'
import { TextInput } from 'src/components/input'
import planet from 'src/images/register-planet.svg'
import { Ajax } from 'src/libs/ajax'
import { refreshTerraProfile, signOut } from 'src/libs/auth'
import colors from 'src/libs/colors'
import { reportError } from 'src/libs/error'
import Events from 'src/libs/events'
import { registrationLogo } from 'src/libs/logos'
import { authStore, getUser, userStatus } from 'src/libs/state'
import validate from 'validate.js'


const constraints = {
  givenName: { presence: { allowEmpty: false } },
  familyName: { presence: { allowEmpty: false } },
  email: { presence: { allowEmpty: false } }
}

const Register = () => {
  const user = getUser()
  const [busy, setBusy] = useState(false)
  const [givenName, setGivenName] = useState(user.givenName || '')
  const [familyName, setFamilyName] = useState(user.familyName || '')
  const [email, setEmail] = useState(user.email || '')

  const register = async () => {
    try {
      setBusy(true)
      await Ajax().User.profile.set({
        firstName: givenName,
        lastName: familyName,
        contactEmail: email
      })
      authStore.update(state => ({ ...state, registrationStatus: userStatus.registeredWithoutTos }))
      await refreshTerraProfile()
      Ajax().Metrics.captureEvent(Events.userRegister)
    } catch (error) {
      reportError('Error registering', error)
      setBusy(false)
    }
  }

  const errors = validate({ givenName, familyName, email }, constraints)
  return div({
    role: 'main',
    style: {
      flexGrow: 1,
      padding: '5rem',
      backgroundImage: `url(${planet})`,
      backgroundRepeat: 'no-repeat', backgroundSize: '750px', backgroundPosition: 'right 0px bottom -600px'
    }
  }, [
    registrationLogo(),
    div({
      style: {
        marginTop: '4rem', color: colors.dark(0.6),
        fontSize: '1.5rem', fontWeight: 500
      }
    }, 'New User Registration'),
    div({ style: { marginTop: '3rem', display: 'flex' } }, [
      h(IdContainer, [id => div({ style: { lineHeight: '170%' } }, [
        label({ htmlFor: id }, ['First Name *']),
        h(TextInput, {
          id,
          style: { display: 'block' },
          value: givenName,
          onChange: v => setGivenName(v)
        })
      ])]),
      div({ style: { width: '1rem' } }),
      h(IdContainer, [id => div({ style: { lineHeight: '170%' } }, [
        label({ htmlFor: id }, ['Last Name *']),
        h(TextInput, {
          id,
          style: { display: 'block' },
          value: familyName,
          onChange: v => setFamilyName(v)
        })
      ])])
    ]),
    h(IdContainer, [id => div({ style: { lineHeight: '170%' } }, [
      label({ htmlFor: id, style: { display: 'block', marginTop: '2rem' } }, ['Contact Email for Notifications *']),
      div([
        h(TextInput, {
          id,
          value: email,
          onChange: v => setEmail(v),
          style: { width: '50ex' }
        })
      ])
    ])]),
    div({ style: { marginTop: '3rem' } }, [
      h(ButtonPrimary, { disabled: errors || busy, onClick: register },
        'Register'
      ),
      h(ButtonSecondary, { style: { marginLeft: '1rem' }, onClick: signOut }, 'Cancel'),
      busy && centeredSpinner({
        size: 34, style: { display: null, margin: null, marginLeft: '1ex' }
      })
    ])
  ])
}

export default Register
