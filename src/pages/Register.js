import { Component } from 'react'
import { div } from 'react-hyperscript-helpers'
import { buttonPrimary } from 'src/components/common'
import { logo, spinner } from 'src/components/icons'
import { textInput } from 'src/components/input'
import planet from 'src/images/register-planet.svg'
import { Orchestration, Sam } from 'src/libs/ajax'
import { authStore, getBasicProfile } from 'src/libs/auth'
import * as Style from 'src/libs/style'


export default class Register extends Component {
  constructor(props) {
    super(props)
    const profile = getBasicProfile()
    this.state = {
      busy: false,
      givenName: profile.getGivenName(),
      familyName: profile.getFamilyName(),
      email: profile.getEmail()
    }
  }

  async register() {
    const { givenName, familyName, email } = this.state
    this.setState({ busy: true })
    await Sam.createUser()
    await Orchestration.profile.set({
      firstName: givenName,
      lastName: familyName,
      contactEmail: email
    })
    this.setState({ busy: false })
    authStore.update(state => ({ ...state, isRegistered: true }))
  }

  render() {
    const { busy, givenName, familyName, email } = this.state
    return div({
      style: {
        flexGrow: 1,
        padding: '5rem', marginBottom: '-2rem',
        backgroundImage: `url(${planet})`,
        backgroundRepeat: 'no-repeat', backgroundSize: '750px', backgroundPosition: 'right 0px bottom -600px'
      }
    }, [
      div({ style: { display: 'flex', alignItems: 'center' } }, [
        logo({ size: 100, style: { marginRight: 20 } }),
        div({ style: { fontWeight: 500, fontSize: 70, color: Style.colors.title } }, ['SATURN'])
      ]),
      div({
        style: {
          marginTop: '4rem', color: Style.colors.titleAlt,
          fontSize: '1.5rem', fontWeight: 500
        }
      }, 'New User Registration'),
      div({ style: { marginTop: '3rem', display: 'flex' } }, [
        div({ style: { lineHeight: '170%' } }, [
          'First Name',
          textInput({
            style: { display: 'block' },
            value: givenName,
            onChange: e => this.setState({ givenName: e.target.value })
          })
        ]),
        div({ style: { width: '1rem' } }),
        div({ style: { lineHeight: '170%' } }, [
          'Last Name',
          textInput({
            style: { display: 'block' },
            value: familyName,
            onChange: e => this.setState({ familyName: e.target.value })
          })
        ])
      ]),
      div({ style: { lineHeight: '170%' } }, [
        div({ style: { marginTop: '2rem' } }, 'Contact Email for Notifications'),
        div([
          textInput({
            value: email,
            onChange: e => this.setState({ email: e.target.value }),
            style: { width: '50ex' }
          })
        ])
      ]),
      div({ style: { marginTop: '3rem' } }, [
        buttonPrimary({ disabled: busy, onClick: () => this.register() },
          'Register'
        ),
        busy && spinner({
          size: 34, style: { display: null, margin: null, marginLeft: '1ex' }
        })
      ])
    ])
  }
}
