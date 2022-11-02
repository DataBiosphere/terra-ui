import 'blob-polyfill'

import { toHaveNoViolations } from 'jest-axe'


jest.mock('src/configStore', () => ({
  loadedConfigStore: { current: { jest: true } }
}))

expect.extend(toHaveNoViolations)

beforeAll(() => {
  const modalRoot = document.createElement('div')
  modalRoot.id = 'modal-root'
  document.body.append(modalRoot)
})

afterAll(() => {
  document.getElementById('modal-root').remove()
})
