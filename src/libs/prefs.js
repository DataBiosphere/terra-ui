import { getUser } from 'src/libs/auth'
import { getDynamic, setDynamic } from 'src/libs/browser-storage'


const withUserPrefix = key => `${getUser().id}/${key}`
const withUserPrefixForSpecifiedUserId = (userId, key) => `${userId}/${key}`

export const getLocalPref = key => getDynamic(localStorage, withUserPrefix(key))
// Needed for loading from localStorage on signin or signout event
export const getLocalPrefForUserId = (userId, key) => getDynamic(localStorage, withUserPrefixForSpecifiedUserId(userId, key))
export const setLocalPref = (key, value) => setDynamic(localStorage, withUserPrefix(key), value)
