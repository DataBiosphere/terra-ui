import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { act } from 'react-dom/test-utils'
import { h } from 'react-hyperscript-helpers'
import { Ajax } from 'src/libs/ajax'
import {
  AggregatedCategorySpendData, AggregatedWorkspaceSpendData,
  SpendReport,
  SpendReportServerResponse
} from 'src/pages/billing/SpendReport/SpendReport'
import { asMockedFn } from 'src/testing/test-utils'


type AjaxContract = ReturnType<typeof Ajax>
jest.mock('src/libs/ajax')

describe('SpendReport', () => {
  beforeEach(() => {
    jest.resetAllMocks()
    jest.useFakeTimers()
    // Note that month is 0-based. This is April 1st, 2022.
    jest.setSystemTime(new Date(Date.UTC(2022, 3, 1, 20, 17, 5, 0)))
  })

  afterAll(() => {
    jest.useRealTimers()
  })

  const select90Days = async () => {
    // Selecting the option by all the "usual" methods of supplying label text, selecting an option, etc. failed.
    // Perhaps this is because these options have both display text and a value?
    // Unfortunately this awkward approach was the only thing that appeared to work.
    const getDateRangeSelect = screen.getByLabelText('Date range')
    // 7 days
    fireEvent.keyDown(getDateRangeSelect, { key: 'ArrowDown', code: 'ArrowDown' })
    // 30 days
    fireEvent.keyDown(getDateRangeSelect, { key: 'ArrowDown', code: 'ArrowDown' })
    // 90 days
    fireEvent.keyDown(getDateRangeSelect, { key: 'ArrowDown', code: 'ArrowDown' })
    // Choose the current focused option.
    fireEvent.keyDown(getDateRangeSelect, { key: 'Enter', code: 'Enter' })

    await waitFor(() => {
      // Check that 90 days was actually selected. There will always be a DOM element present with
      // text "Last 90 days", but if it is the selected element (which means the option dropdown has closed),
      // it will have a class name ending in "singleValue". This is ugly, but the Select component we are
      // using does not set the value on the input element itself.
      expect(screen.getByText('Last 90 days').className).toContain('singleValue')
    })
  }

  const otherCostMessaging = /other infrastructure or query costs related to the general operations of Terra/i

  const createSpendReportResult = totalCost => {
    const categorySpendData: AggregatedCategorySpendData = {
      aggregationKey: 'Category',
      spendData: [
        { cost: '999', category: 'Compute', credits: '0.00', currency: 'USD' },
        { cost: '22', category: 'Storage', credits: '0.00', currency: 'USD' },
        { cost: '89', category: 'Other', credits: '0.00', currency: 'USD' }
      ]
    }

    const workspaceSpendData: AggregatedWorkspaceSpendData = {
      aggregationKey: 'Workspace',
      spendData: [
        {
          cost: '100', credits: '0.00', currency: 'USD', googleProjectId: 'googleProjectId',
          workspace: { name: 'Second Most Expensive Workspace', namespace: 'namespace' },
          subAggregation: {
            aggregationKey: 'Category',
            spendData: [
              { cost: '90', category: 'Compute', credits: '0.00', currency: 'USD' },
              { cost: '2', category: 'Storage', credits: '0.00', currency: 'USD' },
              { cost: '8', category: 'Other', credits: '0.00', currency: 'USD' }
            ]
          }
        },
        {
          cost: '1000', credits: '0.00', currency: 'USD', googleProjectId: 'googleProjectId',
          workspace: { name: 'Most Expensive Workspace', namespace: 'namespace' },
          subAggregation: {
            aggregationKey: 'Category',
            spendData: [
              { cost: '900', category: 'Compute', credits: '0.00', currency: 'USD' },
              { cost: '20', category: 'Storage', credits: '0.00', currency: 'USD' },
              { cost: '80', category: 'Other', credits: '0.00', currency: 'USD' }
            ]
          }
        },
        {
          cost: '10', credits: '0.00', currency: 'USD', googleProjectId: 'googleProjectId',
          workspace: { name: 'Third Most Expensive Workspace', namespace: 'namespace' },
          subAggregation: {
            aggregationKey: 'Category',
            spendData: [
              { cost: '9', category: 'Compute', credits: '0.00', currency: 'USD' },
              { cost: '0', category: 'Storage', credits: '0.00', currency: 'USD' },
              { cost: '1', category: 'Other', credits: '0.00', currency: 'USD' }
            ]
          }
        }
      ]
    }

    const mockServerResponse: SpendReportServerResponse = {
      spendSummary: {
        cost: totalCost, credits: '2.50', currency: 'USD', endTime: 'dummyTime', startTime: 'dummyTime'
      },
      spendDetails: [
        workspaceSpendData,
        categorySpendData
      ]
    }

    return mockServerResponse
  }

  it('does not call the server if view is not active', async () => {
    //Arrange
    const getSpendReport = jest.fn(() => Promise.resolve())
    asMockedFn(Ajax).mockImplementation(() => ({
      Billing: { getSpendReport } as Partial<AjaxContract['Billing']>
    } as Partial<AjaxContract> as AjaxContract))

    // Act
    await act(async () => {
      await render(h(SpendReport, { viewSelected: false, billingProjectName: 'thrifty', billingProjectCloudPlatform: 'GCP' }))
    })

    // Assert
    expect(getSpendReport).not.toHaveBeenCalled()
    expect(screen.queryByText(otherCostMessaging)).toBeNull()
  })

  it('displays cost information', async () => {
    //Arrange
    const getSpendReport = jest.fn()
    asMockedFn(Ajax).mockImplementation(() => ({
      Billing: { getSpendReport } as Partial<AjaxContract['Billing']>
    } as Partial<AjaxContract> as AjaxContract))
    getSpendReport.mockResolvedValue(createSpendReportResult('1110'))

    // Act
    await act(async () => {
      await render(h(SpendReport, { viewSelected: true, billingProjectName: 'thrifty' }))
    })

    // Assert
    await waitFor(() => {
      expect(screen.getByText(/\$89.00 in other infrastructure/i)).toBeInTheDocument()
    })
    expect(getSpendReport).toHaveBeenCalledTimes(1)
    expect(screen.getByTestId('spend')).toHaveTextContent('$1,110.00*')
    expect(screen.getByTestId('compute')).toHaveTextContent('$999.00')
    expect(screen.getByTestId('storage')).toHaveTextContent('$22.00')

    // Highcharts content is very minimal when rendered in the unit test. Testing of "most expensive workspaces"
    // is in the integration test. Accessibility is also tested in the integration test.
  })

  it('fetches reports based on selected date range, if active', async () => {
    //Arrange
    const getSpendReport = jest.fn()
    asMockedFn(Ajax).mockImplementation(() => ({
      Billing: { getSpendReport } as Partial<AjaxContract['Billing']>
    } as Partial<AjaxContract> as AjaxContract))
    getSpendReport.mockResolvedValueOnce(
      createSpendReportResult('1110')
    ).mockResolvedValue(
      createSpendReportResult('1110.17')
    )

    // Act
    await act(async () => {
      await render(h(SpendReport, { viewSelected: true, billingProjectName: 'thrifty', billingProjectCloudPlatform: 'GCP' }))
    })
    await select90Days()

    // Assert
    await waitFor(() => {
      expect(screen.getByText(otherCostMessaging)).toBeInTheDocument()
    })
    expect(screen.getByTestId('spend')).toHaveTextContent('$1,110.17*')
    expect(getSpendReport).toHaveBeenCalledTimes(2)
    expect(getSpendReport).toHaveBeenNthCalledWith(1, { billingProjectName: 'thrifty', endDate: '2022-04-01', startDate: '2022-03-02', aggregationKeys: ['Workspace~Category', 'Category'] })
    expect(getSpendReport).toHaveBeenNthCalledWith(2, { billingProjectName: 'thrifty', endDate: '2022-04-01', startDate: '2022-01-01', aggregationKeys: ['Workspace~Category', 'Category'] })
  })

  it('shows an error if no cost information exists', async () => {
    //Arrange
    let getSpendReport = jest.fn(() => Promise.reject(new Response(JSON.stringify({ message: 'No spend data for 30 days' }), { status: 404 })))
    asMockedFn(Ajax).mockImplementation(() => ({
      Billing: { getSpendReport } as Partial<AjaxContract['Billing']>
    } as Partial<AjaxContract> as AjaxContract))

    // Act
    await act(async () => {
      await render(h(SpendReport, { viewSelected: true, billingProjectName: 'thrifty', billingProjectCloudPlatform: 'GCP' }))
    })

    // Assert
    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('No spend data for 30 days')
    })

    // Arrange, switch error message to verify that the UI updates with the new message.
    getSpendReport = jest.fn(() => Promise.reject(new Response(JSON.stringify({ message: 'No spend data for 90 days' }), { status: 404 })))
    asMockedFn(Ajax).mockImplementation(() => ({
      Billing: { getSpendReport } as Partial<AjaxContract['Billing']>
    } as Partial<AjaxContract> as AjaxContract))

    // Act -- switch to 90 days and verify that the alert is updated
    await select90Days()

    // Assert
    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('No spend data for 90 days')
    })
  })
})

