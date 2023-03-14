import { Fragment } from 'react'
import { h, span } from 'react-hyperscript-helpers'
import { ButtonOutline } from 'src/components/common'
import { icon } from 'src/components/icons'
import { MenuButton } from 'src/components/MenuButton'
import { MenuTrigger } from 'src/components/PopupTrigger'
import { CloudProvider } from 'src/libs/workspace-utils'
import { cloudProviders } from 'src/pages/workspaces/workspace/analysis/utils/runtime-utils'


interface CreateBillingProjectControlProps {
  isAzurePreviewUser: boolean
  showCreateProjectModal: (type: { label: CloudProvider }) => void
}

export const CreateBillingProjectControl = (props: CreateBillingProjectControlProps) => {
  const createButton = (type: { label: CloudProvider } | undefined) => {
    return h(ButtonOutline, {
      'aria-label': 'Create new billing project',
      onClick: () => type !== undefined ? props.showCreateProjectModal(type) : undefined
    }, [span([icon('plus-circle', { style: { marginRight: '1ch' } }), 'Create'])])
  }

  if (!props.isAzurePreviewUser) {
    return createButton(cloudProviders.gcp)
  } else {
    return h(MenuTrigger, {
      side: 'bottom',
      closeOnClick: true,
      content: h(Fragment, [
        h(MenuButton, {
          'aria-haspopup': 'dialog',
          onClick: () => props.showCreateProjectModal(cloudProviders.azure)
        }, ['Azure Billing Project']),
        h(MenuButton, {
          'aria-haspopup': 'dialog',
          onClick: () => props.showCreateProjectModal(cloudProviders.gcp)
        }, ['GCP Billing Project'])
      ])
    }, [createButton(undefined)])
  }
}
