import { Fragment } from 'react'
import { h, span } from 'react-hyperscript-helpers'
import { ButtonOutline } from 'src/components/common'
import { icon } from 'src/components/icons'
import { MenuButton } from 'src/components/MenuButton'
import { MenuTrigger } from 'src/components/PopupTrigger'
import { cloudProviders } from 'src/pages/workspaces/workspace/analysis/utils/runtime-utils'


export const CreateBillingProjectControl = ({ isAzurePreviewUser, showCreateProjectModal }) => {
  const createButton = (onClickCallback, type) => {
    return h(ButtonOutline, {
      'aria-label': 'Create new billing project',
      onClick: () => !!onClickCallback && onClickCallback(type)
    }, [span([icon('plus-circle', { style: { marginRight: '1ch' } }), 'Create'])])
  }

  if (!isAzurePreviewUser) {
    return createButton(showCreateProjectModal, cloudProviders.gcp)
  } else {
    return h(MenuTrigger, {
      side: 'bottom',
      closeOnClick: true,
      content: h(Fragment, [
        h(MenuButton, {
          'aria-haspopup': 'dialog',
          onClick: () => showCreateProjectModal(cloudProviders.azure)
        }, 'Azure Billing Project'),
        h(MenuButton, {
          'aria-haspopup': 'dialog',
          onClick: () => showCreateProjectModal(cloudProviders.gcp)
        }, 'GCP Billing Project')
      ])
    }, [createButton()])
  }
}
