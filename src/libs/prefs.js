import { getDynamic, getLocalStorage, setDynamic } from 'src/libs/browser-storage'
import { getUser } from 'src/libs/state'


const withUserPrefix = key => `${getUser().id}/${key}`
const withUserPrefixForSpecifiedUserId = (userId, key) => `${userId}/${key}`

export const getLocalPref = key => getDynamic(getLocalStorage(), withUserPrefix(key))
// Needed for loading from localStorage on signin or signout event
export const getLocalPrefForUserId = (userId, key) => getDynamic(getLocalStorage(), withUserPrefixForSpecifiedUserId(userId, key))
export const setLocalPref = (key, value) => setDynamic(getLocalStorage(), withUserPrefix(key), value)
