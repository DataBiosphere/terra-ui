import { div, h } from 'react-hyperscript-helpers'
import { buttonPrimary, Select, spinnerOverlay } from 'src/components/common'
import { TextArea, textInput } from 'src/components/input'
import Modal from 'src/components/Modal'
import { Ajax } from 'src/libs/ajax'
import { authStore } from 'src/libs/auth'
import colors from 'src/libs/colors'
import { reportError } from 'src/libs/error'
import * as Forms from 'src/libs/forms'
import * as Utils from 'src/libs/utils'
import { Component } from 'src/libs/wrapped-components'
import validate from 'validate.js'


const constraints = {
  name: { presence: { allowEmpty: false } },
  subject: { presence: { allowEmpty: false } },
  description: { presence: { allowEmpty: false } },
  email: { email: true, presence: { allowEmpty: false } }
}

const SupportRequestModal =
  Utils.connectAtom(authStore, 'authState')(class SupportRequestModal extends Component {
    constructor(props) {
      super(props)
      const { contactEmail, email } = props.authState.profile

      this.state = {
        subject: '',
        description: '',
        type: 'question',
        email: contactEmail || email || '',
        nameEntered: ''
      }
    }

    render() {
      const { onDismiss, authState: { isSignedIn, profile: { firstName } } } = this.props
      const { submitting, submitError, subject, description, type, email, nameEntered } = this.state
      const greetUser = isSignedIn ? `, ${firstName}` : ``
      const errors = validate({ email, description, subject, name: isSignedIn ? firstName : nameEntered }, constraints)

      return h(Modal, {
        onDismiss,
        title: 'Contact Us',
        okButton: buttonPrimary({
          disabled: errors,
          tooltip: Utils.summarizeErrors(errors),
          onClick: () => this.submit()
        }, ['SEND'])
      }, [
        !isSignedIn && Forms.requiredFormLabel('Name'),
        !isSignedIn && textInput({
          placeholder: 'What should we call you?',
          autoFocus: true,
          value: !isSignedIn ? nameEntered : firstName,
          onChange: e => this.setState({ nameEntered: e.target.value })
        }),
        Forms.requiredFormLabel('Type'),
        h(Select, {
          isMulti: false,
          value: type,
          onChange: ({ value }) => this.setState({ type: value }),
          options: [{ value: 'question', label: 'Question' }, { value: 'bug', label: 'Bug' }, { value: 'feature_request', label: 'Feature Request' }]
        }),
        Forms.requiredFormLabel(`How can we help you${greetUser}?`),
        textInput({
          style: { borderBottomLeftRadius: 0, borderBottomRightRadius: 0, borderBottomStyle: 'dashed' },
          placeholder: 'Enter a subject',
          autoFocus: !!isSignedIn,
          value: subject,
          onChange: e => this.setState({ subject: e.target.value })
        }),
        h(TextArea, {
          style: { height: 200, borderTopLeftRadius: 0, borderTopRightRadius: 0, borderTopStyle: 'dashed' },
          placeholder: 'Enter a description',
          value: description,
          onChange: e => this.setState({ description: e.target.value })
        }),
        Forms.requiredFormLabel('Contact email'),
        textInput({
          value: email,
          placeholder: 'Enter your email address',
          onChange: e => this.setState({ email: e.target.value })
        }),
        submitError && div({ style: { marginTop: '0.5rem', textAlign: 'right', color: colors.red[0] } }, [submitError]),
        submitting && spinnerOverlay
      ])
    }

    async submit() {
      const { onSuccess, authState: { isSignedIn, profile: { firstName, lastName } } } = this.props
      const { email, type, description, subject, nameEntered } = this.state
      const name = isSignedIn ? `${firstName} ${lastName}` : nameEntered
      const currUrl = window.location.href

      try {
        this.setState({ submitting: true })
        await Ajax().User.createSupportRequest({ name, email, currUrl, type, description, subject })
        onSuccess()
      } catch (error) {
        this.setState({ submitting: false })
        reportError('Error submitting support request', error)
      }
    }
  })

export default SupportRequestModal
