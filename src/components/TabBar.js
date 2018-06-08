import _ from 'lodash/fp'
import { h, div } from 'react-hyperscript-helpers'
import Interactive from 'react-interactive'
import * as Style from 'src/libs/style'

const TabBar = ({ tabs, activeTab, onChangeTab, style }) => {
  return div({
    style: {
      display: 'flex', alignItems: 'flex-end',
      borderBottom: `2px solid ${Style.colors.secondary}`,
      ...style
    }
  }, [
    ..._.map(([i, { title, key }]) => {
      return h(Interactive, {
        key,
        as: 'div',
        style: {
          height: '2.25rem', display: 'flex', alignItems: 'center',
          fontSize: 16, fontWeight: 500, color: Style.colors.secondary,
          borderBottom: `4px solid ${activeTab === key ? Style.colors.secondary : 'transparent'}`,
          marginLeft: i * 1 > 0 ? '1rem' : undefined
        },
        onClick: () => onChangeTab(key)
      }, [title])
    }, _.toPairs(tabs))
  ])
}

export default TabBar
