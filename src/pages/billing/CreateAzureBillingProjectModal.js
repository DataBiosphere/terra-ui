import _ from 'lodash/fp'
import { Fragment, useEffect, useState } from 'react'
import { div, h } from 'react-hyperscript-helpers'
import { ButtonPrimary, IdContainer, Link, Select, spinnerOverlay } from 'src/components/common'
import { icon } from 'src/components/icons'
import { ValidatedInput } from 'src/components/input'
import Modal from 'src/components/Modal'
import { InfoBox } from 'src/components/PopupTrigger'
import { Ajax } from 'src/libs/ajax'
import colors from 'src/libs/colors'
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
      onSuccess(billingProjectName)
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
            const managedApps = await Ajax(signal).Billing.listAzureManagedApplications(subscriptionId, false)
            setManagedApps(managedApps.managedApps)
            setErrorFetchingManagedApps(false)
          } catch (obj) {
            setManagedApps([])
            setChosenManagedApp('')
            setErrorFetchingManagedApps(true)
            // We can't rely on the formatting of the error, so show a generic message but include the error in the console for debugging purposes.
            const error = await (obj instanceof Response ? obj.text() : obj)
            console.error(`HERE: ${error}`)
          }
        }
      )
      fetchManagedApps()
    }
  }, [isValidSubscriptionId, subscriptionId, signal])

  const subscriptionIdError = Utils.cond(
    [subscriptionIdTouched && !isValidSubscriptionId, () => Utils.summarizeErrors(subscriptionIdErrors?.subscriptionId)],
    [errorFetchingManagedApps, () => 'Unable to retrieve Managed Applications for that subscription'],
    [errorFetchingManagedApps === false && managedApps.length === 0, () => h(Fragment, [
      div({ key: 'message' }, ['No Terra Managed Applications exist for that subscription. ',
        h(Link, {
          href: 'https://portal.azure.com/#view/Microsoft_Azure_Marketplace/MarketplaceOffersBlade/selectedMenuItemId/home',
          ...Utils.newTabLinkProps
        }, ['Go to the Azure Marketplace'])]),
      ' to create a Terra Managed Application.'
    ])],
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
        h(FormLabel, { htmlFor: id, required: true }, [
          'Azure subscription',
          h(InfoBox, { style: { marginLeft: '0.25rem' } }, [
            'You can copy your Subscription ID from the Azure Portal. ',
            h(Link, {
              href: 'https://portal.azure.com/',
              ...Utils.newTabLinkProps
            }, ['Go to the Azure Portal.'])
          ])
        ]),
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
        h(FormLabel, { htmlFor: id, required: true }, [
          'Unassigned managed application',
          h(InfoBox, { style: { marginLeft: '0.25rem' } }, [
            'A managed application instance can only be assigned to a single Terra billing ',
            'project. Only unassigned managed applications are included in the list below.'
          ])
        ]),
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
                label: !!application.region ?
                  `${application.applicationDeploymentName} (${application.region})` :
                  application.applicationDeploymentName
              }
            }, managedApps)
          })
        ])
      ])]),
      div({ style: { paddingTop: '1.0rem', display: 'flex' } },
        [
          icon('warning-standard', { size: 16, style: { marginRight: '0.5rem', color: colors.warning() } }),
          div(['Creating a Terra billing project currently costs about $5 per day. ',
            h(Link, {
              href: 'https://support.terra.bio/hc/en-us/articles/12029087819291',
              ...Utils.newTabLinkProps
            }, ['Learn more and follow changes.'])])
        ]
      ),
      div({ style: { paddingTop: '1.0rem', display: 'flex' } },
        [
          icon('clock', { size: 16, style: { marginRight: '0.5rem' } }),
          div(['It may take up to 15 minutes for the billing project to be fully created and ready for use.'])
        ]
      )
    ]),
    isBusy && spinnerOverlay
  ])
}

export default CreateAzureBillingProjectModal
