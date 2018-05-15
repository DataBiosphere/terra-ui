import _ from 'lodash'
import { Component as rComponent } from 'react'
import { h } from 'react-hyperscript-helpers'
import rSelect from 'react-select'
import 'react-select/dist/react-select.css'
import * as StateHistory from 'src/libs/state-history'
import * as Style from 'src/libs/style'


export class Component extends rComponent {
  constructor(props) {
    super(props)

    this.state = {}
  }
}

export class StateRestoreComponent extends Component {
  keysToSave = []

  setState(newState, callback) {
    super.setState(newState, () => {
      StateHistory.update(_.pick(this.state, this.keysToSave))
      console.log(StateHistory.get())
      callback && callback()
    })
  }
}

export const Select = props => h(rSelect, _.merge({ style: Style.elements.input }, props))
