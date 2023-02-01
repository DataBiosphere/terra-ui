import { Fragment } from 'react'
import { h } from 'react-hyperscript-helpers'
import { Clickable } from 'src/components/common'
import { icon } from 'src/components/icons'
import { MenuButton } from 'src/components/MenuButton'
import { makeMenuIcon, MenuTrigger } from 'src/components/PopupTrigger'


const GroupMenu = ({
  groupName, isAdmin, iconSize, popupLocation,
  callbacks: { onDelete, onLeave }
}) => {
  const navIconProps = {
    style: { opacity: 0.65, marginRight: '1rem', height: iconSize },
    hover: { opacity: 1 }, focus: 'hover'
  }

  const menuContent = h(GroupMenuContent, { isAdmin, onLeave, onDelete })

  return h(MenuTrigger, {
    side: popupLocation,
    closeOnClick: true,
    content: menuContent
  }, [
    h(Clickable, {
      'aria-label': !!groupName ? `Action Menu for Group: ${groupName}` : 'Group Action Menu',
      'aria-haspopup': 'menu',
      ...navIconProps
    }, [icon('cardMenuIcon', { size: iconSize })])
  ])
}

const GroupMenuContent = ({ isAdmin, onLeave, onDelete }) => {
  return h(Fragment, [
    h(MenuButton, {
      onClick: onLeave
    }, [makeMenuIcon('arrowRight'), 'Leave']),
    h(MenuButton, {
      disabled: !isAdmin,
      tooltip: !isAdmin && 'You must be an admin of this group',
      tooltipSide: 'left',
      onClick: onDelete
    }, [makeMenuIcon('trash'), 'Delete'])
  ])
}

export default GroupMenu
