import { Fragment, useState } from 'react'
import { h } from 'react-hyperscript-helpers'
import { Link } from 'src/components/common'
import { icon } from 'src/components/icons'
import { MenuButton } from 'src/components/MenuButton'
import { MenuTrigger } from 'src/components/PopupTrigger'
import { Ajax } from 'src/libs/ajax'
import { reportError } from 'src/libs/error'
import DeleteBillingProjectModal from 'src/pages/billing/DeleteBillingProjectModal'


interface BillingProjectActionsProps {
  projectName: string
  loadProjects: () => void
}

export const BillingProjectActions = (props: BillingProjectActionsProps) => {
  const [showDeleteProjectModal, setShowDeleteProjectModal] = useState(false)
  const [deleting, setDeleting] = useState(false)

  // @ts-ignore
  return h(Fragment, [
    h(MenuTrigger, {
      closeOnClick: true,
      side: 'right',
      style: { marginRight: '0.5rem' },
      content: h(Fragment, [
        h(MenuButton, {
          onClick: () => setShowDeleteProjectModal(true)
        }, ['Delete Billing Project'])
      ])
    }, [
      h(Link, { 'aria-label': 'Billing project menu', style: { display: 'flex', alignItems: 'center' } }, [
        // @ts-ignore
        icon('cardMenuIcon', { size: 16, 'aria-haspopup': 'menu' })
      ])
    ]),
    showDeleteProjectModal && h(DeleteBillingProjectModal, {
      projectName: props.projectName, deleting,
      onDismiss: () => setShowDeleteProjectModal(false),
      onConfirm: async () => {
        setDeleting(true)
        try {
          await Ajax().Billing.deleteProject(props.projectName)
          setShowDeleteProjectModal(false)
          props.loadProjects()
        } catch (err) {
          reportError('Error deleting billing project.', err)
          setShowDeleteProjectModal(false)
        }
        setDeleting(false)
      }
    })
  ])
}
