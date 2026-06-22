import {
  ButtonPrimary,
  ButtonSecondary,
  Icon,
  InfoBox,
  Select,
  Spinner,
  TooltipTrigger,
} from '@terra-ui-packages/components';
import React, { useEffect, useRef, useState } from 'react';
import { LabeledCheckbox } from 'src/components/common';
import { Pipeline } from 'src/libs/ajax/teaspoons/teaspoons-models';
import colors from 'src/libs/colors';
import * as Nav from 'src/libs/nav';
import { PipelineQuotaCard } from 'src/pages/scientificServices/pipelines/common/PipelineQuotaCard';
import {
  getStripePaymentUrls,
  TEASPOONS_HUBSPOT_URL,
} from 'src/pages/scientificServices/pipelines/common/purchaseQuotaUtils';
import { usePipelinesList } from 'src/pages/scientificServices/pipelines/hooks/usePipelinesList';
import { PipelineWidgetContainer } from 'src/pages/scientificServices/pipelines/tabs/run/widgets/PipelineWidgetContainer';

type PurchasePathOption = 'get-quote' | 'self-service' | null;

export const PurchaseQuotaDisplay = ({ pipelineName }: { pipelineName: string }) => {
  const { uniquePipelines, isLoading } = usePipelinesList();

  const [purchasePathOption, setPurchasePathOption] = useState<PurchasePathOption>(null);
  const [selectedPipeline, setSelectedPipeline] = useState<Pipeline | undefined>(
    uniquePipelines?.find((p) => p.pipelineName === pipelineName)
  );
  const [partOfAcademicOrNonProfitOrg, setPartOfAcademicOrNonProfitOrg] = useState(false);
  const [doingNonProfitWork, setDoingNonProfitWork] = useState(false);
  const [qualifiesForAcademicRate, setQualifiesForAcademicRate] = useState<boolean>(false);
  const [termsAcknowledged, setTermsAcknowledged] = useState(false);

  // track previous pipeline to detect external URL changes
  const prevPipelineNameRef = useRef<string | undefined>(undefined);

  // reset everything if pipelineName changed externally through URL (not from our dropdown)
  useEffect(() => {
    if (
      prevPipelineNameRef.current !== undefined &&
      prevPipelineNameRef.current !== pipelineName &&
      selectedPipeline?.pipelineName !== pipelineName
    ) {
      resetSelections();
      setPurchasePathOption(null);
    }
    prevPipelineNameRef.current = pipelineName;
  }, [pipelineName, selectedPipeline]);

  // update selected pipeline when pipelines load or pipelineName changes
  useEffect(() => {
    if (pipelineName && uniquePipelines && uniquePipelines.length > 0) {
      const pipeline = uniquePipelines.find((p) => p.pipelineName === pipelineName);
      if (pipeline) {
        setSelectedPipeline(pipeline);
      }
    }
  }, [pipelineName, uniquePipelines]);

  // determine if user qualifies for academic rate based on their selections
  useEffect(() => {
    if (partOfAcademicOrNonProfitOrg && doingNonProfitWork) {
      setQualifiesForAcademicRate(true);
    } else {
      setQualifiesForAcademicRate(false);
    }
  }, [partOfAcademicOrNonProfitOrg, doingNonProfitWork]);

  // helper function to reset all user selections related to Stripe payment
  const resetSelections = () => {
    setPartOfAcademicOrNonProfitOrg(false);
    setDoingNonProfitWork(false);
    setTermsAcknowledged(false);
    setQualifiesForAcademicRate(false);
  };

  // when user changes purchase path method, reset Stripe selections to ensure they actively
  // select the relevant options for the new method they choose
  const handlePurchasePathChange = (method: PurchasePathOption) => {
    resetSelections();
    setPurchasePathOption(method);
  };

  const stripeUrlsAvailableForPipeline = !!getStripePaymentUrls(selectedPipeline?.pipelineName);

  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1rem' }}>
        <Spinner size={16} />
        <span style={{ color: '#666' }}>Loading pipeline...</span>
      </div>
    );
  }

  if (!selectedPipeline) {
    return <div style={{ color: '#666', fontSize: '14px' }}>Pipeline {pipelineName} not found.</div>;
  }

  return (
    <div>
      {/* button to go back to quotas page */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.75rem' }}>
        <ButtonSecondary
          onClick={() => Nav.goToPath('pipelines-quotas')}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <Icon icon='arrowLeft' size={16} />
          Back to all quotas
        </ButtonSecondary>
      </div>
      {/* display quota information for selected pipeline */}
      <PipelineWidgetContainer title='Selected pipeline for purchasing quota' width='80%'>
        <PipelineQuotaCard key={selectedPipeline.pipelineName} pipeline={selectedPipeline} showPurchaseButton={false} />
      </PipelineWidgetContainer>
      {/* display 2 quota purchasing options */}
      <div>
        <h3> How would you like to purchase quota?</h3>
        <div style={{ display: 'flex', gap: '1.5rem', width: '80%' }}>
          <PurchaseOptionCard
            title='Get Quote First & Pay Later'
            description='Fill out a form and we will contact you with the quote. Once you receive that, you can choose to pay via Purchase Order or Credit Card.'
            buttonText='Request Quote'
            onClick={() => handlePurchasePathChange('get-quote')}
            isSelected={purchasePathOption === 'get-quote'}
          />
          <PurchaseOptionCard
            title='Get Quote Now & Pay with Credit Card'
            description='Before you complete the purchase you will have the opportunity to see the quote and then pay with Credit Card.'
            buttonText='View Quote & Pay Now'
            onClick={() => handlePurchasePathChange('self-service')}
            isSelected={purchasePathOption === 'self-service'}
            disabled={!stripeUrlsAvailableForPipeline}
          />
        </div>
        {/* user selected Get Quote First & Pay Later option */}
        {purchasePathOption === 'get-quote' && <HubSpotFormSection />}
        {/* user selected Get Quote Now & Pay with Credit Card option */}
        {purchasePathOption === 'self-service' && stripeUrlsAvailableForPipeline && (
          <div style={{ marginTop: '2rem', paddingTop: '2rem', borderTop: '2px solid #e0e0e0', width: '80%' }}>
            <div style={{ fontSize: '18px', fontWeight: 600, marginBottom: '1rem' }}>Complete Payment</div>
            <div style={{ marginBottom: '1.5rem' }}>
              <div
                style={{
                  fontSize: '14px',
                  fontWeight: 600,
                  marginBottom: '0.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
              >
                <Icon icon='info-circle' size={16} style={{ color: '#5CC88D' }} />
                What to expect:
              </div>
              <ul style={{ margin: 0, paddingLeft: '2rem', fontSize: '14px', width: '80%' }}>
                <li style={{ marginBottom: '0.5rem' }}>Select your pipeline and organization type</li>
                <li style={{ marginBottom: '0.5rem' }}>
                  You will be redirected to Stripe for secure payment processing
                </li>
                <li style={{ marginBottom: '0.5rem' }}>
                  Select the quantity of quota you want to purchase in Stripe form
                </li>
                <li style={{ marginBottom: '0.5rem' }}>Complete payment securely through Stripe using Credit Card</li>
                <li style={{ marginBottom: '0.5rem' }}>
                  Once your payment is successful, your quota will be added to your account within 1 business day, and
                  you will receive an email confirmation as soon as it&apos;s available
                </li>
              </ul>
            </div>
            {/* Stripe form and logic for payment links */}
            <div style={{ width: '80%' }}>
              <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem' }}>
                  Select Pipeline <span style={{ color: '#d13212' }}>*</span>
                </div>
                <Select
                  id='pipeline-select'
                  aria-label={`selected pipeline ${selectedPipeline?.displayName}`}
                  value={selectedPipeline}
                  options={
                    uniquePipelines?.map((p) => ({
                      value: p,
                      label: p.displayName,
                    })) || []
                  }
                  onChange={(selectedOption) => {
                    // only update selected pipeline and URL if user selects a different pipeline than currently selected
                    if (selectedOption?.value && selectedOption.value.pipelineName !== selectedPipeline?.pipelineName) {
                      resetSelections();
                      setSelectedPipeline(selectedOption.value);
                      Nav.updateSearch({ pipeline: selectedOption.value.pipelineName });
                    }
                  }}
                  isClearable={false}
                />
              </div>
              <div style={{ marginBottom: '1.5rem' }}>
                <div
                  style={{
                    fontWeight: 600,
                    marginBottom: '0.75rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                  }}
                >
                  <span>
                    Check all of the following that apply to your organization and the work you are doing for your
                    organization with this quota?
                    <InfoBox size={16} side='right' style={{ marginLeft: '0.5rem', marginTop: '0.25rem' }}>
                      <div>
                        <strong>Academic organizations include:</strong>
                        <ul style={{ margin: '0.5rem 0', paddingLeft: '1.25rem' }}>
                          <li>Universities and colleges</li>
                          <li>Research institutions</li>
                          <li>Educational institutions</li>
                        </ul>
                        <strong>Non-profit organizations include:</strong>
                        <ul style={{ margin: '0.5rem 0', paddingLeft: '1.25rem' }}>
                          <li>Organizations with 501(c)(3) status or equivalent</li>
                          <li>Charitable organizations</li>
                          <li>Research foundations</li>
                        </ul>
                        <strong>Non-profit work</strong> means the research or activities are not conducted for
                        commercial purposes or financial gain.
                      </div>
                    </InfoBox>
                  </span>
                </div>
                <div>
                  <LabeledCheckbox
                    aria-label='checkbox for I am part of an academic or nonprofit organization'
                    checked={partOfAcademicOrNonProfitOrg}
                    onChange={setPartOfAcademicOrNonProfitOrg}
                    disabled={false}
                  >
                    <span style={{ marginLeft: '0.25rem' }}>I am part of an academic or nonprofit organization</span>
                  </LabeledCheckbox>
                </div>
                <div>
                  <LabeledCheckbox
                    aria-label='checkbox for The work I am doing is for non-profit activities'
                    checked={doingNonProfitWork}
                    onChange={setDoingNonProfitWork}
                    disabled={false}
                  >
                    <span style={{ marginLeft: '0.25rem' }}>The work I am doing is for non-profit activities</span>
                  </LabeledCheckbox>
                </div>
                <div
                  style={{
                    backgroundColor: '#E8F4FF',
                    padding: '1rem',
                    borderRadius: '6px',
                    marginBottom: '1.5rem',
                    marginTop: '1.5rem',
                    border: '1px solid #B3D9FF',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                    <Icon icon='lock' size={16} style={{ color: '#46A3E9', flexShrink: 0, marginTop: '0.1rem' }} />
                    <div style={{ fontSize: '13px', color: colors.dark(0.8) }}>
                      <strong>Secure Payment:</strong> All payments are processed securely through Stripe
                    </div>
                  </div>
                </div>
                <div
                  style={{
                    backgroundColor: '#FFF9E6',
                    padding: '1rem',
                    borderRadius: '6px',
                    marginBottom: '1.5rem',
                    border: '1px solid #FFE89E',
                  }}
                >
                  <LabeledCheckbox checked={termsAcknowledged} onChange={setTermsAcknowledged} disabled={false}>
                    <span style={{ fontSize: '14px', marginLeft: '0.5rem' }}>
                      I confirm that the information I have submitted is accurate and I am authorized to make this
                      request on behalf of my organization
                    </span>
                  </LabeledCheckbox>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
                <ButtonPrimary
                  disabled={!selectedPipeline || !termsAcknowledged || !stripeUrlsAvailableForPipeline}
                  style={{
                    backgroundColor: !selectedPipeline || !termsAcknowledged ? colors.dark(0.25) : '#5CC88D',
                    borderColor: !selectedPipeline || !termsAcknowledged ? colors.dark(0.4) : '#5CC88D',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                  }}
                  onClick={() => {
                    const stripePaymentUrlsForPipeline = getStripePaymentUrls(selectedPipeline?.pipelineName);

                    // safety check to ensure we have the payment URLs for the selected pipeline
                    // this should never happen because we disable the button if the URLs are not available
                    if (!stripePaymentUrlsForPipeline) {
                      return;
                    }

                    const paymentUrl = qualifiesForAcademicRate
                      ? stripePaymentUrlsForPipeline.academicRate
                      : stripePaymentUrlsForPipeline.forProfitRate;
                    window.open(paymentUrl, '_blank');
                  }}
                >
                  <Icon icon='creditCard' size={16} />
                  Pay with Card ({!qualifiesForAcademicRate ? 'For-Profit Rate' : 'Academic Rate'})
                </ButtonPrimary>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

interface PurchaseOptionCardProps {
  title: string;
  description: string;
  buttonText: string;
  onClick: () => void;
  isSelected: boolean;
  disabled?: boolean;
}

const PurchaseOptionCard: React.FC<PurchaseOptionCardProps> = ({
  title,
  description,
  buttonText,
  onClick,
  isSelected,
  disabled = false,
}) => {
  const [isHovered, setIsHovered] = useState(false);

  let borderColor = 'transparent';
  if (!disabled && (isSelected || isHovered)) {
    borderColor = '#074770';
  }

  const getBackgroundColor = () => {
    if (disabled) return '#f9f9f9';
    if (isSelected) return '#e3f1fc';
    return '#f4f6f9';
  };

  const getBoxShadow = () => {
    if (disabled) return 'none';
    if (isSelected || isHovered) return '0 4px 12px rgba(0,0,0,0.1)';
    return '0 2px 4px rgba(0,0,0,0.05)';
  };

  const getButtonBackgroundColor = () => {
    if (disabled) return colors.dark(0.25);
    if (isSelected) return '#5CC88D';
    return '#074770';
  };

  const cardContent = (
    <button
      type='button'
      disabled={disabled}
      style={{
        flex: 1,
        backgroundColor: getBackgroundColor(),
        borderRadius: '8px',
        padding: '1.5rem',
        border: `2px solid ${borderColor}`,
        transition: 'border-color 0.2s, box-shadow 0.2s, background-color 0.2s',
        boxShadow: getBoxShadow(),
        cursor: disabled ? 'not-allowed' : 'pointer',
        display: 'flex',
        flexDirection: 'column',
        textAlign: 'left',
        opacity: disabled ? 0.9 : 1,
      }}
      onMouseEnter={() => !disabled && setIsHovered(true)}
      onMouseLeave={() => !disabled && setIsHovered(false)}
      onClick={disabled ? undefined : onClick}
    >
      <div
        style={{
          fontSize: '18px',
          fontWeight: 600,
          marginBottom: '0.75rem',
          color: disabled ? colors.dark(0.5) : '#333F52',
          display: 'flex',
          alignItems: 'center',
        }}
      >
        {isSelected && !disabled && <Icon icon='check' size={20} style={{ color: '#5CC88D', marginRight: '0.5rem' }} />}
        {title}
      </div>
      <div
        style={{
          fontSize: '14px',
          color: disabled ? colors.dark(0.5) : colors.dark(0.7),
          marginBottom: '1.5rem',
          flex: 1,
        }}
      >
        {description}
      </div>
      <div
        style={{
          width: '100%',
          padding: '0.5rem 1rem',
          backgroundColor: getButtonBackgroundColor(),
          borderRadius: '4px',
          color: disabled ? colors.dark(0.5) : 'white',
          fontWeight: 500,
          textAlign: 'center',
          fontSize: '14px',
        }}
      >
        {buttonText}
      </div>
    </button>
  );

  if (disabled) {
    return (
      <div style={{ flex: 1 }}>
        <TooltipTrigger content='This option is currently unavailable for this pipeline' side='bottom'>
          <div style={{ width: '100%' }}>{cardContent}</div>
        </TooltipTrigger>
      </div>
    );
  }

  return cardContent;
};

const HubSpotFormSection = (): React.ReactElement => {
  return (
    <div style={{ marginTop: '2rem', paddingTop: '2rem', borderTop: '2px solid #e0e0e0', width: '80%' }}>
      <div style={{ fontSize: '18px', fontWeight: 600, marginBottom: '1rem' }}>Complete the Form</div>
      <div style={{ marginBottom: '1.5rem' }}>
        <p>
          Please fill and submit the below form. Our team will send you an email with a custom quote within 1-2
          business. days.
        </p>
      </div>

      <div style={{ marginBottom: '1.5rem' }}>
        <iframe
          src={TEASPOONS_HUBSPOT_URL}
          title='Request Quote Form'
          style={{
            width: '60%',
            height: '1525px',
            border: '1px solid #d6d9dc',
            borderRadius: '4px',
          }}
        />
      </div>
    </div>
  );
};
