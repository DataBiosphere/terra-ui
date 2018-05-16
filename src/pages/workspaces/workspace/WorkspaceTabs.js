import _ from 'lodash'
import { Fragment } from 'react'
import { a, div, h } from 'react-hyperscript-helpers/lib/index'
import Interactive from 'react-interactive'
import { contextBar, contextMenu } from 'src/components/common'
import { icon } from 'src/components/icons'
import ShowOnClick from 'src/components/ShowOnClick'
import * as Style from 'src/libs/style'
import * as Nav from 'src/libs/nav'


const navSeparator = div({
  style: { background: 'rgba(255,255,255,0.15)', width: 1, height: '3rem', flexShrink: 0 }
})

const tabBaseStyle = {
  maxWidth: 140, flexGrow: 1, color: Style.colors.textFadedLight, textDecoration: 'none',
  alignSelf: 'stretch', display: 'flex', justifyContent: 'center', alignItems: 'center'
}

const tabActiveStyle = _.defaults({
  backgroundColor: 'rgba(255,255,255,0.15)', color: 'unset',
  borderBottom: `4px solid ${Style.colors.secondary}`
}, tabBaseStyle)

const navTab = (tabName, { namespace, name, activeTab }) => {
  return h(Fragment, [
    a({
      style: tabName === activeTab ? tabActiveStyle : tabBaseStyle,
      href: Nav.getLink('workspace', {
        namespace, name, activeTab: tabName === 'dashboard' ? null : tabName
      })
    }, tabName),
    navSeparator
  ])
}

const navIconProps = {
  size: 22,
  style: { opacity: 0.65, marginRight: '1rem' },
  hover: { opacity: 1 }, focus: 'hover'
}


export const tabBar = props => contextBar(
  {
    style: {
      paddingLeft: '5rem', borderBottom: `5px solid ${Style.colors.secondary}`,
      textAlign: 'center', color: 'white', lineHeight: '3.75rem', textTransform: 'uppercase'
    }
  },
  [
    navSeparator,
    navTab('dashboard', props), navTab('notebooks', props), navTab('data', props), navTab('jobs', props),
    navTab('history', props), navTab('tools', props),
    div({ style: { flexGrow: 1 } }),
    h(Interactive,
      _.merge({ as: icon('copy') }, navIconProps)),
    h(ShowOnClick, {
      button: h(Interactive,
        _.merge({ as: icon('ellipsis-vertical') }, navIconProps))
    },
    [
      div({
        style: {
          position: 'absolute', right: 0, lineHeight: 'initial', textAlign: 'initial',
          color: 'initial', textTransform: 'initial', fontWeight: 300
        }
      }, [
        contextMenu([
          [{}, 'Share'],
          [{}, 'Publish'],
          [{}, 'Delete']
        ])
      ])
    ])
  ]
)
