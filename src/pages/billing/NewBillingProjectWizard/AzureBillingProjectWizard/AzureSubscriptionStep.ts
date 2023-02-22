import _ from 'lodash/fp'
import { ReactNode, useEffect, useRef, useState } from 'react'
import { div, h, p } from 'react-hyperscript-helpers'
import { customSpinnerOverlay, Link, Select, useUniqueId } from 'src/components/common'
import { ValidatedInputWithRef } from 'src/components/input'
import { Ajax } from 'src/libs/ajax'
import { useLoadedData } from 'src/libs/ajax/loaded-data/useLoadedData'
import { useCancellation } from 'src/libs/react-utils'
import { summarizeErrors } from 'src/libs/utils'
import * as Utils from 'src/libs/utils'
import { AzureManagedAppCoordinates } from 'src/pages/billing/models/AzureManagedAppCoordinates'
import {
  columnEntryStyle,
  rowStyle
} from 'src/pages/billing/NewBillingProjectWizard/AzureBillingProjectWizard/styles'
import { ExternalLink } from 'src/pages/billing/NewBillingProjectWizard/StepWizard/ExternalLink'
import { Step } from 'src/pages/billing/NewBillingProjectWizard/StepWizard/Step'
import {
  LabeledField, legendDetailsStyle,
  StepFieldLegend,
  StepFields
} from 'src/pages/billing/NewBillingProjectWizard/StepWizard/StepFields'
import { StepHeader } from 'src/pages/billing/NewBillingProjectWizard/StepWizard/StepHeader'
import { validate as validateUuid } from 'uuid'
import { validate } from 'validate.js'


type AzureSubscriptionStepProps = {
  isActive: boolean
  subscriptionId?: string // undefined indicates the value hasn't been changed by the user yet
  onSubscriptionIdChanged: (string, boolean) => void
  managedApp?: AzureManagedAppCoordinates
  onManagedAppSelected: (AzureManagedAppCoordinates) => void
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
  const [subscriptionIdError, setSubscriptionIdError] = useState<ReactNode>()
  const [managedApps, setManagedApps] = useLoadedData<AzureManagedAppCoordinates[]>({
    onError: state => {
      // We can't rely on the formatting of the error, so show a generic message but include the error in the console for debugging purposes.
      if (state.error instanceof Response) {
        state.error.text().then(console.error)
      } else {
        console.error(state.error)
      }
    }
  })
  const subscriptionIdInput = useRef<HTMLInputElement>()
  const subscriptionInputId = useUniqueId()
  const appSelectId = useUniqueId()
  const signal = useCancellation()

  const getSubscriptionIdErrors = subscriptionId => subscriptionId !== undefined && validate({ subscriptionId }, { subscriptionId: { type: 'uuid' } })

  useEffect(() => {
    // setTimeout necessary because of UIE-73.
    setTimeout(() => subscriptionIdInput.current?.focus(), 0)
  }, [])

  useEffect(() => {
    const subscriptionIdErrors = getSubscriptionIdErrors(subscriptionId)?.subscriptionId
    if (!!subscriptionIdErrors) {
      setSubscriptionIdError(summarizeErrors(subscriptionIdErrors))
    } else if (!!subscriptionId) {
      setManagedApps(async () => {
        setSubscriptionIdError(undefined)
        const response = await Ajax(signal).Billing.listAzureManagedApplications(subscriptionId, false)
        const managedApps = response.managedApps
        if (managedApps.length === 0) {
          setSubscriptionIdError(h(NoManagedApps))
        }
        return managedApps
      })
    }
  }, [subscriptionId, setManagedApps, signal])

  const subscriptionIdChanged = v => props.onSubscriptionIdChanged(v, !!getSubscriptionIdErrors(v))

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
              value: subscriptionId ?? '',
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
            isDisabled: managedApps.status !== 'Ready' || !!subscriptionIdError,
            value: props.managedApp,
            onChange: ({ value }) => {
              props.onManagedAppSelected(value)
            },
            options: managedAppsToOptions(managedApps.status === 'Ready' ? managedApps.state : [])
          }),
        ])
      ])
    ]),
    managedApps.status === 'Loading' && customSpinnerOverlay({ height: '100vh', width: '100vw', position: 'absolute' })
  ])
}

const NoManagedApps = () => div({ key: 'message' }, ['No Terra Managed Applications exist for that subscription. ',
  h(Link, {
    href: 'https://portal.azure.com/#view/Microsoft_Azure_Marketplace/MarketplaceOffersBlade/selectedMenuItemId/home',
    ...Utils.newTabLinkProps
  }, ['Go to the Azure Marketplace']),
  ' to create a Terra Managed Application.'])
