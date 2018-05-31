import * as Utils from 'src/libs/utils'

export const errorStore = Utils.atom()

export const reportError = text => {
  errorStore.set(text)
}
