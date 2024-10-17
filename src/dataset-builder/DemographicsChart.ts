import _ from 'lodash/fp';
import { generateRandomNumbers, generateRandomNumbersThatAddUpTo } from 'src/dataset-builder/TestConstants';

interface ChartLabel {
  short: string;
  long?: string;
}
export interface ChartSeries {
  name?: string;
  colorByPoint?: boolean;
  data: any /* number[] | number[][] */;
}

export interface CohortDemographics {
  categories: ChartLabel[];
  series: ChartSeries[];
  title: string;
  yTitle: string;
  height: string;
  legendEnabled: boolean;
  showSeriesName: boolean;
  type: string;
}
export function chartOptions(cohortDemographics: CohortDemographics) {
  return {
    chart: {
      spacingLeft: 20,
      spacingRight: 30,
      height: cohortDemographics.height,
      style: { fontFamily: 'inherit' },
      type: cohortDemographics.type,
    },
    legend: { enabled: cohortDemographics.legendEnabled },
    plotOptions: { series: { stacking: 'normal' } },
    series: cohortDemographics.series,
    title: {
      align: 'left',
      style: { fontSize: '16px', fontWeight: 'bold', color: '#333f52' },
      text: cohortDemographics.title,
    },
    tooltip: {
      followPointer: true,
      formatter() {
        // @ts-ignore
        // eslint-disable-next-line react/no-this-in-sfc
        const currCategory: ChartLabel = _.find((category) => category.short === this.x, cohortDemographics.categories);
        const categoryDescription = currCategory.long ?? currCategory.short;
        if (cohortDemographics.showSeriesName) {
          // @ts-ignore
          // eslint-disable-next-line react/no-this-in-sfc
          return `${categoryDescription} <br/><span style="color:${this.color}">\u25CF</span> ${this.series.name}<br/> ${this.y}`;
        }
        // @ts-ignore
        // eslint-disable-next-line react/no-this-in-sfc
        return `${categoryDescription} <br/> ${this.y}`;
      },
    },
    xAxis: {
      categories: _.map('short', cohortDemographics.categories),
      crosshair: true,
    },
    yAxis: {
      crosshair: true,
      title: { text: cohortDemographics.yTitle },
    },
    accessibility: {
      point: {
        descriptionFormatter: (point) => {
          return `${point.index + 1}. Category ${point.category}, ${point.series.name}: ${point.y}.`;
        },
      },
    },
    exporting: { buttons: { contextButton: { x: -15 } } },
  };
}

// for gender identity and current age chart
export function generateRandomCohortAgeData() {
  return generateCohortAgeData(generateRandomCohortAgeSeries());
}

export function generateCohortAgeData(series) {
  return {
    categories: [
      { short: 'Female' },
      { short: 'Male' },
      { short: 'Other', long: 'Nonbinary, 2 Spirit, Genderqueer, etc.' },
    ],
    // keeps the chart from side effecting the series value
    series: _.cloneDeep(series),
    title: 'Gender identity and current age',
    yTitle: 'AVERAGE AGE',
    height: '250rem',
    legendEnabled: false,
    showSeriesName: false,
    type: 'bar',
  };
}

export function generateRandomCohortAgeSeries() {
  return [{ data: generateRandomNumbers(3, 90) }];
}

// for gender identity, current age, and race chart
export function generateRandomCohortDemographicData() {
  return generateCohortDemographicData(generateDemographicSeries());
}
export function generateCohortDemographicData(series) {
  return {
    categories: [
      { short: 'Female' },
      { short: 'Female 18-44' },
      { short: 'Female 45-64' },
      { short: 'Female 65+' },
      { short: 'Male' },
      { short: 'Male 18-44' },
      { short: 'Male 45-64' },
      { short: 'Male 65+' },
      { short: 'Other', long: 'Nonbinary, 2 Spirit, Genderqueer, etc.' },
      { short: 'Other 18-44', long: 'Nonbinary, 2 Spirit, Genderqueer, etc. 18-44' },
      { short: 'Other 45-64', long: 'Nonbinary, 2 Spirit, Genderqueer, etc. 45-64' },
      { short: 'Other 65+', long: 'Nonbinary, 2 Spirit, Genderqueer, etc. 65+' },
    ],
    // keeps the chart from side effecting the series value
    series: _.cloneDeep(series),
    title: 'Gender identity, current age, and race',
    yTitle: 'OVERALL PERCENTAGE',
    height: '500rem',
    legendEnabled: true,
    showSeriesName: true,
    type: 'bar',
  };
}

export function generateDemographicSeries(): ChartSeries[] {
  const series: ChartSeries[] = [
    { name: 'Asian', data: [] },
    { name: 'Black', data: [] },
    { name: 'White', data: [] },
    { name: 'Native American', data: [] },
    { name: 'Pacific Islander', data: [] },
  ];
  // for each of the three gender identity totals,
  const genderTotals = generateRandomNumbersThatAddUpTo(100, 3);
  for (const genderTotal of genderTotals) {
    // generate the race breakdown for the gender totals
    const genderTotalRaceBreakDown = generateRandomNumbersThatAddUpTo(genderTotal, 5);
    addToSeriesData(series, genderTotalRaceBreakDown);
    // get the three age group breakdowns
    const ageGroupGenderTotal = generateRandomNumbersThatAddUpTo(genderTotal, 3);
    // get race breakdowns for each of the gender age groups
    for (const genderAgeGroupTotal of ageGroupGenderTotal) {
      const genderAgeGroupRaceBreakdown = generateRandomNumbersThatAddUpTo(genderAgeGroupTotal, 5);
      addToSeriesData(series, genderAgeGroupRaceBreakdown);
    }
  }
  return series;
}

// series and data will always be the same length
export function addToSeriesData(series: ChartSeries[], data: number[]) {
  if (series.length !== data.length) throw new Error('series and data must be the same length');
  for (let i = 0; i < series.length; i++) {
    series[i].data.push(data[i]);
  }
}
