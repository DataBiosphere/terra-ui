import PropTypes from 'prop-types'
import { div, h } from 'react-hyperscript-helpers'
import { Clickable } from 'src/components/common'
import { icon } from 'src/components/icons'
import colors from 'src/libs/colors'
import * as Style from 'src/libs/style'
import { Component } from 'src/libs/wrapped-components'


export default class FloatingActionButton extends Component {
  static propTypes = {
    label: PropTypes.string.isRequired,
    iconShape: PropTypes.string.isRequired,
    onClick: PropTypes.func.isRequired,
    bottom: PropTypes.number,
    right: PropTypes.number
  }

  render() {
    const { label, iconShape, onClick, bottom, right } = this.props
    const { hover } = this.state

    return h(Clickable,
      {
        style: {
          position: 'absolute', bottom: bottom, right: right,
          backgroundColor: colors.blue[0], color: 'white',
          padding: '0.5rem', borderRadius: 40,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: Style.standardShadow
        },
        onMouseEnter: () => this.setState({ hover: true }),
        onMouseLeave: () => this.setState({ hover: false }),
        onClick: () => {
          onClick()
          this.setState({ hover: false })
        }
      },
      [
        div({
          style: {
            padding: `0 ${hover ? '0.5rem' : '0'}`, fontWeight: 'bold',
            maxWidth: hover ? 200 : 0,
            overflow: 'hidden', whiteSpace: 'pre',
            transition: 'max-width 0.5s ease-out, padding 0.1s linear 0.2s'
          }
        }, label),
        icon(iconShape, { size: 25, style: { stroke: 'white', strokeWidth: 0.25 } })
      ])
  }
}
