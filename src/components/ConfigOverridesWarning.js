import { div } from 'react-hyperscript-helpers'
import { linkButton } from 'src/components/common'
import colors from 'src/libs/colors'
import { ajaxOverridesStore, configOverridesStore } from 'src/libs/state'
import * as Utils from 'src/libs/utils'


const ConfigOverridesWarning = () => {
  const configOverrides = Utils.useAtom(configOverridesStore)
  const ajaxOverrides = Utils.useAtom(ajaxOverridesStore)
  return (!!configOverrides || !!ajaxOverrides) && div({
    style: {
      position: 'fixed', bottom: 0, right: 0,
      color: 'white', backgroundColor: colors.accent(),
      padding: '0.5rem'
    }
  }, [
    !!configOverrides && div([
      'Config overrides are in effect.',
      linkButton({ variant: 'light', onClick: () => configOverridesStore.set() }, [' clear'])
    ]),
    !!ajaxOverrides && div([
      'Ajax overrides are in effect.',
      linkButton({ variant: 'light', onClick: () => ajaxOverridesStore.set() }, [' clear'])
    ])
  ])
}

export default ConfigOverridesWarning
