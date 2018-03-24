import mixinDeep from 'mixin-deep'
import { Component } from 'react'
import { div, hh } from 'react-hyperscript-helpers/lib/index'


/**
 * @param [containerProps]
 * @param button
 * @param [bgProps]
 * @param [closeOnClick=true]
 * @param [closeOnEsc=true]
 * @param children
 */
export default hh(class ShowOnClick extends Component {
  constructor(props) {
    super(props)
    this.state = {
      hidden: true
    }
  }

  setVisibility = (visible) => {
    this.setState({ hidden: !visible })
  }

  listenForEscape = (e) => {
    if (e.key === 'Escape') {
      window.removeEventListener('keydown', this.listenForEscape)
      this.setState({ hidden: true })
    }
  }

  render() {
    const { hidden } = this.state
    const { containerProps, button, bgProps, closeOnClick = true, closeOnEsc = true, children } = this.props

    return div(mixinDeep({
        onClick: (e) => {
          this.setState({ hidden: false })
          e.preventDefault()
          if (closeOnEsc) {
            window.addEventListener('keydown', this.listenForEscape)
          }
        }
      }, containerProps),
      [
        button,
        hidden ? null :
          div(mixinDeep({
            style: {
              position: 'fixed', left: 0, right: 0, top: 0, bottom: 0, cursor: 'pointer'
            },
            onClick: closeOnClick ? (e) => {
              this.setState({ hidden: true })
              e.preventDefault()
              e.stopPropagation()
            } : undefined
          }, bgProps)),
        hidden ? null : children
      ]
    )
  }
})
