import { ButtonSecondary, Icon, Spinner } from '@terra-ui-packages/components';
import React, { useEffect, useRef, useState } from 'react';
import { Metrics } from 'src/libs/ajax/Metrics';
import { Pipeline } from 'src/libs/ajax/teaspoons/teaspoons-models';
import Events, { MetricsEventName } from 'src/libs/events';
import * as Nav from 'src/libs/nav';
import { PurchaseOptionCard } from 'src/pages/scientificServices/pipelines/account/sections/PurchaseOptionCard';
import {
  HubSpotFormSection,
  StripePaymentFormSection,
} from 'src/pages/scientificServices/pipelines/account/sections/PurchaseQuotaFormSections';
import { PipelineQuotaCard } from 'src/pages/scientificServices/pipelines/common/PipelineQuotaCard';
import {
  clearInProgressPurchase,
  getInProgressPurchase,
  getStripePaymentUrls,
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

  // track previous pipeline to detect external URL changes
  const prevPipelineNameRef = useRef<string | undefined>(undefined);

  const [nonProfitPrefill, setNonProfitPrefill] = useState<
    { nonProfitOrganization: boolean; nonProfitActivities: boolean } | undefined
  >(undefined);

  // if a purchase was in progress for this pipeline (persisted through e.g. a login redirect),
  // pre-fill its selections and clear it from local storage now that it's been consumed
  useEffect(() => {
    const inProgressPurchase = getInProgressPurchase();
    if (inProgressPurchase && inProgressPurchase.pipeline === pipelineName) {
      setPurchasePathOption('self-service');
      setNonProfitPrefill({
        nonProfitOrganization: inProgressPurchase.nonProfitOrganization,
        nonProfitActivities: inProgressPurchase.nonProfitActivities,
      });
      clearInProgressPurchase();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // reset everything if pipelineName changed externally through URL (not from our dropdown)
  useEffect(() => {
    if (
      prevPipelineNameRef.current !== undefined &&
      prevPipelineNameRef.current !== pipelineName &&
      selectedPipeline?.pipelineName !== pipelineName
    ) {
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

  // when user changes purchase path method, reset Stripe selections to ensure they actively
  // select the relevant options for the new method they choose
  const handlePurchasePathChange = (method: PurchasePathOption, metricEventName: MetricsEventName) => {
    Metrics().captureEvent(metricEventName, {
      pipelineName: selectedPipeline?.pipelineName,
      pipelineVersion: selectedPipeline?.pipelineVersion,
    });
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
          All quotas
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
            onClick={() => handlePurchasePathChange('get-quote', Events.teaspoons.hubspotFormOptionSelect)}
            isSelected={purchasePathOption === 'get-quote'}
          />
          <PurchaseOptionCard
            title='Get Quote Now & Pay with Credit Card'
            description='Before you complete the purchase you will have the opportunity to see the quote and then pay with Credit Card.'
            buttonText='View Quote & Pay Now'
            onClick={() => handlePurchasePathChange('self-service', Events.teaspoons.stripeOptionSelect)}
            isSelected={purchasePathOption === 'self-service'}
            disabled={!stripeUrlsAvailableForPipeline}
          />
        </div>
        {/* user selected Get Quote First & Pay Later option */}
        {purchasePathOption === 'get-quote' && <HubSpotFormSection />}
        {/* user selected Get Quote Now & Pay with Credit Card option */}
        {purchasePathOption === 'self-service' && stripeUrlsAvailableForPipeline && (
          <StripePaymentFormSection
            selectedPipeline={selectedPipeline}
            uniquePipelines={uniquePipelines}
            initialPartOfAcademicOrNonProfitOrg={nonProfitPrefill?.nonProfitOrganization}
            initialDoingNonProfitWork={nonProfitPrefill?.nonProfitActivities}
            onPipelineChange={(newPipeline) => {
              setSelectedPipeline(newPipeline);
              Nav.updateSearch({ pipeline: newPipeline.pipelineName });
            }}
          />
        )}
      </div>
    </div>
  );
};
