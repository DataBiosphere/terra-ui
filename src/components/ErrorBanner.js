import _ from 'lodash/fp'
import { h } from 'react-hyperscript-helpers'
import TopBanner from 'src/components/TopBanner'
import { errorStore } from 'src/libs/error'
import * as Utils from 'src/libs/utils'


export default Utils.connectAtom(errorStore, 'errorState')(
  ({ errorState }) => {
    return h(TopBanner, {
      isVisible: !_.isEmpty(errorState),
      onDismiss: () => errorStore.set([])
    },
    _.map(_.identity, errorState))
  }
)
