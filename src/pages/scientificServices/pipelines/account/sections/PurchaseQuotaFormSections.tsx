import { ButtonPrimary, Icon, InfoBox, Select } from '@terra-ui-packages/components';
import React, { useEffect, useState } from 'react';
import { LabeledCheckbox } from 'src/components/common';
import { Metrics } from 'src/libs/ajax/Metrics';
import { Pipeline } from 'src/libs/ajax/teaspoons/teaspoons-models';
import colors from 'src/libs/colors';
import Events from 'src/libs/events';
import {
  getStripePaymentUrls,
  TEASPOONS_HUBSPOT_URL,
} from 'src/pages/scientificServices/pipelines/common/purchaseQuotaUtils';

export const HubSpotFormSection = (): React.ReactElement => {
  return (
    <div style={{ marginTop: '2rem', paddingTop: '2rem', borderTop: '2px solid #e0e0e0', width: '80%' }}>
      <div style={{ fontSize: '18px', fontWeight: 600, marginBottom: '1rem' }}>Complete the Form</div>
      <div style={{ marginBottom: '1.5rem' }}>
        <p>
          Please fill and submit the below form. Our team will send you an email with a custom quote within 1-2 business
          days.
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

interface StripePaymentFormSectionProps {
  selectedPipeline: Pipeline | undefined;
  uniquePipelines: Pipeline[] | undefined;
  onPipelineChange: (pipeline: Pipeline) => void;
}

export const StripePaymentFormSection: React.FC<StripePaymentFormSectionProps> = ({
  selectedPipeline,
  uniquePipelines,
  onPipelineChange,
}) => {
  const [partOfAcademicOrNonProfitOrg, setPartOfAcademicOrNonProfitOrg] = useState(false);
  const [doingNonProfitWork, setDoingNonProfitWork] = useState(false);
  const [termsAcknowledged, setTermsAcknowledged] = useState(false);

  const qualifiesForAcademicRate = partOfAcademicOrNonProfitOrg && doingNonProfitWork;
  const stripeUrlsAvailableForPipeline = !!getStripePaymentUrls(selectedPipeline?.pipelineName);

  const resetSelections = () => {
    setPartOfAcademicOrNonProfitOrg(false);
    setDoingNonProfitWork(false);
    setTermsAcknowledged(false);
  };

  const handlePayWithCardClick = () => {
    const stripePaymentUrlsForPipeline = getStripePaymentUrls(selectedPipeline?.pipelineName);
    if (!stripePaymentUrlsForPipeline) return;

    const paymentUrl = qualifiesForAcademicRate
      ? stripePaymentUrlsForPipeline.academicRate
      : stripePaymentUrlsForPipeline.forProfitRate;

    Metrics().captureEvent(Events.teaspoons.payWithCardClick, {
      pipelineName: selectedPipeline?.pipelineName,
      pipelineVersion: selectedPipeline?.pipelineVersion,
      rateType: qualifiesForAcademicRate ? 'academic' : 'for-profit',
    });

    window.open(paymentUrl, '_blank');
  };

  useEffect(() => {
    resetSelections();
  }, [selectedPipeline?.pipelineName]);

  return (
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
          <li style={{ marginBottom: '0.5rem' }}>You will be redirected to Stripe for secure payment processing</li>
          <li style={{ marginBottom: '0.5rem' }}>Select the quantity of quota you want to purchase in Stripe form</li>
          <li style={{ marginBottom: '0.5rem' }}>Complete payment securely through Stripe using Credit Card</li>
          <li style={{ marginBottom: '0.5rem' }}>
            Once your payment is successful, your quota will be added to your account within 1 business day, and you
            will receive an email confirmation as soon as it&apos;s available
          </li>
        </ul>
      </div>
      {/* Stripe form selection */}
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
              if (selectedOption?.value && selectedOption.value.pipelineName !== selectedPipeline?.pipelineName) {
                onPipelineChange(selectedOption.value);
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
            <span style={{ display: 'flex', alignItems: 'center' }}>
              Check all of the following that apply to your organization and the work you are doing for your
              organization with this quota
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
                  <strong>Non-profit work</strong> means the research or activities are not conducted for commercial
                  purposes or financial gain.
                </div>
              </InfoBox>
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div>
              <LabeledCheckbox
                aria-label='checkbox for I am part of an academic or nonprofit organization'
                checked={partOfAcademicOrNonProfitOrg}
                onChange={setPartOfAcademicOrNonProfitOrg}
                disabled={false}
              >
                <span style={{ marginLeft: '0.25rem' }}>I am part of an academic or non-profit organization</span>
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Icon icon='lock' size={16} style={{ color: '#46A3E9', flexShrink: 0 }} />
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
                I confirm that the information I have submitted is accurate and I am authorized to make this request on
                behalf of my organization
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
            onClick={handlePayWithCardClick}
          >
            <Icon icon='creditCard' size={16} />
            Pay with Card ({qualifiesForAcademicRate ? 'Academic Rate' : 'For-Profit Rate'})
          </ButtonPrimary>
        </div>
      </div>
    </div>
  );
};
