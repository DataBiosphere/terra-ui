export const waitOneTick = () => new Promise(setImmediate)

export const waitOneTickAndUpdate = (wrapper) => {
  return waitOneTick().then(() => wrapper.update())
}
