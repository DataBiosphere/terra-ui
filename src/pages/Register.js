import { Component } from 'react'
import { div } from 'react-hyperscript-helpers'
import { buttonPrimary, buttonSecondary } from 'src/components/common'
import { centeredSpinner } from 'src/components/icons'
import { textInput } from 'src/components/input'
import planet from 'src/images/register-planet.svg'
import { ajaxCaller } from 'src/libs/ajax'
import { authStore, getUser, refreshTerraProfile, signOut } from 'src/libs/auth'
import { registrationLogo } from 'src/libs/logos'
import colors from 'src/libs/colors'
import { reportError } from 'src/libs/error'
import validate from 'validate.js'


const constraints = {
  givenName: { presence: { allowEmpty: false } },
  familyName: { presence: { allowEmpty: false } },
  email: { presence: { allowEmpty: false } }
}

export default ajaxCaller(class Register extends Component {
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
    const { ajax: { User } } = this.props
    const { givenName, familyName, email } = this.state
    try {
      this.setState({ busy: true })
      await User.profile.set({
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
          marginTop: '4rem', color: colors.slate,
          fontSize: '1.5rem', fontWeight: 500
        }
      }, 'New User Registration'),
      div({ style: { marginTop: '3rem', display: 'flex' } }, [
        div({ style: { lineHeight: '170%' } }, [
          'First Name *',
          textInput({
            style: { display: 'block' },
            value: givenName,
            onChange: e => this.setState({ givenName: e.target.value })
          })
        ]),
        div({ style: { width: '1rem' } }),
        div({ style: { lineHeight: '170%' } }, [
          'Last Name *',
          textInput({
            style: { display: 'block' },
            value: familyName,
            onChange: e => this.setState({ familyName: e.target.value })
          })
        ])
      ]),
      div({ style: { lineHeight: '170%' } }, [
        div({ style: { marginTop: '2rem' } }, 'Contact Email for Notifications *'),
        div([
          textInput({
            value: email,
            onChange: e => this.setState({ email: e.target.value }),
            style: { width: '50ex' }
          })
        ])
      ]),
      div({ style: { marginTop: '3rem' } }, [
        buttonPrimary({ disabled: errors || busy, onClick: () => this.register() },
          'Register'
        ),
        buttonSecondary({ style: { marginLeft: '1rem' }, onClick: signOut }, 'Cancel'),
        busy && centeredSpinner({
          size: 34, style: { display: null, margin: null, marginLeft: '1ex' }
        })
      ])
    ])
  }
})
