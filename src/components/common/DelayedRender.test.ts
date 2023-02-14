import { act, render, screen } from '@testing-library/react'
import { div, h } from 'react-hyperscript-helpers'

import { DelayedRender } from './DelayedRender'


describe('DelayedRender', () => {
  it('renders children after a delay', () => {
    // Arrange
    jest.useFakeTimers()

    // Act
    render(h(DelayedRender, { delay: 3000 }, [
      div(['Hello world'])
    ]))

    // Assert
    expect(screen.queryByText('Hello world')).toBeNull()

    act(() => { jest.advanceTimersByTime(1000) })
    expect(screen.queryByText('Hello world')).toBeNull()

    act(() => { jest.advanceTimersByTime(2000) })
    screen.queryByText('Hello world')
  })
})
