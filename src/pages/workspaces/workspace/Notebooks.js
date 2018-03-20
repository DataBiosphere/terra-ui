import _ from 'lodash'
import { Component } from 'react'
import { div, hh } from 'react-hyperscript-helpers/lib/index'
import * as Ajax from 'src/libs/ajax'
import { spinner } from 'src/components/icons'
import * as Style from 'src/libs/style'


export default hh(class WorkspaceNotebooks extends Component {
  constructor(props) {
    super(props)
    this.state = {
      clusters: [],
      selectedCluster: '',
      selectedClusterNotebooks: []
    }
  }


  componentWillMount() {
    Ajax.leo('api/clusters').then(json =>
      this.setState({ clusters: json })
    )
  }


  render() {
    const { clusters } = this.state

    return _.isEmpty(clusters) ? spinner({ style: { marginTop: '1rem' } }) :
      div({ style: { margin: '1rem' } }, [
        div({ style: { fontSize: 16, fontWeight: 500, color: Style.colors.title } },
          'CLUSTERS'),
        div({style:{whiteSpace:'pre'}}, JSON.stringify(clusters, null, 2))
      ])
  }
})
