import { Component } from 'react'
import { div, hh } from 'react-hyperscript-helpers/lib/index'


/**
 * @param container
 * @param children
 */
export default hh(class ShowOnClick extends Component {
  constructor(props) {
    super(props)
    this.state = {
      hidden: true
    }
  }

  render() {
    const { hidden } = this.state
    const { container, style, children } = this.props

    return div({
        style,
        onClick: (e) => {
          this.setState({ hidden: false })
          e.preventDefault()
        }
      },
      [
        container,
        hidden ? null :
          div({
            style: {
              position: 'fixed', left: 0, right: 0, top: 0, bottom: 0, cursor: 'pointer'
            },
            onClick: (e) => {
              this.setState({ hidden: true })
              e.preventDefault()
              e.stopPropagation()
            }
          }),
        hidden ? null : children
      ])
  }
})
