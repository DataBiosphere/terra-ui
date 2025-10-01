import * as d3 from 'd3';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { a, div, h, input, label, rect, span, svg } from 'react-hyperscript-helpers';

import { Select } from '../common';
import { TextInput } from '../input';

const igvStyles = {
  igvFiltersContainer: {
    float: 'left' as const,
    marginLeft: '5px',
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
  igvPopulationAfToggle: {
    color: '#337ab7',
    cursor: 'pointer' as const,
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

declare global {
  interface Window {
    IGVFilter: any;
  }
}

window.IGVFilter = {};

const HISTOGRAM_BAR_MAX_HEIGHT = 20;
const SLIDER_HANDLEBAR_WIDTH = 6;
// const HANDLEBAR_Y = -1 * (HISTOGRAM_BAR_MAX_HEIGHT - 1);
const HISTOGRAM_WIDTH = 240;
const defaultNumericInputWidth = 55;

type HistogramBarAttributes = {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  color?: string;
  count: number;
  start: number;
  end: number;
  isNull?: boolean;
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
  between: 95,
  'not between': 120,
  '=': 65,
  '!=': 65,
  '<': 65,
  '<=': 65,
  '>': 65,
  '>=': 65,
};

function updateIgvFilterOperator(event: { target: any }) {
  const target = event.target;

  const facetName = (target as HTMLElement).getAttribute('data-igv-facet-name');
  const facetClass = getFacetClass(facetName ?? '');
  const input = document.querySelector(`.${facetClass} input`);

  const newOperator = target.value as keyof typeof widthsByOperator;

  target.setAttribute('value', newOperator);
  const width = widthsByOperator[newOperator];
  target.style.width = `${width}px`;

  const andInput2Style = getAndInput2Style(newOperator);
  target.parentElement.querySelector('.igv-and-input-2').style = andInput2Style;

  const changeEvent = new Event('change');
  if (input) {
    input.dispatchEvent(changeEvent);
  }
}

window.IGVFilter.updateIgvFilterOperator = updateIgvFilterOperator;

/** Get D3 scale to convert between numeric facet values and pixels */
export function getXScale(bars: HistogramBarAttributes[], histogramWidth: number, hasNull: boolean | undefined) {
  hasNull = false; // TODO: Parameterize

  const barStartIndex = hasNull ? 2 : 0;
  const valueDomain: number[] = [];
  const pxRange: number[] = [];
  for (let i = barStartIndex; i < bars.length; i++) {
    const bar = bars[i];
    valueDomain.push(bar.start);
    const x = (bar.x ?? 0) + (hasNull ? 0 : SLIDER_HANDLEBAR_WIDTH + 2);
    pxRange.push(x);
  }
  const lastBar = bars.slice(-1)[0];
  valueDomain.push(lastBar.end);
  pxRange.push(histogramWidth + (hasNull ? 0 : SLIDER_HANDLEBAR_WIDTH));

  const xScale = d3.scaleLinear(valueDomain, pxRange);
  return xScale;
}

/** Get container offsets for brush */
function getSliderStyle(bars: HistogramBarAttributes[], histogramWidth: number) {
  const barWidth = bars[0]?.width ?? 0;
  const hasNull = bars[0]?.isNull ?? false;

  const sliderLeft = hasNull ? 0 : -1 * (SLIDER_HANDLEBAR_WIDTH + 1);
  const sliderWidth = histogramWidth + (hasNull ? barWidth : 2 * SLIDER_HANDLEBAR_WIDTH + 2);

  const extentStartX = hasNull ? 2 * barWidth + 2 : SLIDER_HANDLEBAR_WIDTH + 2;
  const extentWidth = hasNull ? histogramWidth : histogramWidth + SLIDER_HANDLEBAR_WIDTH;

  return [sliderLeft, sliderWidth, extentStartX, extentWidth];
}

/** Return new values from D3 brush selection */
// function parseValuesFromBrushSelection(brushSelection: number[], xScale: any, precision: number) {
//   const extent = brushSelection.map(xScale.invert);
//   const newValue1 = round(extent[0], precision);
//   const newValue2 = round(extent[1], precision);
//   return [newValue1, newValue2];
// }

/** Handle slider move event (i.e., drag or resize) */
// function handleBrushMove(event: any, xScale: any, facet: any) {
//   const brushSelection = event.selection;

//   if (!brushSelection) {
//     return;
//   }

//   const precision = getPrecision(facet);

//   const [newValue, newValue2] = parseValuesFromBrushSelection(brushSelection, xScale, precision);

//   const max = facet.statistics?.max || 0;
//   const min = facet.statistics?.min || 0;

//   if (
//     newValue > max ||
//     newValue < min ||
//     newValue2 > max ||
//     newValue2 < min ||
//     Number.isNaN(newValue) ||
//     Number.isNaN(newValue2)
//   ) {
//     // Prevent handlebar misdisplay if crosshair-select moves out-of-bounds
//     return null;
//   }

//   return {
//     newRange: [Math.min(newValue, newValue2), Math.max(newValue, newValue2)] as [number, number],
//     brushSelection,
//     handlebarTransforms: [getHandlebarTranslate(brushSelection[0]), getHandlebarTranslate(brushSelection[1])],
//   };
// }

/** Handle slider move event (i.e., drag or resize) */
// function handleBrushEnd(event: any, facet: any) {
//   const brushSelection = event.selection;
//   if (!brushSelection) {
//     return;
//   }

//   const facetClass = getFacetClass(facet);
//   const input = document.querySelector(`.${facetClass} input`);
//   if (!input) return;

//   const changeEvent = new Event('change');
//   input.dispatchEvent(changeEvent);
// }

// function getHandlebarTranslate(x: number) {
//   return `translate(${x}, ${HANDLEBAR_Y})`;
// }

function getQuantiles(sortedNumbers: number[], max: number, min: number, numBins = 15) {
  const size = (max - min) / numBins;
  const quantiles = new Array(numBins).fill(0);

  for (let i = 1; i < numBins + 1; i++) {
    const prevBinNum = min + (i - 1) * size;
    const binNum = min + i * size;
    for (let j = 0; j < sortedNumbers.length; j++) {
      const num = sortedNumbers[j];
      if (prevBinNum < num && num <= binNum) {
        quantiles[i - 1] += 1;
      }
    }
  }

  return quantiles;
}

function getStatistics(numbers: number[]) {
  // Sort the array in ascending order
  numbers.sort((a, b) => a - b);

  // Compute the sum using a loop for faster mean calculation
  let sum = 0;
  for (let i = 0; i < numbers.length; i++) {
    sum += numbers[i];
  }
  const mean = sum / numbers.length;

  const max = numbers[numbers.length - 1];
  const min = numbers[0];
  const median = getMedian(numbers);

  // Divide the array into two halves
  const midIndex = Math.floor(numbers.length / 2);
  const lowerHalf = numbers.slice(0, midIndex);
  const upperHalf = numbers.length % 2 === 0 ? numbers.slice(midIndex) : numbers.slice(midIndex + 1);

  const q1 = getMedian(lowerHalf);
  const q3 = getMedian(upperHalf);

  const quantiles = getQuantiles(numbers, max, min);

  return { min, q1, median, q3, max, mean, quantiles };
}

/**
 * Get SVG for handlebar UI, as an affordance for resizing
 *
 * Inspired by https://crossfilter.github.io/crossfilter
 */
// function getHandlebarPath(d: { type: any }) {
//   const sweepFlag = d.type === 'e' ? 1 : 0;
//   const x = sweepFlag ? 1 : -1;
//   const y = HISTOGRAM_BAR_MAX_HEIGHT - 0.5;
//   const width = SLIDER_HANDLEBAR_WIDTH;

//   // Construct an SVG arc
//   // Docs: https://developer.mozilla.org/en-US/docs/Web/SVG/Tutorial/Paths#arcs
//   const start = `M${0.5 * x},${y}`;
//   const rx = width;
//   const ry = width;
//   const xAxisRotation = 0;
//   const largeArcFlag = 0;
//   const arc1X = (width + 0.5) * x;
//   const arc1Y = y + 6;
//   const arc1EndLine = `V${2 * y - width}`;
//   const arc2X = 0.5 * x;
//   const arc2Y = 2 * y;
//   const arc1 = `A${rx},${ry} ${xAxisRotation} ${largeArcFlag} ${sweepFlag} ${arc1X},${arc1Y}`;
//   const arc2 = `A${rx},${ry} ${xAxisRotation} ${largeArcFlag} ${sweepFlag} ${arc2X},${arc2Y}`;

//   /* eslint-disable */
//     // Each handlebar has two vertical lines in it, resembling notched grooves
//     const notches = (
//         "M" + (2.5 * x) + "," + (y + (width + 2)) +
//         "V" + (2 * y - (width + 2)) +
//         "M" + (4.5 * x) + "," + (y + (width + 2)) +
//         "V" + (2 * y - (width + 2))
//     )
//     /* eslint-enable */

//   /* eslint-disable */
//     return (
//         start +
//         arc1 +
//         arc1EndLine +
//         arc2 +
//         "Z" +
//         notches
//     )
//     /* eslint-enable */
// }

function getMedian(numbers: number[]) {
  const midIndex = Math.floor(numbers.length / 2);

  // If the array has an odd length, return the middle number
  if (numbers.length % 2 !== 0) {
    return numbers[midIndex];
  }

  // If the array has an even length, return the average of the two middle numbers
  return (numbers[midIndex - 1] + numbers[midIndex]) / 2;
}

// /** Expand or contract a full list of filters within a categorical facet */
function togglePartialCollapse(event: any) {
  const target = event.target;
  if (!target) return;
  const attrName = 'data-igv-is-partly-collapsed';
  const oldIsPartlyCollapsed = target.getAttribute(attrName) === 'true';
  const newIsPartlyCollapsed = !oldIsPartlyCollapsed;
  const facetName = (target as HTMLElement).getAttribute('data-igv-facet-name');

  const filterSel = `.igv-filter[data-igv-facet-name="${facetName}"]`;
  document.querySelectorAll(filterSel).forEach((checkbox, i) => {
    const parent = checkbox.parentElement;
    if (!parent || !parent.parentElement) return;
    const filterDom = parent.parentElement;
    if (newIsPartlyCollapsed && i >= 5) {
      // TODO: Consider optimizing by batching DOM writes
      filterDom.style.display = 'none';
    } else {
      filterDom.style.display = '';
    }
  });

  const toggler = document.querySelector('.igv-facet-toggle');
  if (toggler) {
    toggler.setAttribute(attrName, String(newIsPartlyCollapsed));
    const action = newIsPartlyCollapsed ? 'More...' : 'Less...';
    toggler.textContent = action;
  }
}

window.IGVFilter.togglePartialCollapse = togglePartialCollapse;

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

/** Add or remove all checked item from list */
function handleFacetCheckboxChange(event: Event) {
  const target = event.target as HTMLInputElement;
  if (!target) return;

  const facetName = target.getAttribute('data-igv-facet-name');
  const isChecked = target.checked;
  const selector = `.igv-filter[data-igv-facet-name="${facetName}"]`;
  const filterCheckboxes = document.querySelectorAll(selector);
  filterCheckboxes.forEach((filterCheckbox) => {
    (filterCheckbox as HTMLInputElement).checked = isChecked;
  });
  const changeEvent = new Event('change');
  (filterCheckboxes[0] as HTMLInputElement).dispatchEvent(changeEvent);
}

// Enable calling via standard DOM onChange API
window.IGVFilter.handleFacetCheckboxChange = handleFacetCheckboxChange;

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

  // Categorical facets need > 1 filter to be useful
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
              onChange: (e) => handleCheckboxChange(filterName, e.target.checked),
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

function getAndInput2Style(operator: string) {
  let andInput2Style = '';
  if (!['between', 'not between'].includes(operator)) {
    andInput2Style = 'display: none';
  }
  return andInput2Style;
}

/**
 * Round, source: https://stackoverflow.com/a/18358056
 *
 * @param {number} val
 * @param {number} [precision]
 * @return {number}
 */
function round(val: number, precision = 0) {
  return +`${Math.round(+`${val}e+${precision}`)}e-${precision}`;
}

/**
 * Get width and font size for input, to help keep full value glanceable
 */
function getInputStyle(inputValue, operator, precision) {
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
  };

  return style;
}

// TODO add types?
/** Make big input numbers fit on one more more often */
function getResponsiveStyles(inputValue, inputValue2, operator, precision) {
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

// /** Expand or contract list of population-level allele frequency facets */
function toggleAfCollapse(event: { target: any }) {
  const target = event.target;
  const attrName = 'data-igv-is-af-collapsed';
  const oldIsAfCollapsed = target.getAttribute(attrName) === 'true';
  const newIsAfCollapsed = !oldIsAfCollapsed;

  const facetSel = '.igv-facet-population-af';
  document.querySelectorAll(facetSel).forEach((facetDom) => {
    if (newIsAfCollapsed) {
      (facetDom as HTMLElement).style.display = 'none';
    } else {
      (facetDom as HTMLElement).style.display = '';
    }
  });

  const afToggler = document.querySelector('.igv-population-af-toggle');
  if (afToggler) {
    afToggler.setAttribute(attrName, String(newIsAfCollapsed));
    const action = newIsAfCollapsed ? 'Show' : 'Hide';
    afToggler.textContent = `${action} by population`;
  }
}

window.IGVFilter.toggleAfCollapse = toggleAfCollapse;

// Small, focused component for the histogram
const Histogram: React.FC<{
  bars: HistogramBarAttributes[];
  width: number;
  height: number;
}> = ({ bars, width, height }) => {
  return svg(
    {
      height,
      width,
      style: { borderBottom: '1px solid #AAA' },
      className: 'numeric-filter-histogram',
    },
    [
      ...bars.map((bar, index) =>
        rect({
          key: index,
          fill: bar.color,
          x: bar.x,
          y: bar.y,
          width: bar.width,
          height: bar.height,
        })
      ),
    ]
  );
};

const HistogramSlider: React.FC<{
  facet: NumericFacetAttributes;
  brushSelection: [number, number];
  sliderConfig: any;
  xScale: any;
  onRangeChange?: (range: [number, number]) => void;
  onRangeChangeEnd?: (range: [number, number]) => void;
}> = ({ facet, brushSelection, sliderConfig, xScale, onRangeChange, onRangeChangeEnd }) => {
  const [currentRange, setCurrentRange] = useState<[number, number]>(brushSelection);
  const [isDragging, setIsDragging] = useState<'left' | 'right' | null>(null);
  const sliderRef = useRef<HTMLDivElement>(null);
  const { sliderLeft, sliderWidth } = sliderConfig;

  const handleMouseDown = useCallback(
    (handle: 'left' | 'right') => (e: React.MouseEvent) => {
      e.preventDefault();
      setIsDragging(handle);
    },
    []
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging || !sliderRef.current) return;

      const rect = sliderRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const value = xScale.invert(x);

      // Clamp to bounds
      const min = facet.statistics?.min || 0;
      const max = facet.statistics?.max || 100;
      const clampedValue = Math.max(min, Math.min(max, value));

      const newRange: [number, number] = [...currentRange];
      if (isDragging === 'left') {
        newRange[0] = Math.min(clampedValue, currentRange[1]);
      } else {
        newRange[1] = Math.max(clampedValue, currentRange[0]);
      }

      setCurrentRange(newRange);
      onRangeChange?.(newRange);
    },
    [isDragging, currentRange, xScale, facet.statistics, onRangeChange]
  );

  const handleMouseUp = useCallback(() => {
    if (isDragging) {
      setIsDragging(null);
      onRangeChangeEnd?.(currentRange);
    }
  }, [isDragging, currentRange, onRangeChangeEnd]);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const leftPosition = xScale(currentRange[0]);
  const rightPosition = xScale(currentRange[1]);

  return div([
    div(
      {
        ref: sliderRef,
        style: {
          position: 'absolute',
          top: 0,
          left: `${sliderLeft}px`,
          width: `${sliderWidth}px`,
          height: `${HISTOGRAM_BAR_MAX_HEIGHT}px`,
        },
      },
      [
        // Selection area
        div({
          style: {
            position: 'absolute',
            left: `${leftPosition}px`,
            width: `${rightPosition - leftPosition}px`,
            height: '100%',
            backgroundColor: 'rgba(61, 90, 135, 0.2)',
            border: '1px solid #3d5a87',
            borderLeft: 'none',
            borderRight: 'none',
            pointerEvents: 'none', // Allow clicks to pass through to handles
          },
        }),

        // Left handle
        div({
          style: {
            position: 'absolute',
            left: `${leftPosition - 6}px`,
            top: '-2px',
            width: '16px',
            height: `${HISTOGRAM_BAR_MAX_HEIGHT + 4}px`,
            backgroundColor: '#EEE',
            cursor: 'ew-resize',
            borderRadius: '4px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)', // Add shadow for visibility
          },
          onMouseDown: handleMouseDown('left'),
        }),

        // Right handle
        div({
          style: {
            position: 'absolute',
            left: `${rightPosition - 8}px`, // Wider handle
            top: '-2px',
            width: '16px', // Wider
            height: `${HISTOGRAM_BAR_MAX_HEIGHT + 4}px`, // Taller
            backgroundColor: '#EEE',
            border: '2px solid #3d5a87', // Thicker border with blue color
            cursor: 'ew-resize',
            borderRadius: '4px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)', // Add shadow for visibility
          },
          onMouseDown: handleMouseDown('right'),
        }),

        // Left handle grip lines
        div({
          style: {
            position: 'absolute',
            left: `${leftPosition - 4}px`,
            top: `${HISTOGRAM_BAR_MAX_HEIGHT / 2 - 4}px`,
            width: '2px',
            height: '8px',
            backgroundColor: '#666',
            pointerEvents: 'none',
          },
        }),
        div({
          style: {
            position: 'absolute',
            left: `${leftPosition - 1}px`,
            top: `${HISTOGRAM_BAR_MAX_HEIGHT / 2 - 4}px`,
            width: '2px',
            height: '8px',
            backgroundColor: '#666',
            pointerEvents: 'none',
          },
        }),

        // Right handle grip lines
        div({
          style: {
            position: 'absolute',
            left: `${rightPosition - 4}px`,
            top: `${HISTOGRAM_BAR_MAX_HEIGHT / 2 - 4}px`,
            width: '2px',
            height: '8px',
            backgroundColor: '#666',
            pointerEvents: 'none',
          },
        }),
        div({
          style: {
            position: 'absolute',
            left: `${rightPosition - 1}px`,
            top: `${HISTOGRAM_BAR_MAX_HEIGHT / 2 - 4}px`,
            width: '2px',
            height: '8px',
            backgroundColor: '#666',
            pointerEvents: 'none',
          },
        }),
      ]
    ),
  ]);
};

const prepareNumericFacetData = (facet: NumericFacetAttributes) => {
  if (facet.filterNumbers.length === 0 || !facet.statistics || facet.statistics.min === facet.statistics.max) {
    return null; // Invalid facet
  }

  const inputValue = facet.statistics?.min;
  const inputValue2 = facet.statistics?.max;
  const operator = 'between';
  const precision: number = getPrecision(facet);
  const histogramWidth = HISTOGRAM_WIDTH;
  const histogramHeight = HISTOGRAM_BAR_MAX_HEIGHT;

  const bars = getHistogramBars(facet);
  const xScale = getXScale(bars, histogramWidth, false);
  const brushSelection = [inputValue, inputValue2].map(xScale);
  const styles = getResponsiveStyles(inputValue, inputValue2, operator, precision);
  const [sliderLeft, sliderWidth, extentStartX, extentWidth] = getSliderStyle(bars, histogramWidth);

  return {
    bars,
    xScale,
    brushSelection,
    styles,
    operator,
    precision,
    histogramWidth,
    histogramHeight,
    sliderConfig: { sliderLeft, sliderWidth, extentStartX, extentWidth },
    inputValue,
    inputValue2,
  };
};

const NumericFacet: React.FC<{
  facet: NumericFacetAttributes;
  // selection: any[];
  onChange: (selection: any[]) => void;
}> = ({ facet, onChange }) => {
  const [currentRange, setCurrentRange] = useState<[number, number] | null>(null);
  const [operator, setOperator] = useState<string>('between'); // Add operator state

  const facetData = useMemo(() => prepareNumericFacetData(facet), [facet]);

  // Initialize current range from facet statistics
  useEffect(() => {
    if (facetData && !currentRange) {
      const initialRange: [number, number] = [facetData.inputValue, facetData.inputValue2];
      setCurrentRange(initialRange);
    }
  }, [facetData, currentRange]);

  const handleOperatorChange = useCallback(
    (event: any) => {
      const newOperator = event.value;
      setOperator(newOperator);

      // Trigger onChange with new operator
      if (currentRange) {
        onChange([[newOperator, currentRange]]);
      }
    },
    [currentRange, onChange]
  );

  const handleRangeChange = useCallback((newRange: [number, number]) => {
    setCurrentRange(newRange);
  }, []);

  const handleRangeChangeEnd = useCallback(
    (newRange: [number, number]) => {
      setCurrentRange(newRange);
      onChange([['between', newRange]]);
    },
    [onChange]
  );

  const handleInputChange = useCallback(
    (index: number, value: string) => {
      if (!currentRange) return;

      const newRange: [number, number] = [...currentRange] as [number, number];
      newRange[index] = parseFloat(value) || 0;

      setCurrentRange(newRange);
      onChange([['between', newRange]]);
    },
    [currentRange, onChange]
  );

  if (!facetData) {
    return null;
  }

  const { bars, xScale, styles, histogramWidth, histogramHeight, sliderConfig } = facetData;

  const friendlyName = getFriendlyFacetName(facet);
  const isPopulationAf = facet.name.endsWith('_AF');
  const isGeneralAf = facet.name === 'AF';

  const displayRange = currentRange || [facetData.inputValue, facetData.inputValue2];

  return div(
    {
      className: `igv-facet igv-facet-${facet.name} igv-facet-numeric`,
      style: {
        ...igvStyles.igvFacet,
        display: isPopulationAf ? 'none' : 'block',
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

      // Histogram container
      div({ style: { position: 'relative' } }, [
        h(Histogram, {
          bars,
          width: histogramWidth,
          height: histogramHeight,
        }),
        h(HistogramSlider, {
          facet,
          brushSelection: displayRange,
          sliderConfig,
          xScale,
          onRangeChange: handleRangeChange,
          onRangeChangeEnd: handleRangeChangeEnd,
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
            // flexWrap: 'nowrap',
            width: `${histogramWidth}px`,
            maxWidth: `${histogramWidth}px`,
            minHeight: '24px',
          },
        },
        [
          h(Select, {
            value: operator,
            onChange: handleOperatorChange,
            style: {
              width: `${widthsByOperator[operator] || 85}px`,
              fontSize: '13px',
              height: 'auto',
              padding: '1px 2px',
              // flexShrink: 0,
            },
            options: ['between', 'not between', '=', '!=', '<', '<=', '>', '>='].map((op) => ({
              value: op,
              label: op,
            })),
          }),

          h(TextInput, {
            className: 'igv-numeric-query-input igv-numeric-query-input-value',
            value: displayRange[0],
            onChange: (e) => handleInputChange(0, e.target.value),
            style: {
              ...styles.input,
              // flexShrink: 0,
              width: '55px',
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
            h(TextInput, {
              className: 'igv-numeric-query-input igv-numeric-query-input-value2',
              value: displayRange[1],
              onChange: (e) => handleInputChange(1, e.target.value),
              style: {
                ...styles.input2,
                width: '55px',
                fontSize: '13px',
              },
            }),
        ]
      ),

      // Population toggle if needed
      isGeneralAf &&
        div(
          {
            className: 'igv-population-af-toggle',
            onClick: toggleAfCollapse,
            style: igvStyles.igvPopulationAfToggle,
          },
          ['Show by population']
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
 *       "displayName": <String>, // e.g. "Variant type" TODO
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

  const dimensions = rawDimensions.sort((a, b) => {
    const indexA = facetOrder.indexOf(a);
    const indexB = facetOrder.indexOf(b);
    if (indexA === -1) return 100000;
    if (indexB === -1) return -100000;
    return indexA - indexB;
  });

  const facets: FacetAttributes[] = [];
  dimensions.forEach((dimension) => {
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
        filterNumbers: [], // TODO should i make statistics required and initialize it with some values?
      };
      facets.push(facet);
    }
  });

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
          const value = isFloat ? parseFloat(rawValue) : parseInt(rawValue);
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
  containerSelector?: string;
  onFilterChange?: (selections: { [facetName: string]: any }, facets: FacetAttributes[]) => void;
  onFacetsUpdate?: (facets: FacetAttributes[], track: any) => void;
}

const IGVFilters: React.FC<IGVFiltersProps> = ({ trackToFilter, onFilterChange, onFacetsUpdate }) => {
  const [facets, setFacets] = useState<FacetAttributes[]>([]);
  const [selections, setSelections] = useState<{ [facetName: string]: any }>({});
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize facets when trackToFilter changes
  useEffect(() => {
    if (trackToFilter) {
      const initializeFacets = () => {
        const initializedFacets = initFacets(trackToFilter);
        setFacets(initializedFacets);

        // Initialize selections with default values
        const initialSelections: { [facetName: string]: any } = {};
        initializedFacets.forEach((facet) => {
          if (facet.type === 'categorical') {
            initialSelections[facet.name] = [...facet.filterNames]; // All selected by default
          } else {
            initialSelections[facet.name] = [['between', [facet.statistics?.min || 0, facet.statistics?.max || 0]]];
          }
        });
        setSelections(initialSelections);
        setIsInitialized(true);
        // Notify parent about facet updates
        if (onFacetsUpdate) {
          onFacetsUpdate(initializedFacets, trackToFilter);
        }
      };
      initializeFacets();
    }
  }, [trackToFilter, onFacetsUpdate]);

  // Apply filters whenever selections change
  useEffect(() => {
    if (isInitialized && facets.length > 0 && onFilterChange) {
      // Notify parent component about filter changes
      onFilterChange(selections, facets);
      // updateFilterCounts(trackToFilter, facets); // Uncomment if you implement this
    }
  }, [selections, facets, isInitialized, onFilterChange]);

  const handleFacetChange = (facetName: string, newSelection: any) => {
    setSelections((prev) => ({
      ...prev,
      [facetName]: newSelection,
    }));
  };

  // Method to refresh facets (called when locus changes)
  // const refreshFacets = useCallback(() => {
  //   if (trackToFilter) {
  //     const refreshedFacets = initFacets(trackToFilter);
  //     setFacets(refreshedFacets);

  //     // Update selections to maintain user's choices where possible
  //     setSelections((prevSelections) => {
  //       const newSelections: { [facetName: string]: any } = {};
  //       refreshedFacets.forEach((facet) => {
  //         if (prevSelections[facet.name]) {
  //           // Keep existing selection if facet still exists
  //           if (facet.type === 'categorical') {
  //             // Filter out any filter names that no longer exist
  //             const validSelections = prevSelections[facet.name].filter((name: string) =>
  //               facet.filterNames.includes(name)
  //             );
  //             newSelections[facet.name] = validSelections.length > 0 ? validSelections : [...facet.filterNames];
  //           } else {
  //             // For numeric facets, ensure the range is still valid
  //             const oldRange = prevSelections[facet.name][0][1];
  //             const newMin = facet.statistics?.min || 0;
  //             const newMax = facet.statistics?.max || 0;
  //             newSelections[facet.name] = [['between', [Math.max(newMin, oldRange[0]), Math.min(newMax, oldRange[1])]]];
  //           }
  //         } else {
  //           // Initialize new facets with default values
  //           if (facet.type === 'categorical') {
  //             newSelections[facet.name] = [...facet.filterNames];
  //           }
  //           if (facet.type !== 'categorical') {
  //             newSelections[facet.name] = [['between', [facet.statistics?.min || 0, facet.statistics?.max || 0]]];
  //           }
  //         }
  //       });
  //       return newSelections;
  //     });

  //     if (onFacetsUpdate) {
  //       onFacetsUpdate(refreshedFacets, trackToFilter);
  //     }
  //   }
  // }, [trackToFilter, onFacetsUpdate]);

  // Expose refresh method to parent
  // useEffect(() => {
  //   if (trackToFilter && trackToFilter.refreshFilters !== refreshFacets) {
  //     trackToFilter.refreshFilters = refreshFacets;
  //   }
  // }, [trackToFilter, refreshFacets]);

  return div({ className: 'igv-filters-container', style: igvStyles.igvFiltersContainer }, [
    ...facets.map((facet) => {
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
        selection: selections[facet.name] || [],
        onChange: (newSelection: any[]) => handleFacetChange(facet.name, newSelection),
      });
    }),
  ]);
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
          const parser = facet.type === 'float' ? parseFloat : parseInt;
          const value = parser(rawValue);

          if (Number.isNaN(value)) continue; // Skip invalid numeric values

          const op = facetSelection[0][0];
          const selectionValues = facetSelection[0][1];
          switch (op) {
            case 'between':
              const v1 = parser(selectionValues[0]);
              const v2 = parser(selectionValues[1]);
              if (value < v1 || value > v2) {
                return false;
              }
              break;
            case 'not between':
              const nv1 = parser(selectionValues[0]);
              const nv2 = parser(selectionValues[1]);
              if (value >= nv1 || value <= nv2) {
                return false;
              }
              break;
            case '=':
              if (value !== parser(selectionValues[0])) {
                return false;
              }
              break;
            case '!=':
              if (value === parser(selectionValues[0])) {
                return false;
              }
              break;
            case '<':
              if (value >= parser(selectionValues[0])) {
                return false;
              }
              break;
            case '<=':
              if (value > parser(selectionValues[0])) {
                return false;
              }
              break;
            case '>':
              if (value <= parser(selectionValues[0])) {
                return false;
              }
              break;
            case '>=':
              if (value < parser(selectionValues[0])) {
                return false;
              }
              break;
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
// function updateFilterCounts(trackToFilter, facets) {
//   const featuresInView = trackToFilter.getInViewFeatures();

//   // Reset counts
//   for (const facet of facets) {
//     if (facet.type === 'categorical') {
//       facet.countsByFilterName = {};
//       for (const filterName of facet.filterNames) {
//         facet.countsByFilterName[filterName] = 0;
//       }
//     } else {
//       facet.filterNumbers = [];
//       facet.statistics = {};
//     }
//   }

//   // Loop through features counting by filter
//   for (const igvFeature of featuresInView) {
//     const info = igvFeature.info;
//     for (const facet of facets) {
//       const facetName = facet.name;
//       // Not all features will have all facets
//       if (facetName in info) {
//         const rawValue = info[facetName];
//         if (facet.type === 'categorical') {
//           facet.countsByFilterName[rawValue] += 1;
//         } else {
//           const isFloat = facet.type === 'float';
//           const value = isFloat ? parseFloat(rawValue) : parseInt(rawValue);
//           facet.filterNumbers.push(value);
//         }
//       }
//     }
//   }

//   // // Populate statistics for numeric facets
//   // for (let facet of facets) {
//   //     if (facet.type !== 'categorical') {
//   //         const {min, q1, median, q3, max, mean, quantiles} = getStatistics(facet.filterNumbers)
//   //         facet.statistics = {min, q1, median, q3, max, mean, quantiles}
//   //     }
//   // }

//   // Update dom
//   for (const facet of facets) {
//     //  Object.entries(filterCounts).forEach(([facetName, countsByFilter], i) => {
//     //       const facet = facets[i]
//     if (facet.type === 'categorical') {
//       Object.entries(facet.countsByFilterName).forEach(([filterName, count]) => {
//         const filterSel = `.igv-filter-label[data-igv-facet-name="${facet.name}"][data-igv-filter-name="${filterName}"] .igv-filter-count`;
//         const countDom = document.querySelector(filterSel);
//         if (countDom) {
//           countDom.textContent = count;
//         } else {
//           // console.info(`Missing dom element for ${facet.name} : ${filterName}`)
//         }
//       });
//     }
//   }
// }

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
    const isNull = Number.isNaN(bars[i]) || i < 2;
    const start = minValue + binSize * i;
    const end = minValue + binSize * (i + 1);
    processedBars.push({
      count: bars[i],
      start,
      end,
      isNull,
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
