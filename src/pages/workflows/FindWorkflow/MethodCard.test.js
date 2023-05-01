import '@testing-library/jest-dom'

import { render, screen } from '@testing-library/react'
import { h } from 'react-hyperscript-helpers'
import { MethodCard } from 'src/pages/workflows/FindWorkflow/MethodCard'


describe('MethodCard', () => {
  it('should render Method card as expected', () => {
    // ** ARRANGE **
    const method = {
      method_name: 'mock_method_1',
      method_description: 'mock_method_1 description. Lorem ipsum dolor sit amet',
      method_source: 'GitHub',
      method_version: 'master',
      method_url: 'https://raw.githubusercontent.com/broadinstitute/mock_method_1.wdl'
    }

    // ** ACT **
    render(h(MethodCard, { method, onClick: () => jest.fn() }))

    // ** ASSERT **
    expect(screen.getByText('mock_method_1')).toBeInTheDocument()
    expect(screen.getByText('mock_method_1 description. Lorem ipsum dolor sit amet')).toBeInTheDocument()
    expect(screen.getByText('WDL')).toBeInTheDocument()
  })
})
