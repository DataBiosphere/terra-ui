import { compose, mapProps } from 'recompose'
import { div, h } from 'react-hyperscript-helpers'
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
    borderRadius: 3, border: `1px solid ${colors.green[0]}`,
    height: '2.25rem', padding: '0 .75rem',
    color: colors.green[0],
    backgroundColor: active ? colors.green[6] : 'white'
  })
}

const viewToggleButtons = (listView, setListView) => {
  return div({ style: viewToggleStyles.toolbarContainer }, [
    h(Clickable, {
      style: { marginLeft: 'auto', ...viewToggleStyles.toolbarButton(!listView) },
      onClick: () => setListView(false)
    }, [icon('view-cards', { size: 24, style: { margin: '.3rem' } })]),
    h(Clickable, {
      style: { marginLeft: '1rem', ...viewToggleStyles.toolbarButton(listView) },
      onClick: () => setListView(true)
    }, [icon('view-list', { size: 24, style: { margin: '.3rem' } })])
  ])
}


const toggleStateAtom = Utils.atom(JSON.parse(sessionStorage['toggleState'] || '{}'))
toggleStateAtom.subscribe(v => {
  if (!v) {
    sessionStorage.removeItem('toggleState')
  } else {
    sessionStorage['toggleState'] = JSON.stringify(v)
  }
})


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
