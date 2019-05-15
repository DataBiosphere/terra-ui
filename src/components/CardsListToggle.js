import { div, h } from 'react-hyperscript-helpers'
import { compose, mapProps } from 'recompose'
import { Clickable } from 'src/components/common'
import { icon } from 'src/components/icons'
import colors from 'src/libs/colors'
import * as Utils from 'src/libs/utils'


const viewToggleStyles = {
  toolbarContainer: {
    flex: 'none', display: 'flex'
  },
  toolbarButton: active => ({
    display: 'flex', justifyContent: 'center', alignItems: 'center',
    border: `1px solid ${colors.primary()}`,
    height: '2.25rem', padding: '0 .75rem',
    color: active ? 'white' : colors.primary(),
    backgroundColor: active ? colors.primary() : 'white'
  })
}

const viewToggleButtons = (listView, setListView) => {
  return div({ style: viewToggleStyles.toolbarContainer }, [
    h(Clickable, {
      style: {
        ...viewToggleStyles.toolbarButton(!listView),
        marginLeft: 'auto',
        borderRadius: '3px 0 0 3px'
      },
      onClick: () => setListView(false)
    }, [icon('view-cards', { size: 24, style: { margin: '.3rem' } })]),
    h(Clickable, {
      style: {
        ...viewToggleStyles.toolbarButton(listView),
        borderRadius: '0 3px 3px 0',
        borderLeft: 'none'
      },
      onClick: () => setListView(true)
    }, [icon('view-list', { size: 24, style: { margin: '.3rem' } })])
  ])
}


const toggleStateAtom = Utils.atom({})
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
