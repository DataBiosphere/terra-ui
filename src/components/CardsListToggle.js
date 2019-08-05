import { div, h } from 'react-hyperscript-helpers'
import { compose, mapProps } from 'recompose'
import { Clickable } from 'src/components/common'
import { icon } from 'src/components/icons'
import colors from 'src/libs/colors'
import { toggleStateAtom } from 'src/libs/state'
import * as Utils from 'src/libs/utils'


const viewToggleStyles = {
  toolbarContainer: {
    flex: 'none', display: 'flex'
  },
  toolbarButton: active => ({
    display: 'flex', justifyContent: 'center', alignItems: 'center',
    borderRadius: 3, border: `1px solid ${colors.accent()}`,
    height: '2.25rem', padding: '0 .75rem',
    color: colors.accent(),
    backgroundColor: active ? colors.accent(0.2) : 'white'
  })
}

const viewToggleButtons = (listView, setListView) => {
  return div({ style: viewToggleStyles.toolbarContainer }, [
    h(Clickable, {
      style: { marginLeft: 'auto', ...viewToggleStyles.toolbarButton(!listView) },
      onClick: () => setListView(false),
      'aria-label': 'Card view'
    }, [icon('view-cards', { size: 24, style: { margin: '.3rem' } })]),
    h(Clickable, {
      style: { marginLeft: '1rem', ...viewToggleStyles.toolbarButton(listView) },
      onClick: () => setListView(true),
      'aria-label': 'List view'
    }, [icon('view-list', { size: 24, style: { margin: '.3rem' } })])
  ])
}


Utils.syncAtomToSessionStorage(toggleStateAtom, 'toggleState')


const togglesListView = key => {
  return compose(
    Utils.connectAtom(toggleStateAtom, 'toggleState'),
    mapProps(({ toggleState, ...props }) => {
      const listView = toggleState && toggleState[key]

      return {
        listView,
        viewToggleButtons: viewToggleButtons(listView, v => toggleStateAtom.update(m => ({ ...m, [key]: v }))),
        ...props
      }
    })
  )
}


export default togglesListView
