import { Component } from 'react'
import { div, h, label } from 'react-hyperscript-helpers'
import { ButtonPrimary, ButtonSecondary, IdContainer } from 'src/components/common'
import { centeredSpinner } from 'src/components/icons'
import { TextInput } from 'src/components/input'
import planet from 'src/images/register-planet.svg'
import { Ajax } from 'src/libs/ajax'
import { getUser, refreshTerraProfile, signOut } from 'src/libs/auth'
import colors from 'src/libs/colors'
import { reportError } from 'src/libs/error'
import { registrationLogo } from 'src/libs/logos'
import { authStore } from 'src/libs/state'
import validate from 'validate.js'


const constraints = {
  givenName: { presence: { allowEmpty: false } },
  familyName: { presence: { allowEmpty: false } },
  email: { presence: { allowEmpty: false } }
}

export default class Register extends Component {
  constructor(props) {
    super(props)
    const { givenName, familyName, email } = getUser()
    this.state = {
      busy: false,
      givenName,
      familyName,
      email
    }
  }

  async register() {
    const { givenName, familyName, email } = this.state
    try {
      this.setState({ busy: true })
      await Ajax().User.profile.set({
        firstName: givenName,
        lastName: familyName,
        contactEmail: email
      })
      authStore.update(state => ({ ...state, registrationStatus: 'registered' }))
      await refreshTerraProfile()
    } catch (error) {
      reportError('Error registering', error)
    } finally {
      this.setState({ busy: false })
    }
  }

  render() {
    const { busy, givenName, familyName, email } = this.state
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
            onChange: v => this.setState({ givenName: v })
          })
        ])]),
        div({ style: { width: '1rem' } }),
        h(IdContainer, [id => div({ style: { lineHeight: '170%' } }, [
          label({ htmlFor: id }, ['Last Name *']),
          h(TextInput, {
            id,
            style: { display: 'block' },
            value: familyName,
            onChange: v => this.setState({ familyName: v })
          })
        ])])
      ]),
      h(IdContainer, [id => div({ style: { lineHeight: '170%' } }, [
        label({ htmlFor: id, style: { display: 'block', marginTop: '2rem' } }, ['Contact Email for Notifications *']),
        div([
          h(TextInput, {
            id,
            value: email,
            onChange: v => this.setState({ email: v }),
            style: { width: '50ex' }
          })
        ])
      ])]),
      div({ style: { marginTop: '3rem' } }, [
        h(ButtonPrimary, { disabled: errors || busy, onClick: () => this.register() },
          'Register'
        ),
        h(ButtonSecondary, { style: { marginLeft: '1rem' }, onClick: signOut }, 'Cancel'),
        busy && centeredSpinner({
          size: 34, style: { display: null, margin: null, marginLeft: '1ex' }
        })
      ])
    ])
  }
}
