import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import {
  HubSpotFormSection,
  StripePaymentFormSection,
} from 'src/pages/scientificServices/pipelines/account/sections/PurchaseQuotaFormSections';
import { TEASPOONS_HUBSPOT_URL } from 'src/pages/scientificServices/pipelines/common/purchaseQuotaUtils';
import { renderWithAppContexts as render } from 'src/testing/test-utils';

jest.mock('src/pages/scientificServices/pipelines/common/purchaseQuotaUtils', () => ({
  ...jest.requireActual('src/pages/scientificServices/pipelines/common/purchaseQuotaUtils'),
  getStripePaymentUrls: jest.fn(),
  TEASPOONS_HUBSPOT_URL: 'https://test-hubspot-url.com',
}));

const { getStripePaymentUrls } = jest.requireMock('src/pages/scientificServices/pipelines/common/purchaseQuotaUtils');

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

describe('HubSpotFormSection', () => {
  it('renders the form section with correct title', () => {
    render(<HubSpotFormSection />);

    expect(screen.getByText('Complete the Form')).toBeInTheDocument();
  });

  it('displays the instructions text', () => {
    render(<HubSpotFormSection />);

    expect(
      screen.getByText(/Please fill and submit the below form. Our team will send you an email/)
    ).toBeInTheDocument();
  });

  it('renders the HubSpot iframe with correct src', () => {
    render(<HubSpotFormSection />);

    const iframe = screen.getByTitle('Request Quote Form');
    expect(iframe).toBeInTheDocument();
    expect(iframe).toHaveAttribute('src', TEASPOONS_HUBSPOT_URL);
  });
});

describe('StripePaymentFormSection', () => {
  const mockOnPipelineChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    getStripePaymentUrls.mockReturnValue({
      academicRate: 'https://buy.stripe.com/test_academic',
      forProfitRate: 'https://buy.stripe.com/test_forprofit',
    });
  });

  describe('Rendering', () => {
    it('renders the payment section with correct title', () => {
      render(
        <StripePaymentFormSection
          selectedPipeline={mockPipeline}
          uniquePipelines={[mockPipeline]}
          onPipelineChange={mockOnPipelineChange}
        />
      );

      expect(screen.getByText('Complete Payment')).toBeInTheDocument();
    });

    it('displays "What to expect" section with bullet points', () => {
      render(
        <StripePaymentFormSection
          selectedPipeline={mockPipeline}
          uniquePipelines={[mockPipeline]}
          onPipelineChange={mockOnPipelineChange}
        />
      );

      expect(screen.getByText('What to expect:')).toBeInTheDocument();
      expect(screen.getByText(/Select your pipeline and organization type/)).toBeInTheDocument();
      expect(screen.getByText(/You will be redirected to Stripe for secure payment processing/)).toBeInTheDocument();
      expect(screen.getByText(/Select the quantity of quota you want to purchase in Stripe form/)).toBeInTheDocument();
      expect(screen.getByText(/Complete payment securely through Stripe using Credit Card/)).toBeInTheDocument();
      expect(
        screen.getByText(/Once your payment is successful, your quota will be added to your account/)
      ).toBeInTheDocument();
    });

    it('renders the pipeline dropdown with correct label', () => {
      render(
        <StripePaymentFormSection
          selectedPipeline={mockPipeline}
          uniquePipelines={[mockPipeline]}
          onPipelineChange={mockOnPipelineChange}
        />
      );

      expect(screen.getByText('Select Pipeline')).toBeInTheDocument();
      expect(screen.getByLabelText(/selected pipeline Array Imputation/)).toBeInTheDocument();
    });

    it('renders organization type checkboxes', () => {
      render(
        <StripePaymentFormSection
          selectedPipeline={mockPipeline}
          uniquePipelines={[mockPipeline]}
          onPipelineChange={mockOnPipelineChange}
        />
      );

      expect(
        screen.getByRole('checkbox', { name: /I am part of an academic or non-profit organization/ })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('checkbox', { name: /The work I am doing is for non-profit activities/ })
      ).toBeInTheDocument();
    });

    it('renders the terms acknowledgement checkbox', () => {
      render(
        <StripePaymentFormSection
          selectedPipeline={mockPipeline}
          uniquePipelines={[mockPipeline]}
          onPipelineChange={mockOnPipelineChange}
        />
      );

      expect(
        screen.getByRole('checkbox', {
          name: /I confirm that the information I have submitted is accurate/,
        })
      ).toBeInTheDocument();
    });

    it('renders the secure payment notice', () => {
      render(
        <StripePaymentFormSection
          selectedPipeline={mockPipeline}
          uniquePipelines={[mockPipeline]}
          onPipelineChange={mockOnPipelineChange}
        />
      );

      expect(screen.getByText(/Secure Payment:/)).toBeInTheDocument();
      expect(screen.getByText(/All payments are processed securely through Stripe/)).toBeInTheDocument();
    });

    it('renders the Pay with Card button', () => {
      render(
        <StripePaymentFormSection
          selectedPipeline={mockPipeline}
          uniquePipelines={[mockPipeline]}
          onPipelineChange={mockOnPipelineChange}
        />
      );

      expect(screen.getByRole('button', { name: /Pay with Card \(For-Profit Rate\)/ })).toBeInTheDocument();
    });
  });

  describe('Pipeline dropdown interaction', () => {
    it('displays the selected pipeline', () => {
      render(
        <StripePaymentFormSection
          selectedPipeline={mockPipeline}
          uniquePipelines={[mockPipeline, mockPipeline2]}
          onPipelineChange={mockOnPipelineChange}
        />
      );

      expect(screen.getByLabelText(/selected pipeline Array Imputation/)).toBeInTheDocument();
    });

    it('calls onPipelineChange when a different pipeline is selected', async () => {
      const user = userEvent.setup();
      render(
        <StripePaymentFormSection
          selectedPipeline={mockPipeline}
          uniquePipelines={[mockPipeline, mockPipeline2]}
          onPipelineChange={mockOnPipelineChange}
        />
      );

      const pipelineSelect = screen.getByLabelText(/selected pipeline Array Imputation/);
      await user.click(pipelineSelect);
      await user.click(screen.getByText('Low Pass Imputation'));

      await waitFor(() => {
        expect(mockOnPipelineChange).toHaveBeenCalledWith(mockPipeline2);
      });
    });

    it('does not call onPipelineChange when the same pipeline is selected', async () => {
      const user = userEvent.setup();
      render(
        <StripePaymentFormSection
          selectedPipeline={mockPipeline}
          uniquePipelines={[mockPipeline, mockPipeline2]}
          onPipelineChange={mockOnPipelineChange}
        />
      );

      const pipelineSelect = screen.getByLabelText(/selected pipeline Array Imputation/);
      await user.click(pipelineSelect);

      // Get all "Array Imputation" text and click the one in the dropdown menu (not the selected value)
      const arrayImputationOptions = screen.getAllByText('Array Imputation');
      await user.click(arrayImputationOptions[1]); // The second one is in the dropdown menu

      expect(mockOnPipelineChange).not.toHaveBeenCalled();
    });
  });

  describe('Pay with Card button', () => {
    it('is disabled when no pipeline is selected', () => {
      render(
        <StripePaymentFormSection
          selectedPipeline={undefined}
          uniquePipelines={[mockPipeline]}
          onPipelineChange={mockOnPipelineChange}
        />
      );

      const payButton = screen.getByRole('button', { name: /Pay with Card/ });
      expect(payButton).toHaveAttribute('aria-disabled', 'true');
    });

    it('is disabled when terms are not acknowledged', () => {
      render(
        <StripePaymentFormSection
          selectedPipeline={mockPipeline}
          uniquePipelines={[mockPipeline]}
          onPipelineChange={mockOnPipelineChange}
        />
      );

      const payButton = screen.getByRole('button', { name: /Pay with Card/ });
      expect(payButton).toHaveAttribute('aria-disabled', 'true');
    });

    it('is disabled when Stripe URLs are not available', () => {
      getStripePaymentUrls.mockReturnValue(undefined);

      render(
        <StripePaymentFormSection
          selectedPipeline={mockPipeline}
          uniquePipelines={[mockPipeline]}
          onPipelineChange={mockOnPipelineChange}
        />
      );

      const payButton = screen.getByRole('button', { name: /Pay with Card/ });
      expect(payButton).toHaveAttribute('aria-disabled', 'true');
    });

    it('is enabled when pipeline is selected, terms are acknowledged, and Stripe URLs are available', async () => {
      const user = userEvent.setup();
      render(
        <StripePaymentFormSection
          selectedPipeline={mockPipeline}
          uniquePipelines={[mockPipeline]}
          onPipelineChange={mockOnPipelineChange}
        />
      );

      const termsCheckbox = screen.getByRole('checkbox', { name: /I confirm that the information/ });
      await user.click(termsCheckbox);

      const payButton = screen.getByRole('button', { name: /Pay with Card/ });
      expect(payButton).toHaveAttribute('aria-disabled', 'false');
    });

    it('displays "For-Profit Rate" by default', () => {
      render(
        <StripePaymentFormSection
          selectedPipeline={mockPipeline}
          uniquePipelines={[mockPipeline]}
          onPipelineChange={mockOnPipelineChange}
        />
      );

      expect(screen.getByRole('button', { name: /Pay with Card \(For-Profit Rate\)/ })).toBeInTheDocument();
    });

    it('displays "For-Profit Rate" when only academic checkbox is checked', async () => {
      const user = userEvent.setup();
      render(
        <StripePaymentFormSection
          selectedPipeline={mockPipeline}
          uniquePipelines={[mockPipeline]}
          onPipelineChange={mockOnPipelineChange}
        />
      );

      const academicCheckbox = screen.getByRole('checkbox', {
        name: /I am part of an academic or non-profit organization/,
      });
      await user.click(academicCheckbox);

      expect(screen.getByRole('button', { name: /Pay with Card \(For-Profit Rate\)/ })).toBeInTheDocument();
    });

    it('displays "For-Profit Rate" when only nonprofit work checkbox is checked', async () => {
      const user = userEvent.setup();
      render(
        <StripePaymentFormSection
          selectedPipeline={mockPipeline}
          uniquePipelines={[mockPipeline]}
          onPipelineChange={mockOnPipelineChange}
        />
      );

      const nonprofitWorkCheckbox = screen.getByRole('checkbox', { name: /The work I am doing is for non-profit/ });
      await user.click(nonprofitWorkCheckbox);

      expect(screen.getByRole('button', { name: /Pay with Card \(For-Profit Rate\)/ })).toBeInTheDocument();
    });

    it('displays "Academic Rate" when both organization checkboxes are checked', async () => {
      const user = userEvent.setup();
      render(
        <StripePaymentFormSection
          selectedPipeline={mockPipeline}
          uniquePipelines={[mockPipeline]}
          onPipelineChange={mockOnPipelineChange}
        />
      );

      const academicCheckbox = screen.getByRole('checkbox', {
        name: /I am part of an academic or non-profit organization/,
      });
      const nonprofitWorkCheckbox = screen.getByRole('checkbox', { name: /The work I am doing is for non-profit/ });

      await user.click(academicCheckbox);
      await user.click(nonprofitWorkCheckbox);

      expect(screen.getByRole('button', { name: /Pay with Card \(Academic Rate\)/ })).toBeInTheDocument();
    });

    it('opens for-profit Stripe URL when clicked with no organization checkboxes checked', async () => {
      const windowOpenSpy = jest.spyOn(window, 'open').mockImplementation();
      const user = userEvent.setup();

      render(
        <StripePaymentFormSection
          selectedPipeline={mockPipeline}
          uniquePipelines={[mockPipeline]}
          onPipelineChange={mockOnPipelineChange}
        />
      );

      const termsCheckbox = screen.getByRole('checkbox', { name: /I confirm that the information/ });
      await user.click(termsCheckbox);

      const payButton = screen.getByRole('button', { name: /Pay with Card \(For-Profit Rate\)/ });
      await user.click(payButton);

      expect(windowOpenSpy).toHaveBeenCalledWith('https://buy.stripe.com/test_forprofit', '_blank');

      windowOpenSpy.mockRestore();
    });

    it('opens academic Stripe URL when clicked with both organization checkboxes checked', async () => {
      const windowOpenSpy = jest.spyOn(window, 'open').mockImplementation();
      const user = userEvent.setup();

      render(
        <StripePaymentFormSection
          selectedPipeline={mockPipeline}
          uniquePipelines={[mockPipeline]}
          onPipelineChange={mockOnPipelineChange}
        />
      );

      const academicCheckbox = screen.getByRole('checkbox', {
        name: /I am part of an academic or non-profit organization/,
      });
      const nonprofitWorkCheckbox = screen.getByRole('checkbox', { name: /The work I am doing is for non-profit/ });
      const termsCheckbox = screen.getByRole('checkbox', { name: /I confirm that the information/ });

      await user.click(academicCheckbox);
      await user.click(nonprofitWorkCheckbox);
      await user.click(termsCheckbox);

      const payButton = screen.getByRole('button', { name: /Pay with Card \(Academic Rate\)/ });
      await user.click(payButton);

      expect(windowOpenSpy).toHaveBeenCalledWith('https://buy.stripe.com/test_academic', '_blank');

      windowOpenSpy.mockRestore();
    });
  });

  describe('Form reset on pipeline change', () => {
    it('resets all checkboxes when pipeline changes', async () => {
      const user = userEvent.setup();
      const { rerender } = render(
        <StripePaymentFormSection
          selectedPipeline={mockPipeline}
          uniquePipelines={[mockPipeline, mockPipeline2]}
          onPipelineChange={mockOnPipelineChange}
        />
      );

      // Check all checkboxes
      const academicCheckbox = screen.getByRole('checkbox', {
        name: /I am part of an academic or non-profit organization/,
      });
      const nonprofitWorkCheckbox = screen.getByRole('checkbox', { name: /The work I am doing is for non-profit/ });
      const termsCheckbox = screen.getByRole('checkbox', { name: /I confirm that the information/ });

      await user.click(academicCheckbox);
      await user.click(nonprofitWorkCheckbox);
      await user.click(termsCheckbox);

      expect(academicCheckbox).toBeChecked();
      expect(nonprofitWorkCheckbox).toBeChecked();
      expect(termsCheckbox).toBeChecked();

      // Change pipeline
      rerender(
        <StripePaymentFormSection
          selectedPipeline={mockPipeline2}
          uniquePipelines={[mockPipeline, mockPipeline2]}
          onPipelineChange={mockOnPipelineChange}
        />
      );

      // Verify all checkboxes are reset
      await waitFor(() => {
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

    it('button text changes back to For-Profit Rate after pipeline change resets checkboxes', async () => {
      const user = userEvent.setup();
      const { rerender } = render(
        <StripePaymentFormSection
          selectedPipeline={mockPipeline}
          uniquePipelines={[mockPipeline, mockPipeline2]}
          onPipelineChange={mockOnPipelineChange}
        />
      );

      // Check both org checkboxes to get Academic Rate
      const academicCheckbox = screen.getByRole('checkbox', {
        name: /I am part of an academic or non-profit organization/,
      });
      const nonprofitWorkCheckbox = screen.getByRole('checkbox', { name: /The work I am doing is for non-profit/ });

      await user.click(academicCheckbox);
      await user.click(nonprofitWorkCheckbox);

      expect(screen.getByRole('button', { name: /Pay with Card \(Academic Rate\)/ })).toBeInTheDocument();

      // Change pipeline (should reset to For-Profit Rate)
      rerender(
        <StripePaymentFormSection
          selectedPipeline={mockPipeline2}
          uniquePipelines={[mockPipeline, mockPipeline2]}
          onPipelineChange={mockOnPipelineChange}
        />
      );

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Pay with Card \(For-Profit Rate\)/ })).toBeInTheDocument();
      });
    });
  });
});
