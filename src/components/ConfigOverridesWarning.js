import { div, pre } from 'react-hyperscript-helpers'
import { configOverridesStore } from 'src/libs/config'
import colors from 'src/libs/colors'
import * as Utils from 'src/libs/utils'

const ConfigOverridesWarning = () => {
  const configOverrides = Utils.useAtom(configOverridesStore)
  return !!configOverrides && div({
    style: {
      position: 'fixed', bottom: 0, right: 0,
      color: 'white', backgroundColor: colors.purple[0],
      padding: '1rem'
    }
  }, [
    'Warning! Config overrides are in effect:',
    pre(JSON.stringify(configOverrides, null, 2))
  ])
}

export default ConfigOverridesWarning
