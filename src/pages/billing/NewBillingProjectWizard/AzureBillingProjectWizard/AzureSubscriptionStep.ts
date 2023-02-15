import _ from 'lodash/fp'
import { Fragment, useEffect, useRef, useState } from 'react'
import { div, h, p } from 'react-hyperscript-helpers'
import { Link, Select, useUniqueId } from 'src/components/common'
import { ValidatedInputWithRef } from 'src/components/input'
import { Ajax } from 'src/libs/ajax'
import Events from 'src/libs/events'
import { useCancellation } from 'src/libs/react-utils'
import { summarizeErrors } from 'src/libs/utils'
import * as Utils from 'src/libs/utils'
import { AzureManagedAppCoordinates } from 'src/pages/billing/models/AzureManagedAppCoordinates'
import {
  columnEntryStyle,
  rowStyle
} from 'src/pages/billing/NewBillingProjectWizard/AzureBillingProjectWizard/styles'
import { Step } from 'src/pages/billing/NewBillingProjectWizard/StepWizard/Step'
import {
  LabeledField, legendDetailsStyle,
  StepFieldLegend,
  StepFields
} from 'src/pages/billing/NewBillingProjectWizard/StepWizard/StepFields'
import { StepHeader } from 'src/pages/billing/NewBillingProjectWizard/StepWizard/StepHeader'
import { validate as validateUuid } from 'uuid'
import { validate } from 'validate.js'

import { ExternalLink } from '../StepWizard/ExternalLink'


type AzureSubscriptionStepProps = {
  isActive: boolean
  subscriptionId?: string
  onSubscriptionIdChanged: (string) => void
  managedApp?: AzureManagedAppCoordinates
  onManagedAppSelected: (AzureManagedAppCoordinates) => void
  isBusy?: boolean
  setIsBusy: (boolean) => void
}

const managedAppsToOptions = (apps: AzureManagedAppCoordinates[]) => _.map(application => {
  return {
    value: application,
    label: !!application.region ?
      `${application.applicationDeploymentName} (${application.region})` :
      application.applicationDeploymentName
  }
}, apps)

// @ts-ignore
validate.validators.type.types.uuid = value => validateUuid(value)
// @ts-ignore
validate.validators.type.messages.uuid = 'must be a UUID'

export const AzureSubscriptionStep = ({ isActive, subscriptionId, ...props }: AzureSubscriptionStepProps) => {
  const [managedApps, setManagedApps] = useState<AzureManagedAppCoordinates[]>([])
  const [errorFetchingManagedApps, setErrorFetchingManagedApps] = useState<boolean|undefined>(undefined)
  const [subscriptionIdTouched, setSubscriptionIdTouched] = useState(false)

  const subscriptionIdInput = useRef<any>()
  const subscriptionInputId = useUniqueId()
  const appSelectId = useUniqueId()

  const signal = useCancellation()

  const subscriptionIdErrors = validate({ subscriptionId }, { subscriptionId: { type: 'uuid' } })
  const isValidSubscriptionId = !!subscriptionId && !subscriptionIdErrors

  useEffect(() => {
    if (isValidSubscriptionId) {
      const fetchManagedApps = Utils.withBusyState(props.setIsBusy,
        async () => {
          Ajax().Metrics.captureEvent(Events.billingAzureCreationSubscriptionEntered)
          try {
            // Hack for Lou to test
            if (subscriptionId === '0fa61a72-3a6b-4d51-a7e9-75fbeb7c7ed9') {
              const dummyManagedApp = {
                applicationDeploymentName: 'FakeManagedAppDeployment',
                managedResourceGroupId: 'mrg-terra-dev-previ-20230215130800',
                region: 'eastus',
                subscriptionId: 'df547342-9cfd-44ef-a6dd-df0ede32f1e3',
                tenantId: 'fad90753-2022-4456-9b0a-c7e5b934e408'
              }
              setManagedApps([dummyManagedApp])
            } else {
              const managedApps = await Ajax(signal).Billing.listAzureManagedApplications(subscriptionId, false)
              setManagedApps(managedApps.managedApps)
            }
            setErrorFetchingManagedApps(false)
          } catch (obj) {
            setErrorFetchingManagedApps(true)
            // We can't rely on the formatting of the error, so show a generic message but include the error in the console for debugging purposes.
            const error = await (obj instanceof Response ? obj.text() : obj)
            console.error(error)
          }
        }
      )
      fetchManagedApps()
    }
  }, [isValidSubscriptionId, subscriptionId, signal, props.setIsBusy])

  useEffect(() => {
    // setTimeout necessary because of UIE-73.
    setTimeout(() => subscriptionIdInput.current?.focus(), 0)
  }, [])

  const subscriptionIdError = Utils.cond(
    [subscriptionIdTouched && !isValidSubscriptionId, () => summarizeErrors(subscriptionIdErrors?.subscriptionId)],
    [isValidSubscriptionId && managedApps.length === 0 && !props.isBusy, () => h(Fragment, [
      div({ key: 'message' }, ['No Terra Managed Applications exist for that subscription. ',
        h(Link, {
          href: 'https://portal.azure.com/#view/Microsoft_Azure_Marketplace/MarketplaceOffersBlade/selectedMenuItemId/home',
          ...Utils.newTabLinkProps
        }, ['Go to the Azure Marketplace']),
        ' to create a Terra Managed Application.'])
    ])],
    [Utils.DEFAULT, () => undefined]
  )

  const subscriptionIdChanged = v => {
    setErrorFetchingManagedApps(undefined)
    setManagedApps([])
    props.onSubscriptionIdChanged(v)
    setSubscriptionIdTouched(true)
    if (isValidSubscriptionId) {
      Ajax().Metrics.captureEvent(Events.billingAzureCreationSubscriptionEntered)
    }
  }

  return h(Step, { isActive, style: { minHeight: '18rem', paddingBottom: '0.5rem' } }, [
    h(StepHeader, { title: 'STEP 1' }),
    h(StepFields, { style: { flexDirection: 'column' } }, [
      h(StepFieldLegend, [
        'Link Terra to an unassigned managed application in your Azure subscription. A managed application instance can only be assigned to a single Terra billing project.',
        p({ style: legendDetailsStyle }, [
          ExternalLink({ text: 'Go to the Azure Portal', url: 'https://portal.azure.com/' }),
          ' to access your Azure Subscription ID, and to find or create your managed application.'
        ])
      ]),
      div({ style: rowStyle }, [
        h(LabeledField, {
          style: columnEntryStyle(true),
          label: 'Enter your Azure subscription ID', formId: subscriptionInputId, required: true
        }, [
          h(ValidatedInputWithRef, {
            inputProps: {
              id: subscriptionInputId,
              placeholder: 'Azure Subscription ID',
              onChange: subscriptionIdChanged,
              value: subscriptionId,
            },
            ref: subscriptionIdInput,
            error: subscriptionIdError
          })
        ]),

        h(LabeledField, {
          formId: appSelectId, required: true, style: columnEntryStyle(false),
          label: ['Unassigned managed application']
        }, [
          h(Select, {
            id: appSelectId,
            placeholder: 'Select a managed application',
            isMulti: false,
            isDisabled: errorFetchingManagedApps !== false || !!subscriptionIdError,
            value: props.managedApp,
            onChange: ({ value }) => {
              props.onManagedAppSelected(value)
              Ajax().Metrics.captureEvent(Events.billingAzureCreationMRGSelected)
            },
            options: managedAppsToOptions(managedApps)
          }),
        ])
      ])
    ])
  ])
}

