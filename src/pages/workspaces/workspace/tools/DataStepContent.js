import _ from 'lodash/fp'
import { div, h, span } from 'react-hyperscript-helpers'
import { Clickable, RadioButton } from 'src/components/common'
import { icon } from 'src/components/icons'
import { ajaxCaller } from 'src/libs/ajax'
import colors from 'src/libs/colors'
import * as Style from 'src/libs/style'
import { Component } from 'src/libs/wrapped-components'
import DataSelector from 'src/pages/workspaces/workspace/tools/DataSelector'


const typeOption = ({ name, count, isSelected, selectSelf, unselect }) => div({
  key: name,
  style: {
    display: 'flex', alignItems: 'center',
    fontSize: 16,
    padding: '0.5rem',
    borderBottom: `1px solid ${colors.gray[4]}`
  }
}, [
  isSelected ?
    icon('check-circle', { size: 24, className: 'is-solid', style: { color: colors.blue[0], margin: '-2px 0' } }) :
    h(Clickable, { onClick: selectSelf }, [icon('circle', { size: 20, style: { marginRight: 4 } })]),
  icon('bullet-list', { style: { margin: '0 0.5rem' } }),
  span({ style: { flex: 1 } }, [name]),
  isSelected ?
    h(Clickable, { onClick: unselect }, [icon('times', { size: 24, style: { color: colors.blue[0], margin: '-2px' } })]) :
    `${count} row${count !== 1 ? 's' : ''}`
])


export default ajaxCaller(class DataStepContent extends Component {
  constructor(props) {
    super(props)

    this.state = { processAll: true }
  }

  render() {
    const { visible, entityMetadata, rootEntityType, setRootEntityType, workspaceId } = this.props
    const count = rootEntityType && entityMetadata[rootEntityType].count

    const { processAll } = this.state

    return div({
      style: {
        display: visible ? 'initial' : 'none'
      }
    }, [
      div({ style: { ...Style.elements.sectionHeader, marginBottom: '1rem' } }, ['Select index file to process']),
      div({ style: { maxWidth: 600 } }, [
        rootEntityType ?
          typeOption({
            name: rootEntityType, isSelected: true,
            unselect: () => setRootEntityType(undefined)
          }) :
          _.map(([name, { count }]) => typeOption({
            name, count,
            isSelected: false,
            selectSelf: () => setRootEntityType(name)
          }), _.toPairs(entityMetadata))
      ]),
      rootEntityType && count > 1 && div({
        style: {
          padding: '1rem 0.5rem', lineHeight: '1.5rem'
        }
      }, [
        div([
          h(RadioButton, {
            text: `Process all ${count} rows`,
            checked: processAll,
            onChange: () => this.setState({ processAll: true }),
            labelStyle: { marginLeft: '0.75rem' }
          })
        ]),
        div([
          h(RadioButton, {
            text: 'Choose specific rows to process',
            checked: !processAll,
            onChange: () => this.setState({ processAll: false }),
            labelStyle: { marginLeft: '0.75rem' }
          })
        ]),
        h(DataSelector, {
          style: { display: processAll ? 'none' : 'initial' },
          entityType: rootEntityType,
          entityMetadata, workspaceId
        })
      ])
    ])
  }
})
