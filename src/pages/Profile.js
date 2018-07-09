import { Fragment } from 'react'
import { div, h, img, path, svg } from 'react-hyperscript-helpers'
import { TopBar } from 'src/components/TopBar'
import * as auth from 'src/libs/auth'
import * as Nav from 'src/libs/nav'
import * as Style from 'src/libs/style'
import { Component } from 'src/libs/wrapped-components'


const styles = {
  page: {
    margin: '2rem 5rem',
    width: 700
  },
  profile: {
    line: {
      margin: '1rem 0',
      display: 'flex', alignItems: 'center'
    },
    pic: {
      borderRadius: '100%'
    },
    text: {
      container: {
        marginLeft: '2rem',
        color: Style.colors.title
      },
      nameLine: {
        fontSize: '150%'
      },
      percentageLine: {
        fontSize: '125%'
      }
    }
  }
}


const percentageCircle = ({ radius, fraction, color = Style.colors.success, strokeWidth = 6, style }) => {
  const halfStroke = strokeWidth/2
  const adjRadius = radius - halfStroke
  const diameter = 2 * radius
  const adjDiameter = 2 * adjRadius
  const circumference = adjDiameter * Math.PI

  const pathDesc =
    `M${radius} ${halfStroke} 
     a ${adjRadius} ${adjRadius} 0 0 1 0 ${adjDiameter} 
     a ${adjRadius} ${adjRadius} 0 0 1 0 -${adjDiameter}`

  return svg({ style: { width: diameter, height: diameter, ...style } }, [
    path({
      d: pathDesc,
      fill: 'none',
      stroke: '#d0d0d0',
      strokeWidth
    }),
    path({
      d: pathDesc,
      fill: 'none',
      stroke: color,
      strokeWidth,
      strokeDasharray: `${fraction * circumference}, ${circumference}`,
      strokeLinecap: 'round'
    })
  ])
}


class Profile extends Component {
  render() {
    const fraction = 0.5555555
    const profilePicRadius = 48
    const strokeRadius = 3
    const name = 'Person'

    return h(Fragment, [
      h(TopBar),
      div({ style: styles.page }, [
        div({ style: Style.elements.pageTitle }, ['Profile']),
        div({ style: styles.profile.line }, [
          div({ style: { position: 'relative', padding: strokeRadius } }, [
            img({ style: styles.profile.pic, src: auth.getBasicProfile().getImageUrl() }),
            percentageCircle({
              radius: profilePicRadius+strokeRadius, fraction, strokeWidth: 2*strokeRadius,
              style: { position: 'absolute', top: strokeRadius, left: strokeRadius, margin: -strokeRadius }
            })
          ]),
          div({ style: styles.profile.text.container }, [
            div({ style: styles.profile.text.nameLine }, [`Hello again, ${name}`]),
            div({ style: styles.profile.text.percentageLine }, [`Complete your profile. It's at ${(100*fraction)|0}%`])
          ])
        ])
      ])
    ])
  }
}


export const addNavPaths = () => {
  Nav.defPath('profile', {
    path: '/profile',
    component: Profile,
    title: 'Profile'
  })
}
