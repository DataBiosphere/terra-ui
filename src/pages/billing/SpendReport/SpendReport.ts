import { subDays } from 'date-fns/fp'
import _ from 'lodash/fp'
import { Fragment, lazy, Suspense, useEffect, useState } from 'react'
import { div, h, span } from 'react-hyperscript-helpers'
import {
  customSpinnerOverlay,
  IdContainer,
  Select
} from 'src/components/common'
import { Ajax } from 'src/libs/ajax'
import { FormLabel } from 'src/libs/forms'
import { useCancellation } from 'src/libs/react-utils'
import { CloudPlatform } from 'src/pages/billing/models/BillingProject'
import { CostCard } from 'src/pages/billing/SpendReport/CostCard'
import { ErrorAlert } from 'src/pages/billing/SpendReport/ErrorAlert'


const LazyChart = lazy(() => import('src/components/Chart'))
const maxWorkspacesInChart = 10

const OtherMessaging = ({ cost }) => {
  const msg = cost !== null ?
    `Total spend includes ${cost} in other infrastructure or query costs related to the general operations of Terra.` :
    'Total spend includes infrastructure or query costs related to the general operations of Terra'
  return div({ 'aria-live': cost !== null ? 'polite' : 'off', 'aria-atomic': true }, [
    span({ 'aria-hidden': true }, ['*']),
    '',
    msg
  ])
}

// Interfaces for internal storage of data
interface WorkspaceCosts {
  workspaceNames: string[]
  computeCosts: number[]
  storageCosts: number[]
  otherCosts: number[]
  numWorkspaces: number
  costFormatter: any
}

interface ProjectCost {
  spend: string
  compute: string
  storage: string
  other: string
}
// End of interfaces for internal storage of data

// Interfaces for dealing with the server SpendReport JSON response
interface CategorySpendData {
  category: 'Compute' | 'Storage' | 'Other'
  cost: string
  credits: string
  currency: string
}

interface WorkspaceSpendData {
  cost: string
  credits: string
  currency: string
  googleProjectId: string
  subAggregation: { aggregationKey: 'Category'; spendData: CategorySpendData[]}
  workspace: { name: string; namespace: string }
}

interface AggregatedSpendData {
  aggregationKey: 'Workspace' | 'Category'
}

export interface AggregatedWorkspaceSpendData extends AggregatedSpendData{
  aggregationKey: 'Workspace'
  spendData: WorkspaceSpendData[]
}

export interface AggregatedCategorySpendData extends AggregatedSpendData {
  aggregationKey: 'Category'
  spendData: CategorySpendData[]
}

export interface SpendReportServerResponse {
  spendDetails: AggregatedSpendData[]
  spendSummary: {
    cost: string
    credits: string
    currency: string
    endTime: string
    startTime: string
  }
}
// End of interfaces for dealing with the server SpendReport JSON response

interface SpendReportProps {
  billingProjectName: string
  billingProjectCloudPlatform: CloudPlatform
  viewSelected: boolean
}

export const SpendReport = (props: SpendReportProps) => {
  const [projectCost, setProjectCost] = useState<ProjectCost|null>(null)
  const [costPerWorkspace, setCostPerWorkspace] = useState<WorkspaceCosts>(
    { workspaceNames: [], computeCosts: [], otherCosts: [], storageCosts: [], numWorkspaces: 0, costFormatter: null }
  )
  const [updatingProjectCost, setUpdatingProjectCost] = useState(false)
  const [spendReportLengthInDays, setSpendReportLengthInDays] = useState(30)
  const [errorMessage, setErrorMessage] = useState()
  const includePerWorkspaceCosts = props.billingProjectCloudPlatform === 'GCP'

  const signal = useCancellation()

  const spendChartOptions = {
    chart: { marginTop: 50, spacingLeft: 20, style: { fontFamily: 'inherit' }, type: 'bar' },
    credits: { enabled: false },
    legend: { reversed: true },
    plotOptions: { series: { stacking: 'normal' } },
    series: [
      { name: 'Compute', data: costPerWorkspace.computeCosts },
      { name: 'Storage', data: costPerWorkspace.storageCosts }
    ],
    title: {
      align: 'left', style: { fontSize: '16px' }, y: 25,
      text: costPerWorkspace.numWorkspaces > maxWorkspacesInChart ? `Top ${maxWorkspacesInChart} Spending Workspaces` : 'Spend By Workspace'
    },
    tooltip: {
      followPointer: true,
      shared: true,
      headerFormat: '{point.key}',
      pointFormatter: function() { // eslint-disable-line object-shorthand
        // @ts-ignore
        return `<br/><span style="color:${this.color}">\u25CF</span> ${this.series.name}: ${costPerWorkspace.costFormatter.format(this.y)}`
      }
    },
    xAxis: {
      categories: costPerWorkspace.workspaceNames, crosshair: true,
      labels: { style: { fontSize: '12px' } }
    },
    yAxis: {
      crosshair: true, min: 0,
      labels: {
        formatter() {
          // @ts-ignore
          return costPerWorkspace.costFormatter.format(this.value)
        }, // eslint-disable-line object-shorthand
        style: { fontSize: '12px' }
      },
      title: { enabled: false },
      width: '96%'
    },
    accessibility: {
      point: {
        descriptionFormatter: point => {
          // @ts-ignore
          return `${point.index + 1}. Workspace ${point.category}, ${point.series.name}: ${costPerWorkspace.costFormatter.format(point.y)}.`
        }
      }
    },
    exporting: { buttons: { contextButton: { x: -15 } } }
  }

  const isProjectCostReady = projectCost !== null

  useEffect(() => {
    const maybeLoadProjectCost = async () => {
      if (!updatingProjectCost && !errorMessage && projectCost === null && props.viewSelected) {
        setUpdatingProjectCost(true)
        const endDate = new Date().toISOString().slice(0, 10)
        const startDate = subDays(spendReportLengthInDays, new Date()).toISOString().slice(0, 10)
        const aggregationKeys = includePerWorkspaceCosts ? ['Workspace~Category', 'Category'] : ['Category']
        const spend: SpendReportServerResponse = await Ajax(signal).Billing.getSpendReport({ billingProjectName: props.billingProjectName, startDate, endDate, aggregationKeys })
        const costFormatter = new Intl.NumberFormat(navigator.language, { style: 'currency', currency: spend.spendSummary.currency })
        const categoryDetails = _.find(details => details.aggregationKey === 'Category', spend.spendDetails) as AggregatedCategorySpendData
        console.assert(categoryDetails !== undefined, 'Spend report details do not include aggregation by Category')
        const getCategoryCosts = (categorySpendData: CategorySpendData[]): { compute: number; storage: number; other: number } => {
          return {
            compute: parseFloat(_.find(['category', 'Compute'], categorySpendData)?.cost ?? '0'),
            storage: parseFloat(_.find(['category', 'Storage'], categorySpendData)?.cost ?? '0'),
            other: parseFloat(_.find(['category', 'Other'], categorySpendData)?.cost ?? '0')
          }
        }
        const costDict = getCategoryCosts(categoryDetails.spendData)

        setProjectCost({
          spend: costFormatter.format(parseFloat(spend.spendSummary.cost)),
          compute: costFormatter.format(costDict.compute),
          storage: costFormatter.format(costDict.storage),
          other: costFormatter.format(costDict.other)
        })

        if (includePerWorkspaceCosts) {
          const workspaceDetails = _.find(details => details.aggregationKey === 'Workspace', spend.spendDetails) as AggregatedWorkspaceSpendData
          console.assert(workspaceDetails !== undefined, 'Spend report details do not include aggregation by Workspace')
          // Get the most expensive workspaces, sorted from most to least expensive.
          const mostExpensiveWorkspaces = _.flow(
            _.sortBy(({ cost }) => {
              return parseFloat(cost)
            }),
            _.reverse,
            _.slice(0, maxWorkspacesInChart)
          )(workspaceDetails?.spendData) as WorkspaceSpendData[]
          // Pull out names and costs.
          const costPerWorkspace: WorkspaceCosts = {
            workspaceNames: [],
            computeCosts: [],
            storageCosts: [],
            otherCosts: [],
            costFormatter,
            numWorkspaces: workspaceDetails?.spendData.length
          }
          _.forEach(workspaceCostData => {
            costPerWorkspace.workspaceNames.push(workspaceCostData.workspace.name)
            const categoryDetails = workspaceCostData.subAggregation
            console.assert(categoryDetails.aggregationKey === 'Category', 'Workspace spend report details do not include sub-aggregation by Category')
            const costDict = getCategoryCosts(categoryDetails.spendData)
            costPerWorkspace.computeCosts.push(costDict.compute)
            costPerWorkspace.storageCosts.push(costDict.storage)
            costPerWorkspace.otherCosts.push(costDict.other)
          }, mostExpensiveWorkspaces)
          setCostPerWorkspace(costPerWorkspace)
        }
        setUpdatingProjectCost(false)
      }
    }
    maybeLoadProjectCost().catch(async error => {
      setErrorMessage(await (error instanceof Response ? error.text() : error))
      setUpdatingProjectCost(false)
    })
  }, [spendReportLengthInDays, props, signal, projectCost, updatingProjectCost, errorMessage, includePerWorkspaceCosts])

  return h(Fragment, [
    div({ style: { display: 'grid', rowGap: '0.5rem' } }, [
      !!errorMessage && h(ErrorAlert, { errorMessage }),
      div(
        {
          style: {
            display: 'grid',
            gridTemplateColumns: 'repeat(3, minmax(max-content, 1fr))',
            rowGap: '1.66rem',
            columnGap: '1.25rem'
          }
        }, [
          div({ style: { gridRowStart: 1, gridColumnStart: 1 } }, [
            h(IdContainer, [id => h(Fragment, [
              h(FormLabel, { htmlFor: id }, ['Date range']),
              h((Select<number>), {
                id,
                value: spendReportLengthInDays,
                options: _.map(days => ({
                  label: `Last ${days} days`,
                  value: days
                }), [7, 30, 90]),
                onChange: selectedOption => {
                  const selectedDays = selectedOption!.value
                  if (selectedDays !== spendReportLengthInDays) {
                    setSpendReportLengthInDays(selectedDays)
                    setProjectCost(null)
                    setErrorMessage(undefined)
                  }
                }
              })
            ])])
          ]),
          ...(_.map(name => h(CostCard, {
            type: name,
            title: `Total ${name}`,
            amount: (!isProjectCostReady ? '...' : projectCost[name]),
            isProjectCostReady,
            showAsterisk: name === 'spend'
          }),
          ['spend', 'compute', 'storage'])
          )
        ]
      ),
      h(OtherMessaging, { cost: isProjectCostReady ? projectCost['other'] : null }),
      includePerWorkspaceCosts && costPerWorkspace.numWorkspaces > 0 && div(
        {
          style: { minWidth: 500, marginTop: '1rem' }
        }, [ // Set minWidth so chart will shrink on resize
          h(Suspense, { fallback: null }, [h(LazyChart, { options: spendChartOptions })])
        ]
      )
    ]),
    updatingProjectCost && customSpinnerOverlay({ height: '100vh', width: '100vw', position: 'fixed' })
  ])
}
