import _ from 'lodash/fp'
import { useMemo, useState } from 'react'
import { div, h } from 'react-hyperscript-helpers'
import { Link } from 'src/components/common'
import { icon } from 'src/components/icons'
import { useWorkspaces } from 'src/components/workspace-utils'
import { Ajax } from 'src/libs/ajax'
import { reportError } from 'src/libs/error'
import * as Nav from 'src/libs/nav'
import * as Utils from 'src/libs/utils'
import DeleteBillingProjectModal from 'src/pages/billing/DeleteBillingProjectModal'


interface BillingProjectActionsProps {
  projectName: string
  loadProjects: () => void
}

export const BillingProjectActions = (props: BillingProjectActionsProps) => {
  const [showDeleteProjectModal, setShowDeleteProjectModal] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const { workspaces, loading } = useWorkspaces()

  const hasWorkspaces = useMemo(() => _.filter(
    { namespace: props.projectName },
    _.map('workspace', workspaces)
  ), [props.projectName, workspaces]).length > 0

  return div({ style: { marginLeft: 'auto' } }, [h(Link, {
    disabled: loading || hasWorkspaces,
    tooltip: Utils.cond(
      [loading, () => 'Cannot delete billing project while workspaces are loading'],
      [hasWorkspaces, () => 'Cannot delete billing project because it contains workspaces'],
      () => `Delete billing project ${props.projectName}`
    ),
    style: { padding: '0.5rem' },
    onClick: () => setShowDeleteProjectModal(true),
  }, [icon('trash')]),

  showDeleteProjectModal && h(DeleteBillingProjectModal, {
    projectName: props.projectName, deleting,
    onDismiss: () => setShowDeleteProjectModal(false),
    onConfirm: async () => {
      setDeleting(true)
      try {
        await Ajax().Billing.deleteProject(props.projectName)
        setShowDeleteProjectModal(false)
        props.loadProjects()
        Nav.history.replace({ search: '' })
      } catch (err) {
        reportError('Error deleting billing project.', err)
        setShowDeleteProjectModal(false)
      }
      setDeleting(false)
    }
  })])
}
