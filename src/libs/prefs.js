import { getUser } from 'src/libs/auth'
import { getDynamic, setDynamic } from 'src/libs/browser-storage'


const withUserPrefix = key => `${getUser().id}/${key}`

export const getLocalPref = key => getDynamic(localStorage, withUserPrefix(key))
export const setLocalPref = (key, value) => setDynamic(localStorage, withUserPrefix(key), value)
