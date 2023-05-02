import { a, div, h3 } from 'react-hyperscript-helpers'
import headerLeftHexes from 'src/images/header-left-hexes.svg'
import headerRightHexes from 'src/images/header-right-hexes.svg'
import colors, { terraSpecial } from 'src/libs/colors'
import { topBarLogo } from 'src/libs/logos'
import * as Style from 'src/libs/style'


const styles = {
  button: {
    display: 'inline-flex', justifyContent: 'space-around', alignItems: 'center', height: '2.25rem',
    fontWeight: 500, fontSize: 14, textTransform: 'uppercase', whiteSpace: 'nowrap',
    userSelect: 'none'
  },
  tabBar: {
    container: {
      display: 'flex', alignItems: 'center',
      fontWeight: 400, textTransform: 'uppercase',
      height: '2.25rem',
      borderBottom: `1px solid ${terraSpecial()}`, flex: ''
    },
    tab: {
      flex: 'none', padding: '0 1em', height: '100%',
      alignSelf: 'stretch', display: 'flex', justifyContent: 'center', alignItems: 'center',
      borderBottomWidth: 8, borderBottomStyle: 'solid', borderBottomColor: 'transparent'
    },
    active: {
      borderBottomColor: terraSpecial(),
      fontWeight: 600
    }
  },
  topBar: {
    flex: 'none', height: Style.topBarHeight,
    display: 'flex', alignItems: 'center',
    borderBottom: `2px solid ${colors.primary(0.55)}`,
    zIndex: 2,
    boxShadow: '3px 0 13px 0 rgba(0,0,0,0.3)'
  },
  image: {
    verticalAlign: 'middle',
    height: 30
  },
  pageTitle: {
    color: 'white'
  }
}

export const Navbar = title => {
  return div({
    role: 'banner',
    style: { flex: 'none', display: 'flex', flexFlow: 'column nowrap' }
  }, [
    div({
      style: {
        ...styles.topBar,
        backgroundColor: colors.primary(1.47)
      }
    }, [
      div({
        style: {
          background: `0px url(${headerLeftHexes}) no-repeat, right url(${headerRightHexes}) no-repeat`,
          flex: '1 1 auto', display: 'flex', alignSelf: 'stretch', width: '100%', alignItems: 'center'
        }
      }, [
        a({
          style: { ...styles.pageTitle, display: 'flex', alignItems: 'center' },
          href: '#'
        }, [
          topBarLogo(),
          div({ style: { display: 'flex', alignItems: 'center', marginLeft: '1rem' } }, [
            h3({
              style: { color: 'white', fontWeight: 600, padding: '0px', marginLeft: '0.5rem' }
            }, [title])
          ])
        ])
      ])
    ])
  ])
}
