import _ from 'lodash/fp'
import { div, h } from 'react-hyperscript-helpers'
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

export const ViewToggleButtons = ({ listView, setListView }) => {
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

export const useViewToggle = key => {
  const toggleState = Utils.useAtom(toggleStateAtom)
  return [toggleState[key], v => toggleStateAtom.update(_.set(key, v))]
}

export const withViewToggle = key => WrappedComponent => {
  return Utils.withDisplayName('withViewToggle', props => {
    const [listView, setListView] = useViewToggle(key)
    return h(WrappedComponent, { ...props, listView, setListView })
  })
}
