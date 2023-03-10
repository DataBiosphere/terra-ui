import { fireEvent, render, screen } from '@testing-library/react'
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
    const getDateRangeSelect = () => screen.getByLabelText('Date range')
    // 7 days
    fireEvent.keyDown(getDateRangeSelect(), { key: 'ArrowDown', code: 'ArrowDown' })
    // 30 days
    fireEvent.keyDown(getDateRangeSelect(), { key: 'ArrowDown', code: 'ArrowDown' })
    // 90 days
    fireEvent.keyDown(getDateRangeSelect(), { key: 'ArrowDown', code: 'ArrowDown' })
    await act(async () => { // eslint-disable-line require-await
      // Trigger the option to be selected
      fireEvent.keyDown(getDateRangeSelect(), { key: 'Enter', code: 'Enter' })
    })
  }

  const otherCostMessaging = /other infrastructure or query costs related to the general operations of Terra/i

  const createSpendReportResult = totalCost => {
    const categorySpendData = {
      aggregationKey: 'Category',
      spendData: [
        { cost: '999', category: 'Compute' },
        { cost: '22', category: 'Storage' },
        { cost: '89', category: 'Other' }
      ]
    } as AggregatedCategorySpendData

    const workspaceSpendData = {
      aggregationKey: 'Workspace',
      spendData: [
        {
          cost: '100', workspace: { name: 'Second Most Expensive Workspace' },
          subAggregation: {
            aggregationKey: 'Category',
            spendData: [
              { cost: '90', category: 'Compute' },
              { cost: '2', category: 'Storage' },
              { cost: '8', category: 'Other' }
            ]
          }
        },
        {
          cost: '1000', workspace: { name: 'Most Expensive Workspace' },
          subAggregation: {
            aggregationKey: 'Category',
            spendData: [
              { cost: '900', category: 'Compute' },
              { cost: '20', category: 'Storage' },
              { cost: '80', category: 'Other' }
            ]
          }
        },
        {
          cost: '10', workspace: { name: 'Third Most Expensive Workspace' },
          subAggregation: {
            aggregationKey: 'Category',
            spendData: [
              { cost: '9', category: 'Compute' },
              { cost: '0', category: 'Storage' },
              { cost: '1', category: 'Other' }
            ]
          }
        }
      ]
    } as AggregatedWorkspaceSpendData

    const mockServerResponse = {
      spendSummary: {
        cost: totalCost, credits: '2.50', currency: 'USD', endTime: 'dummyTime', startTime: 'dummyTime'
      },
      spendDetails: [
        workspaceSpendData,
        categorySpendData
      ]
    } as SpendReportServerResponse

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
      await render(h(SpendReport, { viewSelected: false, billingProjectName: 'thrifty' }))
    })

    // Assert
    expect(getSpendReport).not.toHaveBeenCalled()
    expect(screen.queryByText(otherCostMessaging)).toBeNull()
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
      await render(h(SpendReport, { viewSelected: true, billingProjectName: 'thrifty' }))
    })
    await select90Days()

    // Assert
    expect(screen.getByTestId('spend').textContent).toBe('$1,110.17*')
    screen.getByText(otherCostMessaging)
    expect(getSpendReport).toHaveBeenCalledTimes(2)
    expect(getSpendReport).toHaveBeenNthCalledWith(1, { billingProjectName: 'thrifty', endDate: '2022-04-01', startDate: '2022-03-02' })
    expect(getSpendReport).toHaveBeenNthCalledWith(2, { billingProjectName: 'thrifty', endDate: '2022-04-01', startDate: '2022-01-01' })
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
    expect(getSpendReport).toHaveBeenCalledTimes(1)
    expect(screen.getByTestId('spend').textContent).toBe('$1,110.00*')
    expect(screen.getByTestId('compute').textContent).toBe('$999.00')
    expect(screen.getByTestId('storage').textContent).toBe('$22.00')
    screen.getByText(/\$89.00 in other infrastructure/i)

    // Highcharts content is very minimal when rendered in the unit test. Testing of "most expensive workspaces"
    // is in the integration test. Accessibility is also tested in the integration test.
  })

  it('shows an error if no cost information exists', async () => {
    //Arrange
    let getSpendReport = jest.fn(() => Promise.reject(new Response(JSON.stringify({ message: 'No spend data for 30 days' }), { status: 404 })))
    asMockedFn(Ajax).mockImplementation(() => ({
      Billing: { getSpendReport } as Partial<AjaxContract['Billing']>
    } as Partial<AjaxContract> as AjaxContract))

    // Act
    await act(async () => {
      await render(h(SpendReport, { viewSelected: true, billingProjectName: 'thrifty' }))
    })

    // Assert
    expect(screen.getByRole('alert').textContent).toEqual('No spend data for 30 days')

    // Arrange, switch error message to verify that the UI updates with the new message.
    getSpendReport = jest.fn(() => Promise.reject(new Response(JSON.stringify({ message: 'No spend data for 90 days' }), { status: 404 })))
    asMockedFn(Ajax).mockImplementation(() => ({
      Billing: { getSpendReport } as Partial<AjaxContract['Billing']>
    } as Partial<AjaxContract> as AjaxContract))

    // Act -- switch to 90 days and verify that the alert is updated
    await select90Days()

    // Assert
    expect(screen.getByRole('alert').textContent).toEqual('No spend data for 90 days')
  })
})

