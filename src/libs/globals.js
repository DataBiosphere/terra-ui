import * as Utils from 'src/libs/utils'


const globals = Utils.atom(JSON.parse(sessionStorage['globals'] || '{}'))
globals.subscribe(v => {
  if (!v) {
    sessionStorage.removeItem('globals')
  } else {
    sessionStorage['globals'] = JSON.stringify(v)
  }
})

export const usesGlobals = Utils.connectAtom(globals)

export const get = key => globals.get()[key]
export const set = (key, value) => globals.update(m => ({ ...m, [key]: value }))
