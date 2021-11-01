import _ from 'lodash/fp'
import { useState } from 'react'
import { div, h, label, span, table, tbody, td, th, thead, tr } from 'react-hyperscript-helpers'
import { ButtonPrimary, IdContainer, LabeledCheckbox, Link } from 'src/components/common'
import { TextArea } from 'src/components/input'
import Modal from 'src/components/Modal'
import { Ajax } from 'src/libs/ajax'
import { withErrorReporting } from 'src/libs/error'
import { FormLabel } from 'src/libs/forms'
import * as Utils from 'src/libs/utils'


const sendCopyEnabled = false

export const RequestDatasetAccessModal = ({ onDismiss, datasets }) => {
  const [reason, setReason] = useState('')
  const [sendCopy, setSendCopy] = useState(false)

  return h(Modal, {
    title: 'Request Access',
    width: '40rem',
    showButtons: false,
    showX: true,
    onDismiss
  }, [
    div([
      'You cannot access this dataset because it is protected by an Authorization Domain. ',
      'You need to obtain permission from the owner(s) of this dataset in order to get access. ',
      'Clicking the "Request Access" button below will send an email to the admins of that dataset.'
    ]),
    h(IdContainer, [id => div([
      h(FormLabel, { htmlFor: id }, ['Please tell us why']),
      h(TextArea, {
        id,
        style: { height: 100, marginBottom: '0.5rem' },
        placeholder: 'Enter your reason',
        value: reason,
        onChange: setReason
      }),
      sendCopyEnabled && div([
        h(LabeledCheckbox, {
          checked: sendCopy,
          onChange: setSendCopy
        }, [
          label({ style: { margin: '0 2rem 0 0.25rem' } }, [`Also send me a copy`])
        ])
      ])
    ])]),
    table({ style: { margin: '1rem', width: '100%' } }, [
      thead([
        tr({ style: { height: '2rem' } }, [th({ style: { textAlign: 'left' } }, ['Datasets']), th({ style: { textAlign: 'left', width: '15rem' } }, ['Access'])])
      ]),
      tbody(
        _.map(({ 'dct:title': title, access, id, contacts }) => tr({ key: id, style: { height: '2rem' } }, [
          td({ style: { paddingRight: 20 } }, [
            title,
            div({ style: { fontSize: '.7rem', marginTop: 5, width: 'fit-content' } }, [
              _.map(({ email }) => email && h(Link, { key: email, href: `mailto:${email}`, style: { marginTop: 5, display: 'block' } }, [email]), contacts)
            ])
          ]),
          td([
            Utils.switchCase(access,
              ['Controlled', () => h(RequestDatasetAccessButton, { datasetName: title })],
              ['Pending', () => span({ style: { fontWeight: 600 } }, ['Request Pending'])],
              [Utils.DEFAULT, () => span({ style: { fontWeight: 600 } }, ['Permission Granted'])]
            )
          ])
        ]), datasets)
      )
    ])
  ])
}

const RequestDatasetAccessButton = ({ dataset }) => {
  const [requesting, setRequesting] = useState(false)
  const [requested, setRequested] = useState(false)
  const signal = Utils.useCancellation()

  const requestAccess = _.flow(
    Utils.withBusyState(setRequesting),
    withErrorReporting('Error requesting dataset access')
  )(async () => {
    await Ajax(signal).DataRepo.requestAccess(dataset.id)
    setRequested(true)
  })

  return h(ButtonPrimary, {
    disabled: requesting || requested,
    onClick: requestAccess
  }, [
    Utils.cond(
      [requested, () => 'Request Sent'],
      [requesting, () => 'Sending Request...'],
      () => 'Request Access'
    )
  ])
}
