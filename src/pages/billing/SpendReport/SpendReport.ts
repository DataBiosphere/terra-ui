import { subDays } from 'date-fns/fp'
import _ from 'lodash/fp'
import { Fragment, lazy, Suspense, useEffect, useState } from 'react'
import { div, h, span } from 'react-hyperscript-helpers'
import Collapse from 'src/components/Collapse'
import {
  customSpinnerOverlay,
  IdContainer,
  Select
} from 'src/components/common'
import { icon } from 'src/components/icons'
import { Ajax } from 'src/libs/ajax'
import colors from 'src/libs/colors'
import { FormLabel } from 'src/libs/forms'
import { useCancellation } from 'src/libs/react-utils'
import * as Style from 'src/libs/style'
import * as Utils from 'src/libs/utils'


const LazyChart = lazy(() => import('src/components/Chart'))
const maxWorkspacesInChart = 10
const spendReportKey = 'spend report'

const CostCard = ({ title, amount, isProjectCostReady, showAsterisk, ...props }) => {
  return div({
    ...props,
    style: {
      ...Style.elements.card.container,
      backgroundColor: 'white',
      padding: undefined,
      boxShadow: undefined,
      gridRowStart: '2'
    }
  }, [
    div(
      {
        style: { flex: 'none', padding: '0.625rem 1.25rem' },
        'aria-live': isProjectCostReady ? 'polite' : 'off',
        'aria-atomic': true
      },
      [
        div({ style: { fontSize: 16, color: colors.accent(), margin: '0.25rem 0.0rem', fontWeight: 'normal' } }, [title]),
        div({ style: { fontSize: 32, height: 40, fontWeight: 'bold', gridRowStart: '2' } }, [
          amount,
          (!!showAsterisk && isProjectCostReady) ? span(
            {
              style: { fontSize: 16, fontWeight: 'normal', verticalAlign: 'super' },
              'aria-hidden': true
            },
            ['*']
          ) : null
        ])
      ]
    )
  ])
}

const ErrorAlert = ({ errorMessage }) => {
  const error = Utils.maybeParseJSON(errorMessage)
  // @ts-ignore
  return div({
    style: {
      backgroundColor: colors.danger(0.15), borderRadius: '4px',
      boxShadow: '0 0 4px 0 rgba(0,0,0,0.5)', display: 'flex',
      padding: '1rem', margin: '1rem 0 0'
    }
  }, [
    div({ style: { display: 'flex' } },
      [
        div({ style: { margin: '0.3rem' } }, [
          icon('error-standard', {
            // @ts-ignore
            'aria-hidden': false, 'aria-label': 'error notification', size: 30,
            style: { color: colors.danger(), flexShrink: 0, marginRight: '0.3rem' }
          })
        ]),
        Utils.cond(
          [_.isString(errorMessage), () => div({ style: { display: 'flex', flexDirection: 'column', justifyContent: 'center' } },
            [
              div({ style: { fontWeight: 'bold', marginLeft: '0.2rem' }, role: 'alert' }, // @ts-ignore
                _.upperFirst(error.message)),
              h(Collapse, { title: 'Full Error Detail', style: { marginTop: '0.5rem' } },
                [
                  div({
                    style: {
                      padding: '0.5rem', marginTop: '0.5rem', backgroundColor: colors.light(),
                      whiteSpace: 'pre-wrap', overflow: 'auto', overflowWrap: 'break-word',
                      fontFamily: 'Menlo, monospace',
                      maxHeight: 400
                    }
                  }, [JSON.stringify(error, null, 2)])
                ])
            ])],
          () => div({ style: { display: 'flex', alignItems: 'center' }, role: 'alert' }, errorMessage.toString()))
      ])
  ])
}

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

export const SpendReport = ({ tab, billingProject }) => {
  const [updating, setUpdating] = useState(false)
  const [projectCost, setProjectCost] = useState(null)
  const [costPerWorkspace, setCostPerWorkspace] = useState(
    { workspaceNames: [], computeCosts: [], otherCosts: [], storageCosts: [], numWorkspaces: 0, costFormatter: null }
  )
  const [updatingProjectCost, setUpdatingProjectCost] = useState(false)
  const [spendReportLengthInDays, setSpendReportLengthInDays] = useState(30)
  const [errorMessage, setErrorMessage] = useState()

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
        formatter() { // @ts-ignore
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

  // Update cost data only if report date range changes, or if spend report tab was selected.
  useEffect(() => {
    const maybeLoadProjectCost =
        Utils.withBusyState(setUpdating, async () => {
          if (!updatingProjectCost && projectCost === null && tab === spendReportKey) {
            setUpdatingProjectCost(true)
            const endDate = new Date().toISOString().slice(0, 10)
            const startDate = subDays(spendReportLengthInDays, new Date()).toISOString().slice(0, 10)
            const spend = await Ajax(signal).Billing.getSpendReport({ billingProjectName: billingProject.projectName, startDate, endDate })
            const costFormatter = new Intl.NumberFormat(navigator.language, { style: 'currency', currency: spend.spendSummary.currency })
            // @ts-ignore
            const categoryDetails = _.find(details => details.aggregationKey === 'Category')(spend.spendDetails)
            console.assert(categoryDetails !== undefined, 'Spend report details do not include aggregation by Category')
            const getCategoryCosts = (categorySpendData, asFloat) => {
              const costDict = {}
              _.forEach(type => {
                // @ts-ignore
                const costAsString = _.find(['category', type])(categorySpendData)?.cost ?? 0
                costDict[type] = asFloat ? parseFloat(costAsString) : costFormatter.format(costAsString)
              }, ['Compute', 'Storage', 'Other'])
              return costDict
            }
            // @ts-ignore
            const costDict = getCategoryCosts(categoryDetails.spendData, false)

            const totalCosts = {
              spend: costFormatter.format(spend.spendSummary.cost), // @ts-ignore
              compute: costDict.Compute, // @ts-ignore
              storage: costDict.Storage, // @ts-ignore
              other: costDict.Other
            }

            // @ts-ignore
            setProjectCost(totalCosts)

            // @ts-ignore
            const workspaceDetails = _.find(details => details.aggregationKey === 'Workspace')(spend.spendDetails)
            console.assert(workspaceDetails !== undefined, 'Spend report details do not include aggregation by Workspace')
            // Get the most expensive workspaces, sorted from most to least expensive.
            // @ts-ignore
            const mostExpensiveWorkspaces = _.flow(
              _.sortBy(({ cost }) => { return parseFloat(cost) }),
              _.reverse,
              _.slice(0, maxWorkspacesInChart) // @ts-ignore
            )(workspaceDetails?.spendData)
            // Pull out names and costs.
            const costPerWorkspace = {
              // @ts-ignore
              workspaceNames: [], computeCosts: [], storageCosts: [], otherCosts: [], costFormatter, numWorkspaces: workspaceDetails?.spendData.length
            }
            _.forEach(workspaceCostData => {
              // @ts-ignore
              costPerWorkspace.workspaceNames.push(workspaceCostData.workspace.name)
              // @ts-ignore
              const categoryDetails = workspaceCostData.subAggregation
              console.assert(categoryDetails.key !== 'Category', 'Workspace spend report details do not include sub-aggregation by Category')
              const costDict = getCategoryCosts(categoryDetails.spendData, true) // @ts-ignore
              costPerWorkspace.computeCosts.push(costDict.Compute) // @ts-ignore
              costPerWorkspace.storageCosts.push(costDict.Storage) // @ts-ignore
              costPerWorkspace.otherCosts.push(costDict.Other) // @ts-ignore
            })(mostExpensiveWorkspaces) // @ts-ignore
            setCostPerWorkspace(costPerWorkspace)
            setUpdatingProjectCost(false)
          }
        })
    maybeLoadProjectCost().catch(async error => {
      setErrorMessage(await (error instanceof Response ? error.text() : error))
      setUpdatingProjectCost(false)
    })
  }, [spendReportLengthInDays, tab]) // eslint-disable-line react-hooks/exhaustive-deps

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
              h(Select, {
                id,
                value: spendReportLengthInDays,
                options: _.map(days => ({
                  label: `Last ${days} days`,
                  value: days
                }), [7, 30, 90]),
                // @ts-ignore
                onChange: ({ value: selectedDays }) => {
                  if (selectedDays !== spendReportLengthInDays) {
                    setSpendReportLengthInDays(selectedDays)
                    setProjectCost(null)
                  }
                }
              })
            ])])
          ]),
          ...(_.map(name => h(CostCard, {
            title: `Total ${name}`,
            amount: (!isProjectCostReady ? '...' : projectCost[name]),
            isProjectCostReady,
            showAsterisk: name === 'spend',
            key: name
          }),
          ['spend', 'compute', 'storage'])
          )
        ]
      ),
      h(OtherMessaging, { cost: isProjectCostReady ? projectCost['other'] : null }),
      costPerWorkspace.numWorkspaces > 0 && div(
        {
          style: { minWidth: 500, marginTop: '1rem' }
        }, [ // Set minWidth so chart will shrink on resize
          h(Suspense, { fallback: null }, [h(LazyChart, { options: spendChartOptions })])
        ]
      )
    ]),
    updating && customSpinnerOverlay({ height: '100vh', width: '100vw', position: 'fixed' })
  ])
}
