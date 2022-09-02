import _ from 'lodash/fp'
import { Fragment, useEffect, useState } from 'react'
import { div, h } from 'react-hyperscript-helpers'
import { ButtonPrimary, IdContainer, Select, spinnerOverlay } from 'src/components/common'
import { ValidatedInput } from 'src/components/input'
import Modal from 'src/components/Modal'
import { Ajax } from 'src/libs/ajax'
import { reportErrorAndRethrow } from 'src/libs/error'
import { formHint, FormLabel } from 'src/libs/forms'
import { useCancellation } from 'src/libs/react-utils'
import * as Utils from 'src/libs/utils'
import { validate as validateUuid } from 'uuid'
import validate from 'validate.js'


validate.validators.type.types.uuid = value => validateUuid(value)
validate.validators.type.messages.uuid = 'must be a UUID'

const CreateAzureBillingProjectModal = ({ onSuccess, onDismiss, billingProjectNameValidator }) => {
  const [billingProjectName, setBillingProjectName] = useState('')
  const [subscriptionId, setSubscriptionId] = useState('')
  const [managedApps, setManagedApps] = useState([])
  const [errorFetchingManagedApps, setErrorFetchingManagedApps] = useState(undefined)
  const [chosenManagedApp, setChosenManagedApp] = useState('')
  const [billingProjectNameTouched, setBillingProjectNameTouched] = useState(false)
  const [subscriptionIdTouched, setSubscriptionIdTouched] = useState(false)
  const [existing, setExisting] = useState([])
  const [isBusy, setIsBusy] = useState(false)

  const signal = useCancellation()

  const submit = _.flow(
    reportErrorAndRethrow('Error creating billing project'),
    Utils.withBusyState(setIsBusy)
  )(async () => {
    try {
      await Ajax().Billing.createAzureProject(billingProjectName, chosenManagedApp.tenantId, chosenManagedApp.subscriptionId,
        chosenManagedApp.managedResourceGroupId)
      onSuccess()
    } catch (error) {
      if (error.status === 409) {
        setExisting(_.concat(billingProjectName, existing))
      } else {
        throw error
      }
    }
  })

  // Field validation
  const billingProjectNameErrors = validate({ billingProjectName }, { billingProjectName: billingProjectNameValidator(existing) })
  const subscriptionIdErrors = validate({ subscriptionId }, { subscriptionId: { type: 'uuid' } })
  const isValidSubscriptionId = !!subscriptionId && !subscriptionIdErrors

  useEffect(() => {
    if (isValidSubscriptionId) {
      const fetchManagedApps = Utils.withBusyState(setIsBusy,
        async () => {
          try {
            const managedApps = await Ajax(signal).Billing.listAzureManagedApplications(subscriptionId)
            // console.log(managedApps)
            setManagedApps(managedApps.managedApps)
            setErrorFetchingManagedApps(false)
          } catch (obj) {
            setManagedApps([])
            setChosenManagedApp('')
            setErrorFetchingManagedApps(true)
            // We can't rely on the formatting of the error, so show a generic message but include the error in the console for debugging purposes.
            const error = await (obj instanceof Response ? obj.text() : obj)
            console.error(error)
          }
        }
      )
      fetchManagedApps()
    }
  }, [isValidSubscriptionId, subscriptionId, signal])

  const subscriptionIdError = Utils.cond(
    [subscriptionIdTouched && !isValidSubscriptionId, () => Utils.summarizeErrors(subscriptionIdErrors?.subscriptionId)],
    [errorFetchingManagedApps, () => `Unable to retrieve Managed Applications for that subscription`],
    [errorFetchingManagedApps === false && managedApps.length === 0, () => `No Terra Managed Applications exist for that subscription`],
    [Utils.DEFAULT, () => undefined]
  )

  return h(Modal, {
    onDismiss,
    shouldCloseOnOverlayClick: false,
    title: 'Create Terra Billing Project',
    okButton:
      h(ButtonPrimary, {
        disabled: billingProjectNameErrors || !isValidSubscriptionId || !chosenManagedApp,
        onClick: submit
      }, ['Create'])
  }, [
    h(Fragment, [
      h(IdContainer, [id => h(Fragment, [
        h(FormLabel, { htmlFor: id, required: true }, ['Terra billing project']),
        h(ValidatedInput, {
          inputProps: {
            id,
            autoFocus: true,
            value: billingProjectName,
            placeholder: 'Enter a name',
            onChange: v => {
              setBillingProjectName(v)
              setBillingProjectNameTouched(true)
            }
          },
          error: billingProjectNameTouched && Utils.summarizeErrors(billingProjectNameErrors?.billingProjectName)
        })
      ])]),
      !(billingProjectNameTouched && billingProjectNameErrors) && formHint('Name must be unique and cannot be changed.'),
      h(IdContainer, [id => h(Fragment, [
        h(FormLabel, { htmlFor: id, required: true }, ['Azure subscription']),
        h(ValidatedInput, {
          inputProps: {
            id,
            autoFocus: true,
            placeholder: 'Enter an Azure Subscription ID',
            onChange: v => {
              setErrorFetchingManagedApps(undefined)
              setSubscriptionId(v)
              setSubscriptionIdTouched(true)
            }
          },
          error: subscriptionIdError
        })
      ])]),
      h(IdContainer, [id => h(Fragment, [
        h(FormLabel, { htmlFor: id, required: true }, ['Managed application']),
        div({ style: { fontSize: 14 } }, [
          h(Select, {
            id,
            isMulti: false,
            placeholder: 'Select a managed application',
            isDisabled: errorFetchingManagedApps !== false || !!subscriptionIdError,
            value: chosenManagedApp,
            onChange: ({ value }) => setChosenManagedApp(value),
            options: _.map(application => {
              return {
                value: application,
                label: application.applicationDeploymentName
              }
            }, managedApps)
          })
        ])
      ])])
    ]),
    isBusy && spinnerOverlay
  ])
}

export default CreateAzureBillingProjectModal
