import { loadedConfigStore } from 'src/configStore'
import * as Utils from 'src/libs/utils'


jest.mock('src/configStore', () => ({
  loadedConfigStore: { current: { jest: true } }
}))
jest.mock('src/libs/ajax')
jest.mock('src/libs/auth')
jest.mock('src/libs/nav')
jest.mock('src/libs/state-history')

window.gapi = {
  load: () => {}
}
window.Element.prototype['insertAdjacentElement'] = () => {} // for custom icons

window.sessionStorage = {}

// Mock dates due to time zone issues
jest.spyOn(Utils, 'makePrettyDate').mockImplementation(() => '***MOCKED DATE***')

/* Disabled until there's a version of Enzyme that works with the current React version
ReactWrapper.prototype.testId = function(id) {
  const wrapper = this.find(`[data-test-id='${id}']`)
  const length = wrapper.length

  console.assert(length === 1, `data-test-id '${id}' found ${length} times`)

  return wrapper
}

ReactWrapper.prototype.findIcon = function(shape) {
  return this.find(`[shape="${shape}"]`)
}

ReactWrapper.prototype.click = function() {
  return this.simulate('click')
}
*/
