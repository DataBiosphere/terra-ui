import { act, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { h } from 'react-hyperscript-helpers';
import { IGVFilters } from 'src/components/igv/IGVFilter';
import { renderWithAppContexts as render } from 'src/testing/test-utils';

describe('IGVFilters', () => {
  const mockTrack = {
    filter: jest.fn(),
    getFilterableAttributes: jest.fn(() => ({
      VT: { Type: 'String', Description: 'Variant Type' },
      AF: { Type: 'Float', Description: 'Allele Frequency' },
      DP: { Type: 'Integer', Description: 'Read Depth' },
    })),
    getInViewFeatures: jest.fn(() => [
      { info: { VT: 'SNP', AF: 0.5, DP: 30 } },
      { info: { VT: 'SNP', AF: 0.3, DP: 25 } },
      { info: { VT: 'INDEL', AF: 0.1, DP: 20 } },
      { info: { VT: 'SNP', AF: 0.8, DP: 35 } },
    ]),
  };

  const defaultProps = {
    trackToFilter: mockTrack,
    currentSelections: {},
    currentFacets: [],
    isInitialized: false,
    setIsInitialized: jest.fn(),
    onFilterChange: jest.fn(),
    onFacetsUpdate: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Initialization', () => {
    it('displays loading state initially', () => {
      render(h(IGVFilters, { ...defaultProps, isLoading: true }));
      expect(screen.getByText('Loading facets...')).toBeInTheDocument();
    });

    it('initializes facets from track data', async () => {
      await act(async () => {
        render(h(IGVFilters, defaultProps));
      });

      await waitFor(() => {
        expect(defaultProps.setIsInitialized).toHaveBeenCalledWith(true);
        expect(defaultProps.onFacetsUpdate).toHaveBeenCalled();
      });

      // Check that facets are rendered
      expect(screen.getByText(/Variant Type/i)).toBeInTheDocument();
      expect(screen.getByText(/Allele Frequency/i)).toBeInTheDocument();
      expect(screen.getByText(/Read Depth/i)).toBeInTheDocument();
    });

    it('displays "no facets available" when no valid facets exist', async () => {
      const emptyTrack = {
        ...mockTrack,
        getInViewFeatures: jest.fn(() => []),
      };

      await act(async () => {
        render(
          h(IGVFilters, {
            ...defaultProps,
            trackToFilter: emptyTrack,
          })
        );
      });

      await waitFor(() => {
        expect(screen.getByText('No facets available to display.')).toBeInTheDocument();
      });
    });

    it('does not render facets with fewer than 2 categories', async () => {
      const singleCategoryTrack = {
        ...mockTrack,
        getInViewFeatures: jest.fn(() => [
          { info: { VT: 'SNP', AF: 0.5, DP: 30 } },
          { info: { VT: 'SNP', AF: 0.3, DP: 25 } },
        ]),
      };

      await act(async () => {
        render(
          h(IGVFilters, {
            ...defaultProps,
            trackToFilter: singleCategoryTrack,
          })
        );
      });

      await waitFor(() => {
        // VT should not be rendered (only one category: SNP)
        expect(screen.queryByText(/Variant Type/i)).not.toBeInTheDocument();
        // But numeric facets should still be there
        expect(screen.getByText(/Allele Frequency/i)).toBeInTheDocument();
      });
    });
  });

  describe('Categorical Facets', () => {
    it('displays categorical facet with checkboxes', async () => {
      await act(async () => {
        render(h(IGVFilters, defaultProps));
      });

      await waitFor(() => {
        expect(screen.getByText(/Variant Type/i)).toBeInTheDocument();
      });

      // Check for filter options
      expect(screen.getByLabelText(/SNP/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/INDEL/i)).toBeInTheDocument();
    });

    it('shows counts for each filter option', async () => {
      await act(async () => {
        render(h(IGVFilters, defaultProps));
      });

      await waitFor(() => {
        expect(screen.getByText('3')).toBeInTheDocument(); // SNP count
        expect(screen.getByText('1')).toBeInTheDocument(); // INDEL count
      });
    });

    it('handles checkbox selection changes', async () => {
      const user = userEvent.setup();
      await act(async () => {
        render(h(IGVFilters, defaultProps));
      });

      await waitFor(() => {
        expect(screen.getByLabelText(/SNP/i)).toBeInTheDocument();
      });

      const snpCheckbox = screen.getByLabelText(/SNP/i);

      await user.click(snpCheckbox);

      await waitFor(() => {
        expect(defaultProps.onFilterChange).toHaveBeenCalled();
      });
    });

    it('shows More/Less toggle for facets with >5 options', async () => {
      const manyOptionsTrack = {
        ...mockTrack,
        getInViewFeatures: jest.fn(() => [
          { info: { VT: 'SNP', AF: 0.5, DP: 30 } },
          { info: { VT: 'INDEL', AF: 0.3, DP: 25 } },
          { info: { VT: 'DEL', AF: 0.1, DP: 20 } },
          { info: { VT: 'INS', AF: 0.8, DP: 35 } },
          { info: { VT: 'DUP', AF: 0.4, DP: 28 } },
          { info: { VT: 'CNV', AF: 0.2, DP: 22 } },
          { info: { VT: 'INV', AF: 0.6, DP: 32 } },
        ]),
      };

      await act(async () => {
        render(
          h(IGVFilters, {
            ...defaultProps,
            trackToFilter: manyOptionsTrack,
          })
        );
      });

      await waitFor(() => {
        expect(screen.getByText('More...')).toBeInTheDocument();
      });
    });
  });

  describe('Numeric Facets', () => {
    it('displays numeric facet with histogram and slider', async () => {
      await act(async () => {
        render(h(IGVFilters, defaultProps));
      });

      await waitFor(() => {
        expect(screen.getByText(/Allele Frequency/i)).toBeInTheDocument();
      });

      // Check for histogram SVG
      const histograms = document.querySelectorAll('.numeric-filter-histogram');
      expect(histograms.length).toBeGreaterThan(0);
    });

    it('displays operator dropdown and input fields', async () => {
      await act(async () => {
        render(h(IGVFilters, defaultProps));
      });

      await waitFor(() => {
        expect(screen.getByText(/Allele Frequency/i)).toBeInTheDocument();
      });

      // Check for operator dropdown (default: "between")
      const inputs = document.querySelectorAll('.igv-numeric-query-input');
      expect(inputs.length).toBeGreaterThan(0);
    });

    it('handles numeric input changes', async () => {
      const user = userEvent.setup();
      await act(async () => {
        render(h(IGVFilters, defaultProps));
      });

      await waitFor(() => {
        expect(screen.getByText(/Allele Frequency/i)).toBeInTheDocument();
      });

      const inputs = document.querySelectorAll('.igv-numeric-query-input');
      const firstInput = inputs[0] as HTMLInputElement;

      await user.clear(firstInput);
      await user.type(firstInput, '0.2');
      await user.tab(); // Trigger blur event

      await waitFor(() => {
        expect(defaultProps.onFilterChange).toHaveBeenCalled();
      });
    });
  });

  describe('State Management', () => {
    it('restores state from currentSelections and currentFacets', async () => {
      const savedSelections = {
        VT: ['SNP'],
        AF: [['between', [0.2, 0.8]]],
      };

      const savedFacets = [
        {
          name: 'VT',
          type: 'categorical' as const,
          description: 'Variant Type',
          filterNames: ['SNP', 'INDEL'],
          countsByFilterName: { SNP: 3, INDEL: 1 },
        },
      ];

      await act(async () => {
        render(
          h(IGVFilters, {
            ...defaultProps,
            currentSelections: savedSelections,
            currentFacets: savedFacets,
            isInitialized: true,
          })
        );
      });

      await waitFor(() => {
        // Check that saved state is applied
        const snpCheckbox = screen.getByLabelText(/SNP/i) as HTMLInputElement;
        expect(snpCheckbox.checked).toBe(true);
      });
    });

    it('reinitializes when isInitialized becomes false', async () => {
      const { rerender } = render(
        h(IGVFilters, {
          ...defaultProps,
          isInitialized: true,
        })
      );

      await waitFor(() => {
        expect(defaultProps.onFacetsUpdate).toHaveBeenCalledTimes(0);
      });

      // Reset initialization
      await act(async () => {
        rerender(
          h(IGVFilters, {
            ...defaultProps,
            isInitialized: false,
          })
        );
      });

      await waitFor(() => {
        expect(defaultProps.setIsInitialized).toHaveBeenCalled();
      });
    });
  });

  describe('Filter Building', () => {
    it('builds correct filter for categorical selections', async () => {
      const user = userEvent.setup();
      await act(async () => {
        render(h(IGVFilters, defaultProps));
      });

      await waitFor(() => {
        expect(screen.getByLabelText(/SNP/i)).toBeInTheDocument();
      });

      const indelCheckbox = screen.getByLabelText(/INDEL/i);
      await user.click(indelCheckbox);

      await waitFor(() => {
        const filterChangeCalls = defaultProps.onFilterChange.mock.calls;
        const lastCall = filterChangeCalls[filterChangeCalls.length - 1];
        const selections = lastCall[0];

        // INDEL should be unchecked (removed from selection)
        expect(selections.VT).not.toContain('INDEL');
      });
    });

    it('builds correct filter for numeric range', async () => {
      const user = userEvent.setup();
      await act(async () => {
        render(h(IGVFilters, defaultProps));
      });

      await waitFor(() => {
        expect(screen.getByText(/Allele Frequency/i)).toBeInTheDocument();
      });

      // Wait for the numeric inputs to be rendered
      await waitFor(() => {
        const inputs = document.querySelectorAll('.igv-numeric-query-input-value');
        expect(inputs.length).toBeGreaterThan(0);
      });

      const inputs = document.querySelectorAll('.igv-numeric-query-input-value');
      const firstInput = inputs[0] as HTMLInputElement;

      await user.clear(firstInput);
      await user.type(firstInput, '0.3');
      await user.tab();

      await waitFor(() => {
        const filterChangeCalls = defaultProps.onFilterChange.mock.calls;
        const lastCall = filterChangeCalls[filterChangeCalls.length - 1];
        const selections = lastCall[0];

        expect(selections.AF).toBeDefined();
        expect(selections.AF[0][0]).toBe('between');
        expect(selections.AF[0][1][0]).toBe(0.3);
      });
    });
  });
});
