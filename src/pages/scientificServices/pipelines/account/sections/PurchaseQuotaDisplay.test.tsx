import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import * as Nav from 'src/libs/nav';
import { PurchaseQuotaDisplay } from 'src/pages/scientificServices/pipelines/account/sections/PurchaseQuotaDisplay';
import {
  clearInProgressPurchase,
  getInProgressPurchase,
  getStripePaymentUrls,
} from 'src/pages/scientificServices/pipelines/common/purchaseQuotaUtils';
import * as usePipelinesListModule from 'src/pages/scientificServices/pipelines/hooks/usePipelinesList';
import * as useUserQuotaModule from 'src/pages/scientificServices/pipelines/hooks/useUserQuota';
import { renderWithAppContexts as render } from 'src/testing/test-utils';

const mockUsePipelinesList = jest.spyOn(usePipelinesListModule, 'usePipelinesList');
const mockUseUserQuota = jest.spyOn(useUserQuotaModule, 'useUserQuota');

const mockPipeline = {
  pipelineName: 'array_imputation',
  displayName: 'Array Imputation',
  pipelineVersion: 1,
  description: 'Test pipeline for array imputation',
};

const mockPipeline2 = {
  pipelineName: 'low_pass_imputation',
  displayName: 'Low Pass Imputation',
  pipelineVersion: 1,
  description: 'Test pipeline for low pass imputation',
};

const mockQuota = {
  quotaConsumed: 100,
  quotaLimit: 1000,
  quotaUnits: 'samples',
};

const mockPipelineDetails = {
  pipelineQuota: {
    minQuotaConsumed: 500,
  },
};

jest.mock('src/libs/nav', () => ({
  ...jest.requireActual('src/libs/nav'),
  getPath: jest.fn(() => '/test/'),
  getLink: jest.fn(() => '/'),
  useRoute: jest.fn().mockImplementation(() => ({ params: {}, query: {} })),
  goToPath: jest.fn(),
  updateSearch: jest.fn(),
}));

jest.mock('src/pages/scientificServices/pipelines/common/purchaseQuotaUtils', () => ({
  ...jest.requireActual('src/pages/scientificServices/pipelines/common/purchaseQuotaUtils'),
  getStripePaymentUrls: jest.fn(),
  getInProgressPurchase: jest.fn(),
  clearInProgressPurchase: jest.fn(),
}));

const mockGetStripePaymentUrls = jest.mocked(getStripePaymentUrls);
const mockGetInProgressPurchase = jest.mocked(getInProgressPurchase);
const mockClearInProgressPurchase = jest.mocked(clearInProgressPurchase);

beforeEach(() => {
  mockUsePipelinesList.mockReturnValue({
    pipelines: [mockPipeline, mockPipeline2],
    uniquePipelines: [mockPipeline, mockPipeline2],
    isLoading: false,
    error: undefined,
  } as any);

  mockUseUserQuota.mockReturnValue({
    quota: mockQuota,
    pipelineDetails: mockPipelineDetails,
    meetsMinimumQuota: true,
    isLoading: false,
  } as any);

  mockGetStripePaymentUrls.mockReturnValue({
    academicRate: 'https://buy.stripe.com/test_academic',
    forProfitRate: 'https://buy.stripe.com/test_forprofit',
  });

  mockGetInProgressPurchase.mockReturnValue(undefined);
});

afterEach(() => {
  jest.clearAllMocks();
});

describe('PurchaseQuotaDisplay', () => {
  it('shows loading spinner while pipelines are loading', () => {
    mockUsePipelinesList.mockReturnValue({
      pipelines: [],
      uniquePipelines: [],
      isLoading: true,
      error: undefined,
    } as any);

    render(<PurchaseQuotaDisplay pipelineName='array_imputation' />);

    expect(screen.getByText('Loading pipeline...')).toBeInTheDocument();
  });

  it('displays error message when pipeline is not found', () => {
    render(<PurchaseQuotaDisplay pipelineName='nonexistent_pipeline' />);

    expect(screen.getByText('Pipeline nonexistent_pipeline not found.')).toBeInTheDocument();
  });

  it('renders back to all quotas button', () => {
    render(<PurchaseQuotaDisplay pipelineName='array_imputation' />);

    expect(screen.getByText('All quotas')).toBeInTheDocument();
  });

  it('navigates back to quotas page when back button is clicked', async () => {
    const user = userEvent.setup();
    render(<PurchaseQuotaDisplay pipelineName='array_imputation' />);

    await user.click(screen.getByText('All quotas'));

    expect(Nav.goToPath).toHaveBeenCalledWith('pipelines-quotas');
  });

  it('displays the selected pipeline quota card', () => {
    render(<PurchaseQuotaDisplay pipelineName='array_imputation' />);

    expect(screen.getByText('Selected pipeline for purchasing quota')).toBeInTheDocument();
    expect(screen.getByText('Array Imputation')).toBeInTheDocument();

    // verify that the purchase button is not rendered
    expect(screen.queryByRole('button', { name: 'Purchase Quota' })).not.toBeInTheDocument();
  });

  it('displays the purchase quota options correctly', () => {
    render(<PurchaseQuotaDisplay pipelineName='array_imputation' />);

    expect(screen.getByText('How would you like to purchase quota?')).toBeInTheDocument();

    // Get Quote First & Pay Later card
    const getQuoteCard = screen.getByText('Get Quote First & Pay Later').closest('button');
    expect(getQuoteCard).toBeInTheDocument();
    expect(getQuoteCard).toHaveTextContent(
      'Fill out a form and we will contact you with the quote. Once you receive that, you can choose to pay via Purchase Order or Credit Card.'
    );

    // Get Quote Now & Pay with Credit Card
    const payNowCard = screen.getByText('Get Quote Now & Pay with Credit Card').closest('button');
    expect(payNowCard).toBeInTheDocument();
    expect(payNowCard).toHaveTextContent(
      'Before you complete the purchase you will have the opportunity to see the quote and then pay with Credit Card.'
    );
  });

  it('resets purchase path when pipeline changes', async () => {
    const user = userEvent.setup();
    const { rerender } = render(<PurchaseQuotaDisplay pipelineName='array_imputation' />);

    // Select a purchase option (get-quote)
    await user.click(screen.getByText('Request Quote'));
    expect(screen.getByText('Complete the Form')).toBeInTheDocument();

    // Simulate URL change to different pipeline
    rerender(<PurchaseQuotaDisplay pipelineName='low_pass_imputation' />);

    // Purchase form should be hidden (purchasePathOption reset to null)
    await waitFor(() => {
      expect(screen.queryByText('Complete the Form')).not.toBeInTheDocument();
    });

    // Verify the new pipeline is displayed
    expect(screen.getByText('Low Pass Imputation')).toBeInTheDocument();
  });

  describe('Purchase option card interactions', () => {
    it('switches from get-quote to self-service', async () => {
      const user = userEvent.setup();
      render(<PurchaseQuotaDisplay pipelineName='array_imputation' />);

      await user.click(screen.getByText('Request Quote'));
      expect(screen.getByText('Complete the Form')).toBeInTheDocument();

      await user.click(screen.getByText('View Quote & Pay Now'));
      expect(screen.queryByText('Complete the Form')).not.toBeInTheDocument();
      expect(screen.getByText('Complete Payment')).toBeInTheDocument();
    });

    it('switches from self-service to get-quote', async () => {
      const user = userEvent.setup();
      render(<PurchaseQuotaDisplay pipelineName='array_imputation' />);

      await user.click(screen.getByText('View Quote & Pay Now'));
      expect(screen.getByText('Complete Payment')).toBeInTheDocument();

      await user.click(screen.getByText('Request Quote'));
      expect(screen.queryByText('Complete Payment')).not.toBeInTheDocument();
      expect(screen.getByText('Complete the Form')).toBeInTheDocument();
    });
  });

  describe('HubSpot form section', () => {
    it('does not display HubSpot form before option is selected', () => {
      render(<PurchaseQuotaDisplay pipelineName='array_imputation' />);

      expect(screen.queryByText('Complete the Form')).not.toBeInTheDocument();
    });

    it('displays HubSpot form when selected', async () => {
      const user = userEvent.setup();
      render(<PurchaseQuotaDisplay pipelineName='array_imputation' />);

      await user.click(screen.getByText('Request Quote'));

      expect(screen.getByText('Complete the Form')).toBeInTheDocument();
      expect(screen.getByText(/Please fill and submit the below form/)).toBeInTheDocument();
    });
  });

  describe('Stripe payment form', () => {
    it('does not display Stripe form before option is selected', () => {
      render(<PurchaseQuotaDisplay pipelineName='array_imputation' />);

      expect(screen.queryByText('Complete Payment')).not.toBeInTheDocument();
    });

    it('displays Stripe payment form when selected', async () => {
      const user = userEvent.setup();
      render(<PurchaseQuotaDisplay pipelineName='array_imputation' />);

      await user.click(screen.getByText('View Quote & Pay Now'));

      expect(screen.getByText('Complete Payment')).toBeInTheDocument();
    });

    it('disables self-service option when Stripe URLs are not available', () => {
      mockGetStripePaymentUrls.mockReturnValue(undefined);
      render(<PurchaseQuotaDisplay pipelineName='array_imputation' />);

      expect(screen.getByText('View Quote & Pay Now').closest('button')).toBeDisabled();
    });

    it('renders form as expected', async () => {
      const user = userEvent.setup();
      render(<PurchaseQuotaDisplay pipelineName='array_imputation' />);

      await user.click(screen.getByText('View Quote & Pay Now'));

      // Verify that the pipeline dropdown is displayed with the correct label
      expect(screen.getByText('Select Pipeline')).toBeInTheDocument();
      expect(screen.getByLabelText(/selected pipeline Array Imputation/)).toBeInTheDocument();

      // Verify that the organization type checkboxes are present
      expect(
        screen.getByRole('checkbox', { name: /I am part of an academic or non-profit organization/ })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('checkbox', { name: /The work I am doing is for non-profit activities/ })
      ).toBeInTheDocument();

      // Verify that the terms acknowledgement checkbox is present
      expect(
        screen.getByRole('checkbox', {
          name: /I confirm that the information I have submitted is accurate/,
        })
      ).toBeInTheDocument();
    });

    it('allows changing pipeline via dropdown', async () => {
      const user = userEvent.setup();
      render(<PurchaseQuotaDisplay pipelineName='array_imputation' />);

      await user.click(screen.getByText('View Quote & Pay Now'));

      // Verify initial pipeline is Array Imputation
      const pipelineSelect = screen.getByLabelText(/selected pipeline Array Imputation/);
      expect(pipelineSelect).toBeInTheDocument();

      // Click the dropdown to open it
      await user.click(pipelineSelect);

      // Select the second pipeline
      await user.click(screen.getByText('Low Pass Imputation'));

      // Verify that Nav.updateSearch was called with the new pipeline
      await waitFor(() => {
        expect(Nav.updateSearch).toHaveBeenCalledWith({ pipeline: 'low_pass_imputation' });
      });
    });

    it('resets form selections when pipeline is changed via dropdown', async () => {
      const user = userEvent.setup();
      render(<PurchaseQuotaDisplay pipelineName='array_imputation' />);

      await user.click(screen.getByText('View Quote & Pay Now'));

      // Check both organization checkboxes and terms
      const academicCheckbox = screen.getByRole('checkbox', {
        name: /I am part of an academic or non-profit organization/,
      });
      const nonprofitWorkCheckbox = screen.getByRole('checkbox', { name: /The work I am doing is for non-profit/ });
      const termsCheckbox = screen.getByRole('checkbox', { name: /I confirm that the information/ });

      await user.click(academicCheckbox);
      await user.click(nonprofitWorkCheckbox);
      await user.click(termsCheckbox);

      // Verify they are checked
      expect(academicCheckbox).toBeChecked();
      expect(nonprofitWorkCheckbox).toBeChecked();
      expect(termsCheckbox).toBeChecked();

      // Change pipeline via dropdown
      const pipelineSelect = screen.getByLabelText(/selected pipeline Array Imputation/);
      await user.click(pipelineSelect);
      await user.click(screen.getByText('Low Pass Imputation'));

      // Wait for the form to update
      await waitFor(() => {
        expect(screen.getByLabelText(/selected pipeline Low Pass Imputation/)).toBeInTheDocument();
      });

      // Verify all checkboxes are now unchecked (reset)
      const academicCheckboxAfter = screen.getByRole('checkbox', {
        name: /I am part of an academic or non-profit organization/,
      });
      const nonprofitWorkCheckboxAfter = screen.getByRole('checkbox', {
        name: /The work I am doing is for non-profit/,
      });
      const termsCheckboxAfter = screen.getByRole('checkbox', { name: /I confirm that the information/ });

      expect(academicCheckboxAfter).not.toBeChecked();
      expect(nonprofitWorkCheckboxAfter).not.toBeChecked();
      expect(termsCheckboxAfter).not.toBeChecked();
    });
  });

  describe('Pre-filling from an in-progress purchase', () => {
    it('opens the Stripe form and pre-checks the boxes, then clears the stored purchase', () => {
      mockGetInProgressPurchase.mockReturnValue({
        nonProfitActivities: true,
        nonProfitOrganization: true,
        pipeline: 'array_imputation',
      });

      render(<PurchaseQuotaDisplay pipelineName='array_imputation' />);

      expect(screen.getByText('Complete Payment')).toBeInTheDocument();
      expect(
        screen.getByRole('checkbox', { name: /I am part of an academic or non-profit organization/ })
      ).toBeChecked();
      expect(screen.getByRole('checkbox', { name: /The work I am doing is for non-profit activities/ })).toBeChecked();

      expect(mockClearInProgressPurchase).toHaveBeenCalled();
    });

    it('does not pre-fill when the in-progress purchase is for a different pipeline', () => {
      mockGetInProgressPurchase.mockReturnValue({
        nonProfitActivities: true,
        nonProfitOrganization: true,
        pipeline: 'low_pass_imputation',
      });

      render(<PurchaseQuotaDisplay pipelineName='array_imputation' />);

      expect(screen.queryByText('Complete Payment')).not.toBeInTheDocument();
      expect(mockClearInProgressPurchase).not.toHaveBeenCalled();
    });

    it('does nothing when there is no purchase in progress', () => {
      render(<PurchaseQuotaDisplay pipelineName='array_imputation' />);

      expect(screen.queryByText('Complete Payment')).not.toBeInTheDocument();
      expect(mockClearInProgressPurchase).not.toHaveBeenCalled();
    });
  });
});
