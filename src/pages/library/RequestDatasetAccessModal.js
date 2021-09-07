import _ from 'lodash/fp'
import { useState } from 'react'
import { div, h, span, table, tbody, td, th, thead, tr } from 'react-hyperscript-helpers'
import { ButtonPrimary, IdContainer } from 'src/components/common'
import { TextArea } from 'src/components/input'
import Modal from 'src/components/Modal'
import { Ajax } from 'src/libs/ajax'
import { withErrorReporting } from 'src/libs/error'
import { FormLabel } from 'src/libs/forms'
import { cond, useCancellation, withBusyState } from 'src/libs/utils'


export const RequestDatasetAccessModal = ({ onDismiss, datasets }) => {
  const [reason, setReason] = useState('')

  return h(Modal, {
    title: 'Request Access',
    width: '40rem',
    showCancel: false,
    onDismiss
  }, [
    div([`
      You cannot access this dataset because it is protected by an Authorization Domain.
      You need to obtain permission from the owner(s) of this dataset in order to get access.
      Clicking the "Request Access" button below will send an email to the admins of that dataset.`]),
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
        _.map(dataset => tr({ style: { height: '2rem' } }, [
          td([dataset.name]),
          td([
            dataset.locked ?
              h(RequestDatasetAccessButton, {
                datasetName: dataset.name
              }) :
              span({ style: { fontWeight: 600 } }, ['Yes'])
          ])
        ]), datasets)
      )
    ])
  ])
}

const RequestDatasetAccessButton = ({ dataset }) => {
  const [requesting, setRequesting] = useState(false)
  const [requested, setRequested] = useState(false)
  const signal = useCancellation()

  const { DataRepo } = Ajax(signal)

  const requestAccess = _.flow(
    withBusyState(setRequesting),
    withErrorReporting('Error requesting group access')
  )(async () => {
    await DataRepo.requestAccess(dataset.id)
    setRequested(true)
  })

  return h(ButtonPrimary, {
    disabled: requesting || requested,
    onClick: async () => {
      await requestAccess()
    }
  }, [
    cond(
      [requested, () => 'Request Sent'],
      [requesting, () => 'Sending Request...'],
      () => 'Request Access'
    )
  ])
}
