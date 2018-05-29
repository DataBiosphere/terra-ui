import * as Utils from 'src/libs/utils'


export const waitOneTickAndUpdate = wrapper => {
  return Utils.waitOneTick().then(() => wrapper.update())
}
