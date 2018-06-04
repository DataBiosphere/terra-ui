import _ from 'lodash/fp'
import * as Utils from 'src/libs/utils'


export const errorStore = Utils.atom([])

export const reportError = text => {
  errorStore.update(old => _.concat(old, text))
}
