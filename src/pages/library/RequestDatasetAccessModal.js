import _ from 'lodash/fp'
import { useState } from 'react'
import { div, h, label, span, strong, table, tbody, td, th, thead, tr } from 'react-hyperscript-helpers'
import { ButtonPrimary, IdContainer, LabeledCheckbox } from 'src/components/common'
import { TextArea } from 'src/components/input'
import Modal from 'src/components/Modal'
import { Ajax } from 'src/libs/ajax'
import { withErrorReporting } from 'src/libs/error'
import Events from 'src/libs/events'
import { FormLabel } from 'src/libs/forms'
import * as Utils from 'src/libs/utils'
import { datasetAccessTypes, getDatasetAccessType } from 'src/pages/library/dataBrowser-utils'


const sendCopyEnabled = false
const requestAccessEnabled = false

export const RequestDatasetAccessModal = ({ onDismiss, datasets }) => {
  const [reason, setReason] = useState('')
  const [sendCopy, setSendCopy] = useState(false)
  const [showWipModal, setShowWipModal] = useState(false)

  return showWipModal ? h(Modal, {
    title: 'Keep in mind we\'re still in development',
    width: '32rem',
    showButtons: false,
    onDismiss: () => {}
  }, [
    div({ style: { lineHeight: '1.7rem' } }, [
      'In the near future, when you click on ', strong(['Request Access']),
      ', the request will be sent to the appropriate approver and the dataset will be marked as ',
      strong(['Pending']), '.'
    ]),
    div({ style: { marginTop: 30, display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' } }, [
      'Let\'s continue testing the new Data Catalog!',
      h(ButtonPrimary, {
        onClick: onDismiss,
        style: { padding: '20px 30px' }
      }, 'OK')
    ])
  ]) :
    h(Modal, {
      title: 'Request Access',
      width: '40rem',
      showButtons: false,
      showX: true,
      xIcon: 'times',
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
            label({ style: { margin: '0 2rem 0 0.25rem' } }, ['Also send me a copy'])
          ])
        ])
      ])]),
      table({ style: { margin: '1rem', width: '100%' } }, [
        thead([
          tr({ style: { height: '2rem' } }, [th({ style: { textAlign: 'left' } }, ['Datasets']), th({ style: { textAlign: 'left', width: '15rem' } }, ['Access'])])
        ]),
        tbody(
          _.map(dataset => tr({ key: dataset.id, style: { height: '2rem' } }, [
            td({ style: { paddingRight: 20 } }, [
              dataset['dct:title']
            ]),
            td([
              Utils.switchCase(getDatasetAccessType(dataset),
                [datasetAccessTypes.CONTROLLED, () => h(RequestDatasetAccessButton, { title: dataset['dct:title'], id: dataset.id, setShowWipModal })],
                [datasetAccessTypes.PENDING, () => span({ style: { fontWeight: 600 } }, ['Request Pending'])],
                [Utils.DEFAULT, () => span({ style: { fontWeight: 600 } }, ['Permission Granted'])]
              )
            ])
          ]), datasets)
        )
      ])
    ])
}

const RequestDatasetAccessButton = ({ title, id, setShowWipModal }) => {
  const [status, setStatus] = useState('')

  return h(ButtonPrimary, {
    disabled: status,
    onClick: withErrorReporting('Error requesting dataset access', () => {
      // TODO DC-309: Make Access Requests point to the data catalog
      !requestAccessEnabled && setShowWipModal(true)
      setStatus('Request Sent')
      Ajax().Metrics.captureEvent(`${Events.catalogRequestAccess}:confirmed`, {
        id,
        title
      })
    })
  }, [
    status || 'Request Access'
  ])
}
