import _ from 'lodash/fp'
import { useState } from 'react'
import { div, h, span, table, tbody, td, th, thead, tr } from 'react-hyperscript-helpers'
import { ButtonPrimary, IdContainer } from 'src/components/common'
import { TextArea } from 'src/components/input'
import Modal from 'src/components/Modal'
import { Ajax } from 'src/libs/ajax'
import { withErrorReporting } from 'src/libs/error'
import { FormLabel } from 'src/libs/forms'
import * as Utils from 'src/libs/utils'


export const RequestDatasetAccessModal = ({ onDismiss, datasets }) => {
  const [reason, setReason] = useState('')

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
      })
    ])]),
    table({ style: { margin: '1rem', width: '100%' } }, [
      thead([
        tr({ style: { height: '2rem' } }, [th({ style: { textAlign: 'left' } }, ['Datasets']), th({ style: { textAlign: 'left', width: '15rem' } }, ['Access'])])
      ]),
      tbody(
        _.map(dataset => tr({ key: dataset.id, style: { height: '2rem' } }, [
          td({ style: { paddingRight: 20 } }, [dataset['dct:title']]),
          td([
            dataset.locked ?
              h(RequestDatasetAccessButton, {
                datasetName: dataset['dct:title']
              }) :
              span({ style: { fontWeight: 600 } }, ['Permission Granted'])
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
    await Ajax(signal).requestAccess(dataset.id)
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
