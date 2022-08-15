import { Fragment } from 'react'
import { h } from 'react-hyperscript-helpers'
import { Clickable } from 'src/components/common'
import { icon } from 'src/components/icons'
import { makeMenuIcon, MenuButton, MenuTrigger } from 'src/components/PopupTrigger'
import { useWorkspaceDetails } from 'src/components/workspace-utils'
import * as Utils from 'src/libs/utils'


// In `workspaceInfo`, specify either `name and namespace` to fetch the Workspace details,
// or `canShare, isAzureWorkspace, isLocked, and isOwner` to use previously fetched details.
const WorkspaceMenu = ({
  iconSize, popupLocation,
  callbacks: { onClone, onShare, onLock, onDelete },
  workspaceInfo: { name, namespace, canShare, isAzureWorkspace, isLocked, isOwner }
}) => {
  const navIconProps = {
    style: { opacity: 0.65, marginRight: '1rem', height: iconSize },
    hover: { opacity: 1 }, focus: 'hover'
  }

  const menuContent = !!namespace ?
    h(DynamicWorkspaceMenuContent, { namespace, name, onShare, onClone, onDelete, onLock }) :
    h(WorkspaceMenuContent, { canShare, isAzureWorkspace, isLocked, isOwner, onClone, onShare, onLock, onDelete })

  return h(MenuTrigger, {
    side: popupLocation,
    closeOnClick: true,
    content: menuContent
  }, [
    h(Clickable, {
      'aria-label': !!name ? `Action Menu for Workspace: ${name}` : 'Workspace Action Menu',
      'aria-haspopup': 'menu',
      ...navIconProps
    }, [icon('cardMenuIcon', { size: iconSize })])
  ])
}

const DynamicWorkspaceMenuContent = ({ namespace, name, onClone, onShare, onDelete, onLock }) => {
  const { workspace } = useWorkspaceDetails({ namespace, name }, ['accessLevel', 'azureContext', 'canShare', 'workspace.isLocked'])
  const canShare = workspace?.canShare
  const isOwner = workspace && Utils.isOwner(workspace.accessLevel)
  const isLocked = workspace?.workspace.isLocked
  const isAzureWorkspace = !!workspace?.azureContext
  return WorkspaceMenuContent({
    canShare, isAzureWorkspace, isLocked, isOwner, onClone, onShare, onLock, onDelete, workspaceLoaded: !!workspace
  })
}

const WorkspaceMenuContent = ({ canShare, isAzureWorkspace, isLocked, isOwner, onClone, onShare, onLock, onDelete, workspaceLoaded = true }) => {
  const shareTooltip = Utils.cond(
    [isAzureWorkspace, () => 'Sharing is not currently supported on Azure Workspaces'],
    [workspaceLoaded && !canShare, () => 'You have not been granted permission to share this workspace'],
    [Utils.DEFAULT, () => '']
  )
  const deleteTooltip = Utils.cond(
    [workspaceLoaded && isLocked, () => 'You cannot delete a locked workspace'],
    [workspaceLoaded && !isOwner, () => 'You must be an owner of this workspace or the underlying billing project'],
    [Utils.DEFAULT, () => '']
  )

  return h(Fragment, [
    h(MenuButton, {
      disabled: isAzureWorkspace,
      tooltip: workspaceLoaded && isAzureWorkspace && 'Cloning is not currently supported on Azure Workspaces',
      tooltipSide: 'left',
      onClick: onClone
    }, [makeMenuIcon('copy'), 'Clone']),
    h(MenuButton, {
      disabled: !canShare || isAzureWorkspace,
      tooltip: shareTooltip,
      tooltipSide: 'left',
      onClick: onShare
    }, [makeMenuIcon('share'), 'Share']),
    h(MenuButton, {
      disabled: !isOwner,
      tooltip: workspaceLoaded && !isOwner && ['You have not been granted permission to ', isLocked ? 'unlock' : 'lock', ' this workspace'],
      tooltipSide: 'left',
      onClick: onLock
    }, isLocked ? [makeMenuIcon('unlock'), 'Unlock'] : [makeMenuIcon('lock'), 'Lock']),
    h(MenuButton, {
      disabled: !isOwner || isLocked,
      tooltip: deleteTooltip,
      tooltipSide: 'left',
      onClick: onDelete
    }, [makeMenuIcon('trash'), 'Delete'])
  ])
}

export default WorkspaceMenu
