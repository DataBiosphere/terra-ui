import _ from 'lodash/fp'
import { createRef, Fragment } from 'react'
import Dropzone from 'react-dropzone'
import { div, h, span } from 'react-hyperscript-helpers'
import { Clickable, buttonPrimary, Select, spinnerOverlay, link, linkButton, buttonSecondary } from 'src/components/common'
import { icon } from 'src/components/icons'
import { TextArea, TextInput } from 'src/components/input'
import { notify } from 'src/components/Notifications'
import { Ajax } from 'src/libs/ajax'
import { authStore } from 'src/libs/auth'
import colors from 'src/libs/colors'
import { reportError } from 'src/libs/error'
import { FormLabel, RequiredFormLabel } from 'src/libs/forms'
import * as Style from 'src/libs/style'
import * as Utils from 'src/libs/utils'
import { Component } from 'src/libs/wrapped-components'
import validate from 'validate.js'


export const contactUsActive = Utils.atom(false)

const constraints = {
  name: { presence: { allowEmpty: false } },
  subject: { presence: { allowEmpty: false } },
  description: { presence: { allowEmpty: false } },
  email: { email: true, presence: { allowEmpty: false } }
}

const styles = {
  buttonRow: {
    marginTop: '1rem',
    display: 'flex', justifyContent: 'flex-end', alignItems: 'baseline'
  }
}

// If you are making changes to the Support Request Modal, make sure you test the following:
// 1. Submit a ticket via Terra while signed in and signed out
// 2. Check the tickets are generated on Zendesk
// 3. Reply internally (as a Light Agent) and make sure an email is not sent
// 4. Reply externally (ask one of the Comms team with Full Agent access) and make sure you receive an email

const SupportRequest = _.flow(
  Utils.connectAtom(contactUsActive, 'isActive'),
  Utils.connectAtom(authStore, 'authState')
)(class SupportRequest extends Component {
  constructor(props) {
    super(props)
    this.state = this.initialFormState()
    this.uploader = createRef()
  }

  componentDidUpdate(prevProps) {
    if (!prevProps.isActive && this.props.isActive) {
      this.setState(this.initialFormState())
    }
  }

  initialFormState() {
    const { authState: { profile: { contactEmail, email } } } = this.props
    return {
      subject: '',
      description: '',
      type: 'question',
      email: contactEmail || email || '',
      nameEntered: '',
      attachmentToken: '',
      uploadingFile: false,
      attachmentName: ''
    }
  }

  hasName() {
    const { authState: { profile: { firstName } } } = this.props
    return !(firstName === 'N/A' || firstName === undefined)
  }

  async uploadFile(files) {
    try {
      this.setState({ uploadingFile: true })
      const attachmentRes = await Ajax().User.uploadAttachment(files[0])
      const attachmentToken = attachmentRes.token
      const attachmentName = attachmentRes.attachment.file_name
      this.setState({ attachmentToken, attachmentName, uploadingFile: false })
    } catch (error) {
      await reportError('Error uploading attachment', error)
      this.setState({ uploadingFile: false })
    }
  }

  getRequest() {
    const { authState: { profile: { firstName, lastName } } } = this.props
    const { nameEntered, email, description, subject, type, attachmentToken } = this.state

    return {
      name: this.hasName() ? `${firstName} ${lastName}` : nameEntered,
      email,
      description,
      subject,
      type,
      attachmentToken
    }
  }

  render() {
    const { isActive, authState: { profile: { firstName } } } = this.props
    const { submitting, submitError, subject, description, type, email, nameEntered, uploadingFile, attachmentToken, dragging, attachmentName } = this.state
    const greetUser = this.hasName() ? `, ${firstName}` : ''
    const errors = validate(this.getRequest(), constraints)

    return isActive && div({
      style: {
        position: 'fixed', bottom: '1.5rem', right: '1.5rem',
        backgroundColor: 'white',
        borderRadius: '0.5rem',
        width: 450,
        boxShadow: Style.modalShadow,
        zIndex: 2
      }
    }, [
      h(Dropzone, {
        maxSize: 20 * 1024 * 1024,
        disableClick: true,
        multiple: false,
        style: { flexGrow: 1 },
        activeStyle: { cursor: 'copy' },
        onDragOver: () => this.setState({ dragging: true }),
        onDrop: () => this.setState({ dragging: false }),
        onDragLeave: () => this.setState({ dragging: false }),
        ref: this.uploader,
        onDropRejected: e => reportError('Error uploading attachment', e),
        onDropAccepted: files => this.uploadFile(files)
      }, [
        div({ style: { padding: '1rem' } }, [
          div({ style: { fontSize: 18, fontWeight: 'bold', color: colors.accent() } }, ['Contact Us']),
          !this.hasName() && h(Fragment, [
            h(RequiredFormLabel, ['Name']),
            h(TextInput, {
              placeholder: 'What should we call you?',
              autoFocus: true,
              value: nameEntered,
              onChange: v => this.setState({ nameEntered: v })
            })
          ]),
          h(RequiredFormLabel, ['Type']),
          h(Select, {
            isMulti: false,
            value: type,
            onChange: ({ value }) => this.setState({ type: value }),
            options: [{ value: 'question', label: 'Question' }, { value: 'bug', label: 'Bug' }, { value: 'feature_request', label: 'Feature Request' }]
          }),
          h(RequiredFormLabel, [`How can we help you${greetUser}?`]),
          h(TextInput, {
            style: { borderBottomLeftRadius: 0, borderBottomRightRadius: 0, borderBottomStyle: 'dashed' },
            placeholder: 'Enter a subject',
            autoFocus: this.hasName(),
            value: subject,
            onChange: v => this.setState({ subject: v })
          }),
          h(TextArea, {
            style: { height: 200, borderTopLeftRadius: 0, borderTopRightRadius: 0, borderTopStyle: 'dashed' },
            placeholder: 'Enter a description',
            value: description,
            onChange: v => this.setState({ description: v })
          }),
          h(FormLabel, ['Attachment']),
          attachmentToken ?
            div({ style: { display: 'flex', alignItems: 'center' } }, [
              h(Clickable, {
                tooltip: 'Change file',
                style: { flex: 'auto' },
                onClick: () => this.uploader.current.open()
              }, [
                div({
                  style: { marginLeft: '1rem', paddingTop: '0.5rem' }
                }, [
                  'Successfully uploaded: ', span({ style: { color: colors.primary(1.2) } }, [attachmentName])
                ])
              ]),
              linkButton({
                tooltip: 'Remove file',
                style: { flex: 0, paddingTop: '0.5rem' },
                onClick: () => this.setState({ attachmentToken: '' })
              }, [icon('times-circle', { size: 23 })])
            ]) :
            h(Clickable, {
              style: {
                flex: 1, backgroundColor: dragging ? colors.primary(0.2) : colors.dark(0.1), borderRadius: 3,
                border: `1px dashed ${colors.dark(0.7)}`
              },
              onClick: () => this.uploader.current.open()
            }, [
              div({ style: { fontSize: 14, lineHeight: '30px', paddingLeft: '1rem' } }, [
                'Drag or ', link({}, ['Click']), ' to attach a file ',
                icon('upload-cloud', { size: 25, style: { opacity: 0.4 } })
              ])
            ]),
          uploadingFile && spinnerOverlay,
          h(RequiredFormLabel, ['Contact email']),
          h(TextInput, {
            value: email,
            placeholder: 'Enter your email address',
            onChange: v => this.setState({ email: v })
          }),
          submitError && div({ style: { marginTop: '0.5rem', textAlign: 'right', color: colors.danger() } }, [submitError]),
          submitting && spinnerOverlay,
          div({ style: styles.buttonRow }, [
            buttonSecondary({
              style: { marginRight: '1rem' },
              onClick: () => SupportRequest.dismiss()
            }, ['Cancel']),
            buttonPrimary({
              disabled: errors,
              tooltip: Utils.summarizeErrors(errors),
              onClick: () => this.submit()
            }, ['SEND'])
          ])
        ])
      ])
    ])
  }

  static dismiss() {
    contactUsActive.set(false)
  }

  submit = Utils.withBusyState(v => this.setState({ submitting: v }), async () => {
    const { type, email, subject, description, attachmentToken } = this.state
    const currUrl = window.location.href
    const hasAttachment = attachmentToken !== ''

    try {
      await Ajax().User.createSupportRequest({ ...this.getRequest(), currUrl })
      notify('success', 'Message sent successfully', { timeout: 3000 })
    } catch (error) {
      notify('error', div(['Error submitting support request. ',
        link({
          style: { fontWeight: 800, color: 'white' },
          hover: { color: 'white', textDecoration: 'underline' },
          href: `mailto:terra-support@broadinstitute.zendesk.org?subject=${type}%3A%20${subject}&body=Original%20support%20request%3A%0A------------------------------------%0AContact email%3A%20${email}%0A%0A${description}%0A%0A------------------------------------%0AError%20reported%20from%20Zendesk%3A%0A%0A${JSON.stringify(error)}`,
          ...Utils.newTabLinkProps
        }, 'Click here to email support'), hasAttachment && ' and make sure to add your attachment to the email.']
      ))
    } finally {
      SupportRequest.dismiss()
    }
  })
})

export default SupportRequest
