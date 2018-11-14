import { div, h } from 'react-hyperscript-helpers'
import { buttonPrimary, Select, spinnerOverlay } from 'src/components/common'
import { TextArea, textInput, validatedInput } from 'src/components/input'
import Modal from 'src/components/Modal'
import { ajaxCaller } from 'src/libs/ajax'
import { getUser } from 'src/libs/auth'
import colors from 'src/libs/colors'
import { reportError } from 'src/libs/error'
import * as Forms from 'src/libs/forms'
import * as Utils from 'src/libs/utils'
import { Component } from 'src/libs/wrapped-components'
import validate from 'validate.js'
import _ from 'lodash/fp'


const constraints = {
  email: { email: true },
  subject: { presence: { allowEmpty: false } },
  description: { presence: { allowEmpty: false } }
}

const SupportRequestModal = ajaxCaller(class SupportRequestModal extends Component {
  constructor(props) {
    super(props)
    this.state = {
      subject: '',
      description: '',
      type: 'bug',
      email: getUser().email
    }
  }

  render() {
    const { onDismiss } = this.props
    const { submitting, submitError, subject, description, type, email } = this.state
    const { givenName } = getUser()
    const greetUser = givenName ? `, ${givenName}?` : `?`
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
      Forms.requiredFormLabel('Email address'),
      validatedInput({
        inputProps: {
          autoFocus: false,
          value: email,
          onChange: e => this.setState({ email: e.target.value })
        },
        error: Utils.summarizeErrors(errors && errors.email)
      }),
      Forms.requiredFormLabel('Type'),
      h(Select, {
        isMulti: false,
        value: type,
        onChange: ({ value }) => this.setState({ type: value }),
        options: [{ value: 'bug', label: 'Bug' }, { value: 'question', label: 'Question' }, { value: 'feature_request', label: 'Feature Request' }]
      }),
      Forms.requiredFormLabel('Subject'),
      textInput({
        autoFocus: true,
        value: subject,
        onChange: e => this.setState({ subject: e.target.value })
      }),
      Forms.requiredFormLabel(`How can we help you${greetUser}`),
      h(TextArea, {
        style: { height: 180 },
        placeholder: 'Enter a description',
        autoFocus: false,
        value: description,
        onChange: e => this.setState({ description: e.target.value })
      }),
      submitError && div({ style: { marginTop: '0.5rem', textAlign: 'right', color: colors.red[0] } }, [submitError]),
      submitting && spinnerOverlay
    ])
  }

  async componentDidMount() {
    try {
      const { ajax: { User } } = this.props
      const { keyValuePairs } = await User.profile.get()
      const contactEmail = _.find({ key: 'contactEmail' }, keyValuePairs).value
      !!contactEmail && this.setState({ email: contactEmail })
    } catch (error) {
      reportError('Error finding contact email', error)
    }
  }

  async submit() {
    const { onSuccess, ajax: { User } } = this.props
    const { email, type, description, subject } = this.state
    const { givenName, familyName } = getUser()
    const name = `${givenName} ${familyName}`
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
