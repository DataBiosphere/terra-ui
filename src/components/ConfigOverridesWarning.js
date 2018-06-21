import { div, pre } from 'react-hyperscript-helpers'
import { configOverridesStore } from 'src/libs/config'
import * as Style from 'src/libs/style'
import * as Utils from 'src/libs/utils'

const ConfigOverridesWarning = Utils.connectAtom(configOverridesStore, 'configOverrides')(
  ({ configOverrides }) => {
    return !!configOverrides && div({
      style: {
        position: 'fixed', bottom: 0, right: 0,
        color: 'white', backgroundColor: Style.colors.accent,
        padding: '1rem'
      }
    }, [
      'Warning! Config overrides are in effect:',
      pre(JSON.stringify(configOverrides, null, 2))
    ])
  }
)

export default ConfigOverridesWarning
