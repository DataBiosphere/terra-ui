import _ from 'lodash/fp'
import { Component } from 'react'
import { div } from 'react-hyperscript-helpers'
import { buttonPrimary, buttonSecondary } from 'src/components/common'
import { centeredSpinner, logo } from 'src/components/icons'
import { textInput } from 'src/components/input'
import planet from 'src/images/register-planet.svg'
import { ajaxCaller } from 'src/libs/ajax'
import { authStore, getUser, refreshTerraProfile, signOut } from 'src/libs/auth'
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
    const blankProfile = {
      firstName: 'N/A',
      lastName: 'N/A',
      title: 'N/A',
      institute: 'N/A',
      institutionalProgram: 'N/A',
      programLocationCity: 'N/A',
      programLocationState: 'N/A',
      programLocationCountry: 'N/A',
      pi: 'N/A',
      nonProfitStatus: 'N/A'
    }
    const filledProfile = _.merge(blankProfile, {
      firstName: givenName,
      lastName: familyName,
      contactEmail: email
    })
    try {
      this.setState({ busy: true })
      await User.create()
      await User.profile.set(filledProfile)
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
      div({ style: { display: 'flex', alignItems: 'center' } }, [
        logo({ size: 100, style: { marginRight: 20 } }),
        div({ style: { fontWeight: 500, fontSize: 70, color: colors.darkBlue[0] } }, ['TERRA'])
      ]),
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
