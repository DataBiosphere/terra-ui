import '@testing-library/jest-dom'

import { fireEvent, getAllByTestId, getByText, render } from '@testing-library/react'
import _ from 'lodash/fp'
import { h } from 'react-hyperscript-helpers'
import Alerts from 'src/components/Alerts'
import { useServiceAlerts } from 'src/libs/service-alerts'
import * as Utils from 'src/libs/utils'


jest.mock('src/libs/service-alerts', () => {
  const originalModule = jest.requireActual('src/libs/service-alerts')
  return {
    ...originalModule,
    useServiceAlerts: jest.fn()
  }
})

beforeAll(() => {
  const modalRoot = document.createElement('div')
  modalRoot.id = 'modal-root'
  document.body.append(modalRoot)
})

afterAll(() => {
  document.getElementById('modal-root').remove()
})

const testAlerts = [
  {
    id: 'abc',
    title: 'The systems are down!',
    message: 'Something is terribly wrong'
  },
  {
    id: 'def',
    title: 'Scheduled maintenance',
    message: 'Offline tomorrow'
  }
]

describe('Alerts', () => {
  beforeEach(() => {
    useServiceAlerts.mockReturnValue(testAlerts)
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('renders number of alerts', () => {
    const { getByRole } = render(h(Alerts))
    expect(getByRole('button')).toHaveTextContent(`${testAlerts.length}`)
  })

  it('renders popup with alerts', () => {
    const { getByRole } = render(h(Alerts))
    fireEvent.click(getByRole('button'))

    const alerts = getAllByTestId(document.getElementById('modal-root'), 'alert')
    expect(alerts.length).toBe(testAlerts.length)

    _.forEach(([index, testAlert]) => {
      expect(getByText(alerts[index], testAlert.title)).toBeTruthy()
      expect(getByText(alerts[index], testAlert.message)).toBeTruthy()
    }, Utils.toIndexPairs(testAlerts))
  })

  it('renders alerts for screen readers', () => {
    const { getAllByRole } = render(h(Alerts))
    const screenReaderAlerts = getAllByRole('alert')

    expect(screenReaderAlerts.length).toBe(testAlerts.length)

    _.forEach(([index, testAlert]) => {
      expect(getByText(screenReaderAlerts[index], testAlert.title)).toBeTruthy()
      expect(getByText(screenReaderAlerts[index], testAlert.message)).toBeTruthy()

      expect(screenReaderAlerts[index]).toHaveClass('sr-only')
    }, Utils.toIndexPairs(testAlerts))
  })
})
