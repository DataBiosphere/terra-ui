import _ from 'lodash/fp'
import { div, span } from 'react-hyperscript-helpers'
import { icon } from 'src/components/icons'
import * as Style from 'src/libs/style'
import { Component } from 'src/libs/wrapped-components'


/**
 * @param [boolean] defaultHidden
 * @param title
 * @param children
 */
export default class Collapse extends Component {
  constructor(props) {
    super(props)
    this.state = { visible: !props.defaultHidden }
  }

  render() {
    const { title } = this.props
    const { visible } = this.state

    return div(_.omit(['defaultHidden', 'title', 'titleExpand'], this.props), [
      div({ style: { marginBottom: '0.5rem' } }, [
        div(
          {
            style: { display: 'flex', cursor: 'pointer', alignItems: 'center' },
            onClick: () => this.setState({ visible: !visible })
          },
          [
            span({ style: { color: Style.colors.secondary } }, title),
            icon(visible ? 'angle down' : 'angle left', { style: { marginLeft: '0.25rem' } })
          ])
      ]),
      div({ style: { display: visible ? 'initial' : 'none' } },
        [this.props.children])
    ])
  }
}
