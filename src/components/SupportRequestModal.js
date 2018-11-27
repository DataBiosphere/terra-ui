import _ from 'lodash/fp'
import { div, h } from 'react-hyperscript-helpers'
import { buttonPrimary, Select, spinnerOverlay } from 'src/components/common'
import { TextArea, textInput, validatedInput } from 'src/components/input'
import Modal from 'src/components/Modal'
import { ajaxCaller } from 'src/libs/ajax'
import { authStore } from 'src/libs/auth'
import colors from 'src/libs/colors'
import { reportError } from 'src/libs/error'
import * as Forms from 'src/libs/forms'
import * as Utils from 'src/libs/utils'
import { Component } from 'src/libs/wrapped-components'
import validate from 'validate.js'


const constraints = {
  email: { email: true },
  subject: { presence: { allowEmpty: false } },
  description: { presence: { allowEmpty: false } }
}

const SupportRequestModal = _.flow(
  ajaxCaller,
  Utils.connectAtom(authStore, 'authState')
)(class SupportRequestModal extends Component {
  constructor(props) {
    super(props)
    const { contactEmail, email } = props.authState.profile

    this.state = {
      subject: '',
      description: '',
      type: 'question',
      email: contactEmail || email
    }
  }

  render() {
    const { onDismiss, authState: { profile: { firstName } } } = this.props
    const { submitting, submitError, subject, description, type, email } = this.state
    const greetUser = firstName === 'N/A' ? `?` : `, ${firstName}?`
    const errors = validate({ email, description, subject }, constraints)

    return h(Modal, {
      onDismiss,
      title: 'Contact Us',
      okButton: buttonPrimary({
        disabled: errors,
        tooltip: Utils.summarizeErrors(errors),
        onClick: () => this.submit()
      }, ['SEND'])
    }, [
      Forms.requiredFormLabel('Type'),
      h(Select, {
        isMulti: false,
        value: type,
        onChange: ({ value }) => this.setState({ type: value }),
        options: [{ value: 'question', label: 'Question' }, { value: 'bug', label: 'Bug' }, { value: 'feature_request', label: 'Feature Request' }]
      }),
      Forms.requiredFormLabel(`How can we help you${greetUser}`),
      textInput({
        style: { borderBottomLeftRadius: 0, borderBottomRightRadius: 0, borderBottomStyle: 'dashed' },
        placeholder: 'Enter a subject',
        autoFocus: true,
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
      validatedInput({
        inputProps: {
          value: email,
          onChange: e => this.setState({ email: e.target.value })
        },
        error: Utils.summarizeErrors(errors && errors.email)
      }),
      submitError && div({ style: { marginTop: '0.5rem', textAlign: 'right', color: colors.red[0] } }, [submitError]),
      submitting && spinnerOverlay
    ])
  }

  async submit() {
    const { onSuccess, ajax: { User }, authState: { profile: { firstName, lastName } } } = this.props
    const { email, type, description, subject } = this.state
    const name = `${firstName} ${lastName}`
    const currUrl = window.location.href

    try {
      this.setState({ submitting: true })
      await User.createSupportRequest({ name, email, currUrl, type, description, subject })
      onSuccess()
    } catch (error) {
      this.setState({ submitting: false })
      reportError('Error submitting support request', error)
    }
  }
})

export default SupportRequestModal
