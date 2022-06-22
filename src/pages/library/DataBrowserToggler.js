import _ from 'lodash/fp'
import { Fragment, useState } from 'react'
import { div, h, label, strong } from 'react-hyperscript-helpers'
import { ButtonPrimary, IdContainer, Link, spinnerOverlay, Switch } from 'src/components/common'
import { icon } from 'src/components/icons'
import { TextArea, TextInput } from 'src/components/input'
import Modal from 'src/components/Modal'
import TooltipTrigger from 'src/components/TooltipTrigger'
import { Ajax } from 'src/libs/ajax'
import colors from 'src/libs/colors'
import { isDataBrowserVisible } from 'src/libs/config'
import { FormLabel } from 'src/libs/forms'
import * as Nav from 'src/libs/nav'
import { useStore } from 'src/libs/react-utils'
import { authStore } from 'src/libs/state'
import * as Utils from 'src/libs/utils'
import { catalogPreviewStore } from 'src/pages/library/dataBrowser-utils'
import validate from 'validate.js'


const DataBrowserFeedbackModal = ({ onSuccess, onDismiss }) => {
  const [contactEmail, setContactEmail] = useState('')
  const [feedback, setFeedback] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const submit = Utils.withBusyState(setSubmitting, async () => {
    await Ajax().Surveys.submitForm('1FAIpQLSevEVLKiLNACAsti8k2U8EVKGHmQ4pJ8_643MfdY2lZEIusyw',
      { 'entry.477992521': feedback, 'entry.82175827': contactEmail })
    onSuccess()
  })

  const errors = validate({ feedback, contactEmail },
    { feedback: { length: { minimum: 1, maximum: 2000 } }, contactEmail: contactEmail ? { email: true } : {} })

  return h(Modal, {
    onDismiss,
    shouldCloseOnEsc: false,
    width: 500,
    title: 'Give feedback',
    okButton: h(TooltipTrigger, { content: !!errors && _.map(error => div({ key: error }, [error]), errors) },
      [h(ButtonPrimary, {
        disabled: errors,
        onClick: submit
      }, ['Submit'])]
    )
  }, [
    h(IdContainer, [id => h(Fragment, [
      h(FormLabel, { required: true, htmlFor: id, style: { fontSize: 14, fontWeight: 300 } },
        ['Please tell us about your experience with the new Data Catalog']),
      h(TextArea, {
        id,
        autoFocus: true,
        value: feedback,
        onChange: setFeedback,
        placeholder: 'Enter feedback',
        style: { height: '8rem', marginTop: '0.25rem' }
      }
      )
    ])]),
    div({ style: { display: 'flex', justifyContent: 'flex-end', fontSize: 12 } }, ['2000 Character limit']),
    h(IdContainer, [id => h(Fragment, [
      h(FormLabel, { htmlFor: id, style: { fontSize: 14 } },
        ['Can we contact you with further questions?']),
      h(TextInput, {
        id,
        value: contactEmail,
        onChange: setContactEmail,
        placeholder: 'Enter email address',
        style: { marginTop: '0.25rem' }
      }
      )
    ])]),
    submitting && spinnerOverlay
  ])
}


export const DataBrowserPreviewToggler = ({ checked }) => {
  const { user: { id } } = useStore(authStore)
  const [feedbackShowing, setFeedbackShowing] = useState(false)
  const [thanksShowing, setThanksShowing] = useState(false)
  catalogPreviewStore.set({ [id]: checked })

  return !isDataBrowserVisible() ? div() : div({
    style: {
      background: colors.dark(0.1),
      padding: '10px 15px',
      margin: 15,
      border: '1px solid', borderColor: colors.accent(), borderRadius: 3,
      display: 'flex', flexDirection: 'row'
    }
  }, [
    div({ style: { display: 'flex', flexDirection: 'column' } }, [
      strong(['Preview the new Data Catalog']),
      label({
        role: 'link',
        style: { fontWeight: 'bold', display: 'flex', flexDirection: 'row', alignItems: 'center', marginTop: 6 }
      }, [
        h(Switch, {
          checked,
          onLabel: '', offLabel: '',
          width: 55, height: 25,
          onChange: () => {
            catalogPreviewStore.set({ [id]: !checked })
            if (checked) {
              Nav.goToPath('library-datasets')
            } else {
              Nav.goToPath('library-browser')
            }
          }
        }),
        div({ style: { marginLeft: 10 } }, [`BETA Data Catalog ${checked ? 'ON' : 'OFF'}`])
      ])
    ]),
    checked && div({ style: { display: 'flex' } }, [
      icon('talk-bubble', { size: 45, style: { marginLeft: '1.5rem', margin: '0 0.5rem' } }),
      div({ style: { display: 'flex', flexDirection: 'column' } }, [
        strong('Provide feedback'),
        h(Link, {
          onClick: () => setFeedbackShowing(true),
          style: { display: 'block', marginTop: 10 }
        },
        ['What do you think about the new Data Catalog?'])
      ])
    ]),
    feedbackShowing && h(DataBrowserFeedbackModal, {
      title: '',
      onDismiss: () => setFeedbackShowing(false),
      onSuccess: () => {
        setFeedbackShowing(false)
        setThanksShowing(true)
      }
    }),
    thanksShowing && h(Modal, {
      onDismiss: () => setThanksShowing(false),
      showCancel: false,
      okButton: h(ButtonPrimary, {
        onClick: () => setThanksShowing(false)
      },
      ['OK'])
    },
    [div({ style: { fontWeight: 600, fontSize: 18 } },
      'Thank you for helping us improve the Data Catalog experience!')]
    )
  ])
}

