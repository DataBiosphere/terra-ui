import { Fragment } from 'react'
import { h } from 'react-hyperscript-helpers'
import { Clickable } from 'src/components/common'
import { icon } from 'src/components/icons'
import { makeMenuIcon, MenuButton, MenuTrigger } from 'src/components/PopupTrigger'
import * as Utils from 'src/libs/utils'


export const WorkspaceMenuTrigger = ({ iconSize, menuContent, popupLocation, workspaceName }) => {
  const navIconProps = {
    style: { opacity: 0.65, marginRight: '1rem' },
    hover: { opacity: 1 }, focus: 'hover'
  }

  return h(MenuTrigger, {
    side: popupLocation,
    closeOnClick: true,
    content: menuContent
  }, [
    h(Clickable, {
      'aria-label': !!workspaceName ? `Action Menu for Workspace: ${workspaceName}` : 'Workspace Action Menu',
      'aria-haspopup': 'menu',
      ...navIconProps
    }, [icon('cardMenuIcon', { size: iconSize })])
  ])
}

export const WorkspaceMenuContent = ({ canShare, isAzureWorkspace, isLocked, isOwner, onClone, onShare, onLock, onDelete, workspaceLoaded = true }) => {
  const shareTooltip = Utils.cond(
    [isAzureWorkspace, () => 'Sharing is not supported on Azure Workspaces'],
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
      tooltip: workspaceLoaded && isAzureWorkspace && 'Cloning is not supported on Azure Workspaces',
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
    }, [makeMenuIcon('trash'), 'Delete'])  // TODO: check if aria-label should be Workspace delete
  ])
}

