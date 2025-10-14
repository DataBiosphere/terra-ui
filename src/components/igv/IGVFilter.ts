import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { a, div, h, input, label, span } from 'react-hyperscript-helpers';
import * as ss from 'simple-statistics';
import Slider from 'src/components/common/Slider';

import { Chart } from '../Chart';
import { Select } from '../common';
import { NumberInput } from '../input';

const igvStyles = {
  igvFiltersContainer: {
    float: 'left' as const,
    marginLeft: '5px',
    marginBottom: '20px',
  },
  igvFacet: {
    marginTop: '15px',
    width: '240px',
  },
  igvFacetHeader: {
    fontWeight: 'bold' as const,
    position: 'relative' as const,
    top: '-4px',
  },
  igvFacetHeaderCategorical: {
    fontWeight: 'bold' as const,
    position: 'relative' as const,
    top: '-4px',
  },
  igvFilterLabel: {
    cursor: 'pointer' as const,
    ':hover': {
      color: '#007',
    },
  },
  igvFilterLabelDiv: {
    marginLeft: '14px',
  },
  igvFilterCount: {
    float: 'right' as const,
  },
  igvFacetToggle: {
    color: '#337ab7',
    cursor: 'pointer' as const,
    marginLeft: '14px',
    ':hover': {
      color: '#23527c',
    },
  },
  brushSelection: {
    fillOpacity: 0.1,
    fill: '#3d5a87',
    stroke: '#3d5a87',
    shapeRendering: 'crispEdges' as const,
  },
};

const HISTOGRAM_BAR_MAX_HEIGHT = 20;
const HISTOGRAM_WIDTH = 225;
const defaultNumericInputWidth = 55;

type HistogramBarAttributes = {
  count: number;
  start: number;
  end: number;
};

// Base Facet type
interface BaseFacetAttributes {
  name: string;
  description: string;
}

// CategoricalFacet type
interface CategoricalFacetAttributes extends BaseFacetAttributes {
  type: 'categorical';
  filterNames: string[]; // List of filter names
  countsByFilterName: { [key: string]: number }; // Count of features for each filter name
}

// NumericFacet type
interface NumericFacetAttributes extends BaseFacetAttributes {
  type: 'integer' | 'float'; // Numeric types
  filterNumbers: number[]; // List of numeric values
  statistics?: {
    min: number;
    q1: number;
    median: number;
    q3: number;
    max: number;
    mean: number;
    quantiles: number[];
  };
}

// Facet type as a union of CategoricalFacet and NumericFacet
type FacetAttributes = CategoricalFacetAttributes | NumericFacetAttributes;

const widthsByOperator = {
  between: 85,
  'not between': 100,
  '=': 65,
  '!=': 65,
  '<': 65,
  '<=': 65,
  '>': 65,
  '>=': 65,
};

function getQuantiles(sortedNumbers: number[], max: number, min: number, numBins = 15) {
  // Guard against empty array or invalid range
  if (sortedNumbers.length === 0 || max === min) {
    return new Array(numBins).fill(0);
  }

  const binSize = (max - min) / numBins;
  const quantiles = new Array(numBins).fill(0);

  for (const num of sortedNumbers) {
    // Calculate which bin this number belongs to
    const binIndex = Math.min(
      Math.floor((num - min) / binSize),
      numBins - 1 // Handle edge case where num === max
    );
    quantiles[binIndex] += 1;
  }

  return quantiles;
}

function getStatistics(numbers: number[]) {
  // Guard against empty arrays
  if (numbers.length === 0) {
    return {
      min: 0,
      q1: 0,
      median: 0,
      q3: 0,
      max: 0,
      mean: 0,
      quantiles: [],
    };
  }

  const sorted = numbers.slice().sort((a, b) => a - b);

  return {
    min: ss.minSorted(sorted),
    q1: ss.quantileSorted(sorted, 0.25),
    median: ss.median(numbers),
    q3: ss.quantileSorted(sorted, 0.75),
    max: ss.maxSorted(sorted),
    mean: ss.mean(numbers),
    quantiles: getQuantiles(sorted, ss.maxSorted(sorted), ss.minSorted(sorted)),
  };
}

function getFacetClass(facetName: string) {
  return `igv-facet-${facetName}`;
}

function getFriendlyFacetName(facet: FacetAttributes): string {
  const friendlyNames: { [key: string]: string } = {
    VT: 'Variant Type',
    AA: 'Ancestral Allele',
    AC: 'Allele Count',
    AF: 'Allele Frequency',
    AFR_AF: 'AF: African',
    AMR_AF: 'AF: Admixed American',
    EAS_AF: 'AF: East Asian',
    EUR_AF: 'AF: European',
    SAS_AF: 'AF: South Asian',
    DP: 'Read Depth',
  };

  let friendlyName = facet.name;
  if (facet.name in friendlyNames) {
    friendlyName = `${friendlyNames[facet.name]}`;
  }

  return friendlyName;
}

interface CategoricalFacetProps {
  facet: CategoricalFacetAttributes;
  selection: string[];
  onChange: (selection: string[]) => void;
  isPartlyCollapsed?: boolean;
}

const CategoricalFacet: React.FC<CategoricalFacetProps> = ({
  facet,
  selection,
  onChange,
  isPartlyCollapsed: initialCollapsed = true,
}) => {
  const [isPartlyCollapsed, setIsPartlyCollapsed] = useState(initialCollapsed);
  // Don't render facet if it has fewer than 2 filters
  const numFilters = facet.filterNames.length;

  const handleCheckboxChange = useCallback(
    (filterName: string, checked: boolean) => {
      if (checked) {
        onChange([...selection, filterName]);
      } else {
        onChange(selection.filter((name) => name !== filterName));
      }
    },
    [selection, onChange]
  );

  const togglePartialCollapse = useCallback(() => {
    setIsPartlyCollapsed(!isPartlyCollapsed);
  }, [isPartlyCollapsed]);

  if (numFilters < 2) return null;

  const friendlyName = getFriendlyFacetName(facet);
  const facetClass = getFacetClass(facet.name);

  return div({ className: `igv-facet ${facetClass}`, style: igvStyles.igvFacet }, [
    div([
      span(
        {
          className: 'igv-facet-header igv-facet-header-categorical',
          title: facet.description,
          style: igvStyles.igvFacetHeaderCategorical,
        },
        [friendlyName]
      ),
    ]),

    // Filter checkboxes
    ...facet.filterNames.map((filterName, i) => {
      const isHidden = isPartlyCollapsed && i >= 5;
      const count = facet.countsByFilterName[filterName];

      return label(
        {
          key: filterName,
          className: 'igv-filter-label',
          style: {
            ...igvStyles.igvFilterLabel,
            ...(isHidden ? { display: 'none' } : {}),
            cursor: 'pointer',
          },
          'data-igv-facet-name': facet.name,
          'data-igv-filter-name': filterName,
        },
        [
          div({ style: igvStyles.igvFilterLabelDiv }, [
            input({
              type: 'checkbox',
              value: filterName,
              name: `${facet.name}:${filterName}`,
              className: 'igv-filter igv-filter-categorical',
              'data-igv-facet-name': facet.name,
              'data-igv-filter-name': filterName,
              checked: selection.includes(filterName),
              onChange: (e: React.ChangeEvent<HTMLInputElement>) => handleCheckboxChange(filterName, e.target.checked),
            }),
            span({ className: 'igv-filter-label-text' }, [filterName]),
            span({ className: 'igv-filter-label-quantities' }, [
              span({ className: 'igv-filter-count', style: igvStyles.igvFilterCount }, [count.toString()]),
            ]),
          ]),
        ]
      );
    }),

    // More/Less toggle if there are more than 5 filters
    numFilters > 5 &&
      a(
        {
          className: 'igv-facet-toggle',
          'data-igv-facet-name': facet.name,
          'data-igv-is-partly-collapsed': isPartlyCollapsed.toString(),
          onClick: togglePartialCollapse,
          style: igvStyles.igvFacetToggle,
        },
        [isPartlyCollapsed ? 'More...' : 'Less...']
      ),
  ]);
};

function getPrecision(numericFacet: { type: string }): number {
  return numericFacet.type === 'integer' ? 0 : 2;
}

/**
 * Round, source: https://stackoverflow.com/a/18358056
 *
 * @param {number} val
 * @param {number} [precision]
 * @return {number}
 */
function round(val: number, precision = 0) {
  const exponent = `e+${precision}`;
  const withExponent = `${val}${exponent}`;
  const rounded = Math.round(Number(withExponent));
  const result = `${rounded}e-${precision}`;
  return Number(result);
}

/**
 * Get width and font size for input, to help keep full value glanceable
 */
function getInputStyle(inputValue: number, operator: string, precision: number | undefined) {
  let width = defaultNumericInputWidth;
  let fontSize = 13;

  const roundedNumber = round(inputValue, precision);
  const stringValue = roundedNumber.toString();
  let numDigits = stringValue.length;
  if (stringValue.includes('.')) {
    numDigits -= 0.75;
  }

  if (numDigits > 4 && (!['between', 'not between'].includes(operator) || numDigits <= 7)) {
    fontSize = 12;
    width += 6 * (numDigits - 4);
  } else if (numDigits > 7) {
    fontSize = 11;
    width += 5.5 * (numDigits - 4);
  }

  const style = {
    width: `${width}px`,
    fontSize: `${fontSize}px`,
    numDigits, // Not a standard style, but a helpful prop
    paddingLeft: '0.25em',
    paddingRight: '0.25em',
    textAlign: 'center' as const,
    height: '1.9rem',
    border: '1px solid #ccc',
  };

  return style;
}

function getResponsiveStyles(inputValue: number, inputValue2: number, operator: string, precision: number | undefined) {
  const inputStyle = getInputStyle(inputValue, operator, precision);
  const inputStyle2 = getInputStyle(inputValue2, operator, precision);
  const andStyle: { marginLeft: string; marginRight?: string; fontSize?: number } = { marginLeft: '4px' };
  const totalDigits = inputStyle.numDigits + inputStyle2.numDigits;
  if (totalDigits > 14) {
    andStyle.marginLeft = '2px';
    andStyle.marginRight = '-2px';
    if (totalDigits > 16) {
      andStyle.fontSize = 11.5;
    }
  }
  const styles = {
    input: inputStyle,
    input2: inputStyle2,
    and: andStyle,
  };
  return styles;
}

const NumericHistogram: React.FC<{
  facet: NumericFacetAttributes;
  currentRange: [number, number];
}> = ({ facet, currentRange }) => {
  const bars = getHistogramBars(facet);

  const options = useMemo(
    () => ({
      chart: {
        type: 'column',
        height: 30,
        width: HISTOGRAM_WIDTH,
        backgroundColor: 'transparent',
        margin: [0, 0, 5, 0],
        spacing: [0, 0, 0, 0],
      },
      title: { text: null },
      credits: { enabled: false },
      legend: { enabled: false },
      exporting: { enabled: false },

      xAxis: {
        min: facet.statistics?.min,
        max: facet.statistics?.max,
        labels: { enabled: false },
        lineWidth: 1,
        lineColor: '#AAA',
        tickWidth: 0,
        plotBands: [
          {
            from: currentRange[0],
            to: currentRange[1],
            color: 'rgba(61, 90, 135, 0.15)',
            borderColor: '#3d5a87',
            borderWidth: 1,
            zIndex: 3,
          },
        ],
      },

      yAxis: {
        visible: false,
        max: Math.max(...bars.map((b) => b.count), 1),
      },

      plotOptions: {
        column: {
          pointPadding: 0,
          groupPadding: 0.05,
          borderWidth: 0,
          color: '#3D5A87',
          states: {
            hover: { enabled: false },
          },
          enableMouseTracking: true,
        },
      },

      series: [
        {
          data: bars.map((bar) => ({
            x: (bar.start + bar.end) / 2,
            y: bar.count,
            custom: { start: bar.start, end: bar.end },
          })),
          pointWidth: 11,
        },
      ],

      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderColor: '#3d5a87',
        borderRadius: 4,
        shadow: true,
      },
    }),
    [facet, bars, currentRange]
  );

  return h(Chart, { options });
};

const isValidCategoricalFacet = (facet: CategoricalFacetAttributes): boolean => {
  return facet.filterNames.length >= 2;
};

const isValidNumericFacet = (facet: NumericFacetAttributes): boolean => {
  return (
    facet.filterNumbers.length > 0 &&
    facet.statistics?.min !== undefined &&
    facet.statistics?.max !== undefined &&
    facet.statistics.min !== facet.statistics.max
  );
};

const isValidFacet = (facet: FacetAttributes): boolean => {
  if (facet.type === 'categorical') {
    return isValidCategoricalFacet(facet);
  }
  return isValidNumericFacet(facet);
};

const NumericFacet: React.FC<{
  facet: NumericFacetAttributes;
  selection?: any[];
  onChange: (selection: any[]) => void;
}> = ({ facet, selection, onChange }) => {
  const [currentRange, setCurrentRange] = useState<[number, number] | null>(null);
  const [operator, setOperator] = useState<string>('between');
  const [displayValues, setDisplayValues] = useState<[string, string]>(['0', '0']); // Track display strings

  const precision = useMemo(() => getPrecision(facet), [facet]);
  const styles = useMemo(
    () => (currentRange ? getResponsiveStyles(currentRange[0], currentRange[1], operator, precision) : null),
    [currentRange, operator, precision]
  );

  useEffect(() => {
    if (facet.statistics) {
      let initialRange: [number, number];
      let initialOperator = 'between';

      if (selection && selection.length > 0 && selection[0].length === 2) {
        initialOperator = selection[0][0];
        initialRange = selection[0][1];
        setOperator(initialOperator);
      } else {
        initialRange = [facet.statistics.min, facet.statistics.max];
      }

      setCurrentRange(initialRange);
      setDisplayValues([initialRange[0].toString(), initialRange[1].toString()]);
    }
  }, [facet.statistics, selection]);

  const handleOperatorChange = useCallback(
    (event: any) => {
      const newOperator = event.value;
      setOperator(newOperator);

      if (currentRange) {
        onChange([[newOperator, currentRange]]);
      }
    },
    [currentRange, onChange]
  );

  const handleSliderChange = useCallback(
    (value: number | number[]) => {
      const range = value as [number, number];
      setCurrentRange(range);
      setDisplayValues([range[0].toFixed(precision), range[1].toFixed(precision)]);
      onChange([[operator, range]]);
    },
    [onChange, operator, precision]
  );
  const handleMinInputChange = useCallback((value: string) => {
    // Allow typing any value, store as display string
    setDisplayValues((prev) => [value, prev[1]]);
  }, []);

  const handleMaxInputChange = useCallback((value: string) => {
    // Allow typing any value, store as display string
    setDisplayValues((prev) => [prev[0], value]);
  }, []);

  const handleMinInputBlur = useCallback(() => {
    if (!currentRange || !facet.statistics) return;

    const numValue = Number.parseFloat(displayValues[0]);
    if (Number.isNaN(numValue)) {
      setDisplayValues((prev) => [currentRange[0].toString(), prev[1]]);
      return;
    }

    // For between/not between, ensure min <= max
    let newMin = numValue;
    if (['between', 'not between'].includes(operator)) {
      newMin = Math.min(numValue, currentRange[1]);
    }

    const newRange: [number, number] = [newMin, currentRange[1]];
    setCurrentRange(newRange);
    setDisplayValues([newMin.toString(), newRange[1].toString()]);
    onChange([[operator, newRange]]);
  }, [currentRange, displayValues, operator, onChange, facet.statistics]);

  const handleMaxInputBlur = useCallback(() => {
    if (!currentRange || !facet.statistics) return;

    const numValue = Number.parseFloat(displayValues[1]);
    if (Number.isNaN(numValue)) {
      setDisplayValues((prev) => [prev[0], currentRange[1].toString()]);
      return;
    }

    // For between/not between, ensure max >= min
    let newMax = numValue;
    if (['between', 'not between'].includes(operator)) {
      newMax = Math.max(numValue, currentRange[0]);
    }

    const newRange: [number, number] = [currentRange[0], newMax];
    setCurrentRange(newRange);
    setDisplayValues([newRange[0].toString(), newMax.toString()]);
    onChange([[operator, newRange]]);
  }, [currentRange, displayValues, operator, onChange, facet.statistics]);

  const handleMinInputKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleMinInputBlur();
      }
    },
    [handleMinInputBlur]
  );

  const handleMaxInputKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleMaxInputBlur();
      }
    },
    [handleMaxInputBlur]
  );

  if (!facet.statistics || !currentRange || !styles) {
    return null;
  }

  const friendlyName = getFriendlyFacetName(facet);
  const step = facet.type === 'integer' ? 1 : (facet.statistics.max - facet.statistics.min) / 1000;

  return div(
    {
      className: `igv-facet igv-facet-${facet.name} igv-facet-numeric`,
      style: {
        ...igvStyles.igvFacet,
      },
    },
    [
      span(
        {
          className: 'igv-facet-header',
          title: facet.description,
          style: igvStyles.igvFacetHeader,
        },
        [friendlyName]
      ),

      // Highcharts histogram
      div(
        {
          style: {
            marginTop: '8px',
            marginBottom: '4px',
            border: '1px solid #AAA',
            borderTop: 'none',
            borderLeft: 'none',
            borderRight: 'none',
          },
        },
        [
          h(NumericHistogram, {
            facet,
            currentRange,
          }),
        ]
      ),

      // slider for range selection
      div({ style: { marginTop: '8px', marginBottom: '12px', padding: '0 8px' } }, [
        h(Slider, {
          range: true,
          value: currentRange,
          min: facet.statistics.min,
          onChange: (values) => handleSliderChange(values),
          step,
          max: facet.statistics.max,
          ariaLabelForHandle: [`${facet.name} low slider`, `${facet.name} high slider`],
        }),
      ]),

      // Input controls
      div(
        {
          className: 'igv-facet-numeric-inputs-container',
          style: {
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            marginTop: '8px',
            width: `${HISTOGRAM_WIDTH}px`,
            maxWidth: `${HISTOGRAM_WIDTH}px`,
            minHeight: '24px',
          },
        },
        [
          h(Select, {
            value: operator,
            onChange: handleOperatorChange,
            styles: {
              control: (provided: any) => ({
                ...provided,
                width: `${widthsByOperator[operator as keyof typeof widthsByOperator] || 85}px`,
                fontSize: '13px',
                minHeight: '24px',
                border: '1px solid #ccc',
              }),
              valueContainer: (provided: any) => ({
                ...provided,
                padding: '2px 6px',
              }),
              input: (provided: any) => ({
                ...provided,
                margin: '0px',
                padding: '0px',
              }),
              dropdownIndicator: (provided: any) => ({
                ...provided,
                padding: '4px',
              }),
              indicatorSeparator: () => ({
                display: 'none',
              }),
              menu: (provided: any) => ({
                ...provided,
                zIndex: 1000,
              }),
              option: (provided: any) => ({
                ...provided,
                fontSize: '13px',
                padding: '4px 8px',
              }),
            },
            options: [
              { value: 'between', label: 'btw' },
              { value: 'not between', label: 'not btw' },
              { value: '=', label: '=' },
              { value: '!=', label: '!=' },
              { value: '<', label: '<' },
              { value: '<=', label: '≤' },
              { value: '>', label: '>' },
              { value: '>=', label: '≥' },
            ],
          }),

          h(NumberInput, {
            className: 'igv-numeric-query-input igv-numeric-query-input-value',
            value: displayValues[0],
            onChange: handleMinInputChange,
            onBlur: handleMinInputBlur,
            onKeyDown: handleMinInputKeyDown,
            style: {
              ...styles.input,
            },
          }),

          ['between', 'not between'].includes(operator) &&
            span(
              {
                className: 'igv-and-input-2',
                style: {
                  display: 'inline-block',
                },
              },
              [span({ style: { ...styles.and } }, ['and'])]
            ),

          ['between', 'not between'].includes(operator) &&
            h(NumberInput, {
              className: 'igv-numeric-query-input igv-numeric-query-input-value2',
              value: displayValues[1],
              onChange: handleMaxInputChange,
              onBlur: handleMaxInputBlur,
              onKeyDown: handleMaxInputKeyDown,
              style: {
                ...styles.input2,
              },
            }),
        ]
      ),
    ]
  );
};

function getRefinedDescription(facet: FacetAttributes, facetName: string) {
  let prose = facet.description;
  if (facetName === 'VT') {
    prose = 'Type of variant';
  } else if (facetName === 'AA') {
    prose =
      'Format: AA | REF | ALT | IndelType &#013;' +
      'AA: Ancestral allele, REF: Reference allele, ALT: Alternate allele, IndelType: Type of Indel. &#013;' +
      'REF, ALT and IndelType are only defined for indels.';
  }

  const description = `INFO field: ${facetName}&#013;${prose}`;

  return description;
}

/**
 * Initialize facets and filters for the current genomic frame
 *
 * Output:
 *  [
 *     {
 *       "name": <String>, // Internal name of facet, e.g. "VT"
 *
 *       "displayName": <String>, // e.g. "Variant type"
 *
 *       "type": <String> // "categorical" or "integer" or "float"
 *
 *       // For categorical: names of filters in facet
 *       // The index of these names correspond to the integer value at the
 *       // appropriate position in the `features` array.
 *       "filterNames": [<String>],
 *
 *       // For categorical: number of features satisfying each filter
 *       "countsByFilterName": {
 *          <String>: <Integer>
 *       }
 *
 *      // For integer or float: numeric values observed for this facet
 *      "filterNumbers": [<Number>],
 *
 *      "statistics": {
 *        "min": <Number>,
 *        "q1": <Number>,
 *        "median": <Number>,
 *        "q3": <Number>,
 *        "max": <Number>
 *      }
 *     }
 *  ]
 *
 */
function initFacets(trackToFilter: {
  getFilterableAttributes: () => any;
  getInViewFeatures: () => any;
}): FacetAttributes[] {
  // Populate facets model, except for filterNames array values
  const headInfo = trackToFilter.getFilterableAttributes();
  const rawDimensions = Object.keys(headInfo);

  const facetOrder = ['VT', 'AF', 'AFR_AF', 'AMR_AF', 'EAS_AF', 'EUR_AF', 'SAS_AF', 'DP', 'AA', 'AC'];

  const dimensions = rawDimensions.slice().sort((a, b) => {
    const indexA = facetOrder.indexOf(a);
    const indexB = facetOrder.indexOf(b);
    if (indexA === -1) return 100000;
    if (indexB === -1) return -100000;
    return indexA - indexB;
  });

  const facets: FacetAttributes[] = [];
  for (const dimension of dimensions) {
    const igvFacet = headInfo[dimension];
    // string, flag, integer, or float
    const igvType = igvFacet.Type.toLowerCase();
    const type = ['string', 'flag'].includes(igvType) ? 'categorical' : igvType;
    const description = getRefinedDescription(igvFacet, dimension);
    if (type === 'categorical') {
      const facet: CategoricalFacetAttributes = {
        name: dimension,
        type: 'categorical',
        description,
        filterNames: [],
        countsByFilterName: {},
      };
      facets.push(facet);
    } else {
      const facet: NumericFacetAttributes = {
        name: dimension,
        type,
        description,
        filterNumbers: [],
      };
      facets.push(facet);
    }
  }

  // Populate features, and (for each facet) filterNames
  const featuresInFrame = trackToFilter.getInViewFeatures();

  for (const igvFeature of featuresInFrame) {
    const info = igvFeature.info;

    for (const facet of facets) {
      const facetName = facet.name;

      // Not all features will have all facets
      if (facetName in info) {
        const rawValue = info[facetName];
        if (facet.type === 'categorical') {
          if (rawValue === 'SNP,INDEL') {
            // IGV doesn't render features with variant type "SNP,INDEL"
            continue;
          }
          // Type guard to ensure facet has filterNames
          if ('filterNames' in facet && !facet.filterNames.includes(rawValue)) {
            // Populate filterNames
            facet.filterNames.push(rawValue);
            facet.countsByFilterName[rawValue] = 0;
          }
          if ('countsByFilterName' in facet) {
            facet.countsByFilterName[rawValue] += 1;
          }
        } else {
          const isFloat = facet.type === 'float';
          const value = isFloat ? Number.parseFloat(rawValue) : Number.parseInt(rawValue);
          if ('filterNumbers' in facet) {
            facet.filterNumbers.push(value);
          }
        }
      }
    }
  }

  // Populate statistics for numeric facets
  for (const facet of facets) {
    if (facet.type !== 'categorical') {
      const { min, q1, median, q3, max, mean, quantiles } = getStatistics(facet.filterNumbers);
      facet.statistics = { min, q1, median, q3, max, mean, quantiles };
    }
  }
  return facets;
}

interface IGVFiltersProps {
  trackToFilter: {
    filter: (igvFeature: any) => boolean;
    getFilterableAttributes: () => any;
    getInViewFeatures: () => any;
  };
  currentSelections?: { [facetName: string]: any };
  currentFacets?: FacetAttributes[];
  isInitialized?: boolean;
  setIsInitialized?: (initialized: boolean) => void;
  isLoading?: boolean;
  containerSelector?: string;
  onFilterChange?: (selections: { [facetName: string]: any }, facets: FacetAttributes[]) => void;
  onFacetsUpdate?: (facets: FacetAttributes[], selections: { [facetName: string]: any }) => void;
}

const IGVFilters: React.FC<IGVFiltersProps> = ({
  trackToFilter,
  currentSelections = {},
  currentFacets = [],
  isInitialized = false,
  setIsInitialized,
  isLoading: parentIsLoading = false,
  onFilterChange,
  onFacetsUpdate,
}) => {
  const [facets, setFacets] = useState<FacetAttributes[]>([]);
  const [selections, setSelections] = useState<{ [facetName: string]: any }>({});
  const [localIsLoading, setLocalIsLoading] = useState(true);
  const isLoading = parentIsLoading || localIsLoading;
  const prevTrackRef = useRef(trackToFilter); // Track previous track

  // Initialize facets when trackToFilter changes
  useEffect(() => {
    if (!trackToFilter) {
      setLocalIsLoading(false);
      return;
    }

    if (!isInitialized) {
      const initializeFacets = () => {
        setLocalIsLoading(true);

        // Check if we have saved state
        const hasSavedState = currentFacets.length > 0 && Object.keys(currentSelections).length > 0;

        let initializedFacets: FacetAttributes[];
        let initialSelections: { [facetName: string]: any };

        if (hasSavedState) {
          // Restore from saved state (panel reopened at same locus)
          initializedFacets = currentFacets;
          initialSelections = currentSelections;
        } else {
          // Initialize fresh from track data (locus change or first open)
          initializedFacets = initFacets(trackToFilter);

          // Initialize selections with default values
          initialSelections = {};
          for (const facet of initializedFacets) {
            if (facet.type === 'categorical') {
              initialSelections[facet.name] = [...facet.filterNames];
            } else {
              initialSelections[facet.name] = [['between', [facet.statistics?.min || 0, facet.statistics?.max || 0]]];
            }
          }
        }

        setFacets(initializedFacets);
        setSelections(initialSelections);

        // Update the previous track reference
        prevTrackRef.current = trackToFilter;

        if (setIsInitialized) {
          setIsInitialized(true);
        }

        // Schedule parent notification for after render completes
        setTimeout(() => {
          if (onFacetsUpdate) {
            onFacetsUpdate(initializedFacets, initialSelections);
          }
        }, 0);
        setLocalIsLoading(false);
      };

      initializeFacets();
    } else if (currentFacets.length > 0 && facets.length === 0) {
      // If already initialized but local state is empty, restore from props
      setFacets(currentFacets);
      setSelections(currentSelections);
      setLocalIsLoading(false);
    } else {
      // Already initialized and has local state
      setLocalIsLoading(false);
    }
  }, [trackToFilter, onFacetsUpdate, isInitialized, setIsInitialized, currentFacets, currentSelections, facets.length]);

  // Update filter counts when filters are initially loaded or when the genomic location changes
  useEffect(() => {
    if (facets.length > 0 && isInitialized) {
      // Only run after initialization is complete
      const updatedFacets = updateFilterCounts(trackToFilter, facets);

      // Avoid redundant state updates by checking if facets have actually changed
      setFacets((prevFacets) => {
        const hasCountsChanged = updatedFacets.some((updatedFacet, index) => {
          const originalFacet = prevFacets[index];
          if (updatedFacet.type === 'categorical' && originalFacet.type === 'categorical') {
            return JSON.stringify(updatedFacet.countsByFilterName) !== JSON.stringify(originalFacet.countsByFilterName);
          }
          return false; // Only categorical facets need count updates
        });

        return hasCountsChanged ? updatedFacets : prevFacets;
      });
    }
  }, [facets, isInitialized, trackToFilter]);

  const handleFacetChange = useCallback(
    (facetName: string, newSelection: any) => {
      setSelections((prev) => {
        const updatedSelections = { ...prev, [facetName]: newSelection };

        const newFilter = buildFilter(updatedSelections, facets);
        trackToFilter.filter = newFilter;
        // Update filter counts
        const updatedFacets = updateFilterCounts(trackToFilter, facets);
        setFacets(updatedFacets);

        // Schedule parent notifications for after render completes
        setTimeout(() => {
          if (onFilterChange) {
            onFilterChange(updatedSelections, updatedFacets);
          }

          if (onFacetsUpdate) {
            onFacetsUpdate(updatedFacets, updatedSelections);
          }
        }, 0);

        return updatedSelections;
      });
    },
    [facets, trackToFilter, onFilterChange, onFacetsUpdate]
  );

  if (isLoading) {
    // Show a loading message while facets are being initialized
    return div({ style: { padding: '1em', fontStyle: 'italic', color: '#666' } }, ['Loading facets...']);
  }

  if (facets.length === 0) {
    // Show a "No facets available" message if there are no facets after loading
    return div({ style: { padding: '1em', fontStyle: 'italic', color: '#666' } }, ['No facets available to display.']);
  }

  const renderedFacets = facets
    .filter(isValidFacet) // Clean filter
    .map((facet) => {
      if (facet.type === 'categorical') {
        return React.createElement(CategoricalFacet, {
          key: facet.name,
          facet,
          selection: selections[facet.name] || [],
          onChange: (newSelection: string[]) => handleFacetChange(facet.name, newSelection),
        });
      }
      return React.createElement(NumericFacet, {
        key: facet.name,
        facet,
        selection: selections[facet.name],
        onChange: (newSelection: any[]) => handleFacetChange(facet.name, newSelection),
      });
    });

  if (renderedFacets.length === 0) {
    // If no facets are displayable, show a message
    return div({ style: { padding: '1em', fontStyle: 'italic', color: '#666' } }, ['No facets available to display.']);
  }

  return div({ className: 'igv-filters-container', style: igvStyles.igvFiltersContainer }, renderedFacets);
};

/**
 * Build a filter function taking an igvFeature as an argument and returning true for "pass" (show feature),
 * or false for fail (hide feature)
 *
 * @param selection - The currently selected values for all filter facets
 * @param facets - List of objects describing filter facets
 *
 * @returns {(function(*): (boolean))|*}
 */
function buildFilter(
  selection: { [x: string]: any },
  facets: FacetAttributes[]
): (igvFeature: { info: any }) => boolean {
  return (igvFeature: { info: any }) => {
    const info = igvFeature.info;

    for (const facet of facets) {
      const facetName = facet.name;
      if (facetName in selection && facetName in info) {
        const rawValue = info[facetName];
        const facetSelection = selection[facetName];

        if (facet.type === 'categorical') {
          if (!facetSelection.includes(rawValue)) {
            return false;
          }
        } else {
          const parser = facet.type === 'float' ? Number.parseFloat : Number.parseInt;
          const value = parser(rawValue);

          if (Number.isNaN(value)) continue; // Skip invalid numeric values

          const op = facetSelection[0][0];
          const selectionValues = facetSelection[0][1];
          switch (op) {
            case 'between': {
              const v1 = parser(selectionValues[0]);
              const v2 = parser(selectionValues[1]);
              if (value < v1 || value > v2) {
                return false;
              }
              break;
            }
            case 'not between': {
              const nv1 = parser(selectionValues[0]);
              const nv2 = parser(selectionValues[1]);
              if (value >= nv1 && value <= nv2) {
                return false;
              }
              break;
            }
            case '=': {
              if (value !== parser(selectionValues[0])) {
                return false;
              }
              break;
            }
            case '!=': {
              if (value === parser(selectionValues[0])) {
                return false;
              }
              break;
            }
            case '<': {
              if (value >= parser(selectionValues[0])) {
                return false;
              }
              break;
            }
            case '<=': {
              if (value > parser(selectionValues[0])) {
                return false;
              }
              break;
            }
            case '>': {
              if (value <= parser(selectionValues[0])) {
                return false;
              }
              break;
            }
            case '>=': {
              if (value < parser(selectionValues[0])) {
                return false;
              }
              break;
            }
            default:
              // Unknown operator, skip
              break;
          }
        }
      }
    }
    return true; // All filters passed
  };
}

/** Get counts for each filter, in each facet */
function updateFilterCounts(
  trackToFilter: { getInViewFeatures: () => any[] },
  facets: FacetAttributes[]
): FacetAttributes[] {
  const featuresInView = trackToFilter.getInViewFeatures();

  // Create updated facets with fresh counts
  const updatedFacets: FacetAttributes[] = facets.map((facet) => {
    if (facet.type === 'categorical') {
      // Reset categorical counts
      const updatedFacet: CategoricalFacetAttributes = {
        ...facet,
        countsByFilterName: {},
      };

      // Initialize all filter names with 0 count
      for (const filterName of facet.filterNames) {
        updatedFacet.countsByFilterName[filterName] = 0;
      }

      return updatedFacet;
    }

    return facet;
  });

  // Loop through features counting by filter
  for (const igvFeature of featuresInView) {
    const info = igvFeature.info;

    for (const facet of updatedFacets) {
      const facetName = facet.name;
      // Not all features will have all facets
      if (facetName in info) {
        const rawValue = info[facetName];
        if (facet.type === 'categorical') {
          if (rawValue in facet.countsByFilterName) {
            facet.countsByFilterName[rawValue] += 1;
          }
        } else {
          const isFloat = facet.type === 'float';
          const value = isFloat ? Number.parseFloat(rawValue) : Number.parseInt(rawValue);
          if (!Number.isNaN(value)) {
            facet.filterNumbers.push(value);
          }
        }
      }
    }
  }

  // Recalculate statistics for numeric facets
  for (const facet of updatedFacets) {
    if (facet.type !== 'categorical' && facet.filterNumbers.length > 0) {
      const { min, q1, median, q3, max, mean, quantiles } = getStatistics(facet.filterNumbers);
      facet.statistics = { min, q1, median, q3, max, mean, quantiles };
    }
  }
  return updatedFacets;
}

export const getHistogramBars = (facet: NumericFacetAttributes): HistogramBarAttributes[] => {
  if (!facet.statistics?.quantiles) return [];

  const bars = [...facet.statistics.quantiles]; // Create a copy to avoid mutation
  const maxCount = Math.max(...bars, 1);

  const maxValue = facet.statistics.max;
  const minValue = facet.statistics.min;
  const numBins = bars.length;
  const binSize = (maxValue - minValue) / numBins;

  const processedBars: HistogramBarAttributes[] = [];
  for (let i = 0; i < numBins; i++) {
    const start = minValue + binSize * i;
    const end = minValue + binSize * (i + 1);
    processedBars.push({
      count: bars[i],
      start,
      end,
    });
  }

  // Convert to display attributes
  const barRectAttrs: HistogramBarAttributes[] = [];
  processedBars.forEach((bar, i) => {
    const height = HISTOGRAM_BAR_MAX_HEIGHT * (bar.count / maxCount);
    const width = 11;
    const attrs = {
      x: (width + 1) * i,
      y: HISTOGRAM_BAR_MAX_HEIGHT - height + 1,
      width,
      height,
      color: '#3D5A87',
      ...bar,
    };
    barRectAttrs.push(attrs);
  });

  return barRectAttrs;
};

export { IGVFilters, buildFilter, initFacets };
