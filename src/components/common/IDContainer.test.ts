import { renderHook } from '@testing-library/react-hooks'

import { useUniqueIdFn } from './IdContainer'


type LodashExports = typeof import('lodash/fp')
jest.mock('lodash/fp', (): LodashExports => {
  const actual = jest.requireActual<LodashExports>('lodash/fp')

  let uniqueSeed = 123

  return ({
    ...actual,
    uniqueId: () => {
      const result = uniqueSeed
      uniqueSeed++
      return result.toString(10)
    }
  })
})

describe('useUniqueIdFn', () => {
  it('returns function to use for unique Id', () => {
    // Arrange
    const getMyId = renderHook(useUniqueIdFn).result.current
    const getMyId2 = renderHook(useUniqueIdFn).result.current

    // Act
    const buttonAId = getMyId('button-a')
    const buttonBId = getMyId('button-b')
    const otherId = getMyId2('other')

    // Assert
    // id can be reused within a component and will be same seed
    expect(buttonAId).toBe('button-a-123')
    expect(buttonBId).toBe('button-b-123')

    // but 2nd hook usage can give different seed if needed
    expect(otherId).toBe('other-124')
  })
})
