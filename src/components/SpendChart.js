import Highcharts from 'highcharts' // Highcharts is being used under the Creative Commons Attribution-NonCommercial 3.0 license
import highchartsAccessibility from 'highcharts/modules/accessibility'
import highchartsExporting from 'highcharts/modules/exporting'
import HighchartsReact from 'highcharts-react-official'
import { h } from 'react-hyperscript-helpers'
import { useOnMount } from 'src/libs/react-utils'


const SpendChart = options => {
  useOnMount(() => {
    highchartsAccessibility(Highcharts)
    highchartsExporting(Highcharts)
  })

  return h(HighchartsReact, { highcharts: Highcharts, options })
}

export default SpendChart
