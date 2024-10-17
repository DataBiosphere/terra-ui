export function generateAgeChartOptions() {
  return {
    categories: [
      { short: '0-17' },
      { short: '18-29' },
      { short: '30-39' },
      { short: '40-49' },
      { short: '50-59' },
      { short: '60-69' },
      { short: '70-79' },
      { short: '80+' },
    ],
    series: [{ data: [9, 25, 15, 17, 14, 9, 6, 5] }],
    title: 'Age',
    yTitle: 'OVERALL PERCENTAGES',
    height: '400rem',
    legendEnabled: false,
    showSeriesName: false,
    type: 'bar',
  };
}

export function generateGenderChartOptions() {
  return {
    categories: [
      { short: 'Man' },
      { short: 'Woman' },
      { short: 'Nonbinary' },
      { short: 'Transgender' },
      { short: 'Other' },
      { short: 'Prefer not to Say' },
    ],
    series: [
      {
        colorByPoint: true,
        data: [28, 31, 11, 10, 6, 14],
      },
    ],
    title: 'Gender Identity',
    yTitle: 'OVERALL PERCENTAGES',
    height: '400rem',
    legendEnabled: false,
    showSeriesName: false,
    type: 'column',
  };
}

export function generateRaceChartOptions() {
  return {
    categories: [
      { short: 'White' },
      { short: 'Black, African American' },
      { short: 'Hispanic or Latino' },
      { short: 'Asian' },
      { short: 'More than one' },
      { short: 'Other' },
      { short: 'Prefer not to Say' },
    ],
    series: [
      {
        colorByPoint: true,
        data: [24, 18, 16, 8, 27, 5, 2],
      },
    ],
    title: 'Race',
    yTitle: 'OVERALL PERCENTAGES',
    height: '400rem',
    legendEnabled: false,
    showSeriesName: false,
    type: 'column',
  };
}

export function generateTopConditionsChartOptions() {
  return {
    categories: [
      { short: 'Type 2 diabetes mellitus' },
      { short: 'Atrial fibrillation' },
      { short: 'Chest pain' },
      { short: 'Pure hypercholesterolemia' },
      { short: 'Anemia' },
      { short: 'Coronary arteriosclerosis' },
      { short: 'Hypothyroidism' },
      { short: 'Malaise and fatigue' },
      { short: 'Congestive heart failure' },
      { short: 'Urinary tract infectious disease' },
    ],
    series: [{ data: [17050, 15800, 10200, 9510, 7900, 5980, 3510, 3400, 2500, 2000] }],
    title: 'Top 10 Conditions',
    yTitle: 'PARTICIPANT COUNT',
    height: '400rem',
    legendEnabled: false,
    showSeriesName: false,
    type: 'bar',
  };
}

export function generateTopDrugsChartOptions() {
  return {
    categories: [
      { short: 'Metformin' },
      { short: 'Epoetin Alfa' },
      { short: 'Influenza virus vaccine' },
      { short: 'Simvastatin 40 MG Oral Tablet' },
      { short: 'Lovastatin 20 MG Oral Tablet' },
      { short: 'Gemfibrozil 600 MG Oral Tablet' },
      { short: 'Omeprazole 20 MG Delayed Release Oral Tablet' },
      { short: 'Levothyroxine' },
      { short: 'Atorvastatin' },
      { short: 'Acetaminophen' },
    ],
    series: [{ data: [18900, 17500, 16200, 13500, 12040, 7510, 7010, 7000, 2550, 2000] }],
    title: 'Top 10 Drugs',
    yTitle: 'PARTICIPANT COUNT',
    height: '400rem',
    legendEnabled: false,
    showSeriesName: false,
    type: 'bar',
  };
}

export function generateTopProceduresChartOptions() {
  return {
    categories: [
      { short: 'Other diagnostic procedures on heart and pericardium' },
      {
        short:
          'Office or other outpatient visit for the evaluation and management of a new patient, which requires these 3 key components: An expanded problem focused history; An expanded problem focused examination; Straightforward medical decision making.',
      },
      { short: 'Biopsy of lymphatic structure' },
      { short: 'Biopsy of mouth, unspecified structure' },
      { short: 'Anemia' },
      {
        short:
          'Therapeutic procedure, 1 or more areas, each 15 minutes; massage, including effleurage, petrissage and/or tapotement (stroking, compression, percussion)',
      },
      { short: 'Long-term drug therapy' },
      { short: 'Surgical procedure' },
      { short: 'Procedure on trunk' },
      { short: 'Screening for disorder' },
    ],
    series: [{ data: [18100, 12550, 7550, 7480, 5100, 4950, 2690, 2550, 1790, 1700] }],
    title: 'Top 10 Procedures',
    yTitle: 'PARTICIPANT COUNT',
    height: '400rem',
    legendEnabled: false,
    showSeriesName: false,
    type: 'bar',
  };
}
