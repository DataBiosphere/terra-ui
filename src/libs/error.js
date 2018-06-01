import * as Utils from 'src/libs/utils'

export const errorStore = Utils.atom()

export const reportError = (title, error) => {
  errorStore.set({ title, error })
}

export const clearError = () => {
  errorStore.set(undefined)
}
