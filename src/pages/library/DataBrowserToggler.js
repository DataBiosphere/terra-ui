import { div, h, strong } from 'react-hyperscript-helpers'
import { Switch } from 'src/components/common'
import colors from 'src/libs/colors'
import { isDataBrowserVisible } from 'src/libs/config'
import * as Nav from 'src/libs/nav'
import { useStore } from 'src/libs/react-utils'
import { authStore } from 'src/libs/state'
import { catalogPreviewStore } from 'src/pages/library/dataBrowser-utils'


export const DataBrowserPreviewToggler = ({ checked }) => {
  const { user: { id } } = useStore(authStore)
  catalogPreviewStore.set({ [id]: checked })

  return !isDataBrowserVisible() ? div() : div({
    style: {
      background: colors.dark(0.1),
      padding: '10px 15px',
      margin: 15,
      border: '1px solid', borderColor: colors.accent(), borderRadius: 3,
      display: 'flex', flexDirection: 'row'
    }
  }, [
    div({ style: { display: 'flex', flexDirection: 'column' } }, [
      strong(['Toggle to preview the new Data Catalog']),
      div({ style: { display: 'flex', flexDirection: 'row', alignItems: 'center', marginTop: 6 } }, [
        h(Switch, {
          checked,
          onLabel: '', offLabel: '',
          width: 55, height: 25,
          onChange: () => {
            catalogPreviewStore.set({ [id]: !checked })
            if (checked) {
              Nav.goToPath('library-datasets')
            } else {
              Nav.goToPath('library-browser')
            }
          }
        }),
        strong({ style: { marginLeft: 10 } }, ['BETA Data Catalog ON'])
      ])
    ])
  ])
}

