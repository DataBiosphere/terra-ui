import * as Utils from 'src/libs/utils'


export const waitOneTickAndUpdate = wrapper => {
  return Utils.waitOneTick().then(() => wrapper.update())
}

export const asMockedFn = <T extends (...args: any[]) => any>(
    fn: T
): jest.MockedFunction<T> => {
  return fn as jest.MockedFunction<T>;
}

export const flushPromises = (delay: number = 0): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, delay))
}
