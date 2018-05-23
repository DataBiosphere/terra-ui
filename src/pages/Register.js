import { Component } from 'react'
import { div, h2, br } from 'react-hyperscript-helpers'
import { buttonPrimary } from 'src/components/common'
import { logo, spinner } from 'src/components/icons'
import { textInput } from 'src/components/input'
import { Sam, Orchestration } from 'src/libs/ajax'
import { getBasicProfile, authStore } from 'src/libs/auth'
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
    return div({ style: { padding: '4rem' } }, [
      div({ style: { fontSize: 60, fontWeight: 400, color: Style.colors.title } }, [
        logo({ size: 100, style: { marginRight: 20 } }), 'SATURN'
      ]),
      h2({ style: { marginTop: '4rem', color: Style.colors.textFaded } }, 'New User Registration'),
      div({ style: { marginTop: '3rem', display: 'flex' } }, [
        div({ style: { lineHeight: '170%' } }, [
          'First Name', br(),
          textInput({
            value: givenName,
            onChange: e => this.setState({ givenName: e.target.value })
          })
        ]),
        div({ style: { width: '1rem' } }),
        div({ style: { lineHeight: '170%' } }, [
          'Last Name', br(), textInput({
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
