import { ButtonPrimary, Icon, Link, Select, Spinner } from '@terra-ui-packages/components';
import { isEmpty } from 'lodash';
import React, { useEffect, useState } from 'react';
import { ClipboardButton } from 'src/components/ClipboardButton';
import FooterWrapper from 'src/components/FooterWrapper';
import { getPopupRoot } from 'src/components/popup-utils';
import { Metrics } from 'src/libs/ajax/Metrics';
import { Teaspoons } from 'src/libs/ajax/teaspoons/Teaspoons';
import { Pipeline, PipelineInput } from 'src/libs/ajax/teaspoons/teaspoons-models';
import Events from 'src/libs/events';
import * as Nav from 'src/libs/nav';
import { notify } from 'src/libs/notifications';
import { useCancellation } from 'src/libs/react-utils';
import {
  pipelinesTopBar,
  SCIENTIFIC_SERVICES_SUPPORT_EMAIL,
} from 'src/pages/scientificServices/pipelines/common/scientific-services-common';
import {
  PipelineFileInput,
  PipelineInputFileUploadState,
} from 'src/pages/scientificServices/pipelines/components/inputs/PipelineFileInput';
import { PipelineFloatInput } from 'src/pages/scientificServices/pipelines/components/inputs/PipelineFloatInput';
import { PipelineRunDescription } from 'src/pages/scientificServices/pipelines/components/inputs/PipelineRunDescription';
import { PipelineStringInput } from 'src/pages/scientificServices/pipelines/components/inputs/PipelineStringInput';
import { useUserQuota } from 'src/pages/scientificServices/pipelines/hooks/useUserQuota';
import { AoUStylizedString } from 'src/pages/scientificServices/pipelines/utils/AoUStylizedString';
import {
  preparePipelineRun,
  startPipelineRun,
  uploadPipelineFiles,
} from 'src/pages/scientificServices/pipelines/utils/submission-utils';
import { HelpfulTipsWidget } from 'src/pages/scientificServices/pipelines/widgets/HelpfulTipsWidget';
import { PipelineOutputsWidget } from 'src/pages/scientificServices/pipelines/widgets/PipelineOutputsWidget';
import { QuotaRemainingWidget } from 'src/pages/scientificServices/pipelines/widgets/QuotaRemainingWidget';

export const RunJob = () => {
  const signal = useCancellation();
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const [pipelinesList, setPipelinesList] = useState<Pipeline[]>([]);
  const [pipelineVersionOptions, setPipelineVersionOptions] = useState<{ value: Pipeline; label: string }[]>([]);
  const [uploadState, setUploadState] = useState<Record<string, PipelineInputFileUploadState>>({});
  const [preparedJobId, setPreparedJobId] = useState<string>();

  // Input parameter names for the selected pipeline
  const [pipelineInputs, setPipelineInputs] = useState<PipelineInput[]>([]);

  // User inputs for the run
  const [selectedPipeline, setSelectedPipeline] = useState<Pipeline>();
  const [runDescription, setRunDescription] = useState<string>('');
  const [selectedUserInputs, setSelectedUserInputs] = useState<Record<string, any>>({});
  const [validationErrors, setValidationErrors] = useState<Record<string, string | undefined>>({});

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submittedJobId, setSubmittedJobId] = useState<string>();

  // User quota for the selected pipeline
  const { quota, pipelineDetails, meetsMinimumQuota, isLoading: isLoadingQuota } = useUserQuota(selectedPipeline);

  const resetSelectedUserInputs = () => {
    const newSelectedUserInputs = pipelineInputs.reduce((acc, input) => {
      acc[input.name] = '';
      return acc;
    }, {});
    setSelectedUserInputs(newSelectedUserInputs);
  };

  const areAllRequiredInputsFilled = () => {
    return pipelineInputs.every((input) => {
      if (input.isRequired) {
        const value = selectedUserInputs[input.name];
        if (input.type === 'FILE') {
          return value instanceof File && value.name && value.name.endsWith(input.fileSuffix || '');
        }
        return value && value.trim() !== '';
      }
      return true;
    });
  };

  // Handles updating the input validation map
  const handleInputValidation = (inputName: string, error?: string) => {
    setValidationErrors((prev) => {
      if (!error) {
        const { [inputName]: _, ...rest } = prev;
        return rest;
      }
      return {
        ...prev,
        [inputName]: error,
      };
    });
  };

  async function onUploadComplete(jobId: string) {
    const submittedJobId = await startPipelineRun(jobId);
    setSubmittedJobId(submittedJobId);
    setIsSubmitting(false);
  }

  useEffect(() => {
    // Update selected user inputs when pipeline inputs change IS THIS RIGHT???
    resetSelectedUserInputs();
  }, [pipelineInputs]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    // Update pipeline inputs when pipeline details change
    if (pipelineDetails?.inputs) {
      setPipelineInputs(pipelineDetails.inputs);
    }
  }, [pipelineDetails]);

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      const response = await Teaspoons(signal).getPipelines();

      const options = response.results.map((pipeline) => ({
        value: pipeline,
        label: `${pipeline.displayName} - v${pipeline.pipelineVersion}`,
      }));

      setPipelinesList(response.results);
      setPipelineVersionOptions(options);

      // Automatically select the first pipeline if there's only one available
      if (response.results.length === 1) {
        setSelectedPipeline(response.results[0]);
      }

      setIsLoading(false);
    }
    fetchData();
  }, [signal]);

  const handleSubmit = async () => {
    if (!selectedPipeline) {
      notify('error', 'Missing required fields');
      return;
    }

    const pipeline = pipelinesList?.find((pipeline) => pipeline?.pipelineVersion === selectedPipeline?.pipelineVersion);
    const pipelineName = pipeline?.pipelineName;

    // Only proceed if we have a valid pipeline name
    if (!pipelineName) {
      notify('error', 'No pipeline selected or pipeline name not found');
      return;
    }

    setIsSubmitting(true);

    const { jobId: preparedJobId, fileInputUploadUrls } = await preparePipelineRun(
      pipelineName,
      selectedPipeline.pipelineVersion,
      selectedUserInputs,
      runDescription
    );

    setPreparedJobId(preparedJobId);

    try {
      await uploadPipelineFiles(
        pipelineName,
        selectedPipeline.pipelineVersion,
        pipelineInputs,
        selectedUserInputs,
        fileInputUploadUrls,
        setUploadState
      );

      await onUploadComplete(preparedJobId);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '';
      console.error(errorMessage);
    } finally {
      Metrics().captureEvent(Events.teaspoons.submitJob, {
        pipelineName,
        pipelineVersion: selectedPipeline.pipelineVersion,
      });
    }
  };

  return (
    <FooterWrapper alwaysShow>
      {pipelinesTopBar('run job')}
      <div style={{ display: 'flex', justifyContent: 'space-between', margin: '1rem 2rem' }}>
        <div style={{ flex: 1, marginRight: '2rem' }}>
          <h3 style={{ marginBottom: '0.5rem' }}>
            Select a pipeline version <span style={{ color: '#DB3214' }}>*</span>
          </h3>
          <div style={{ marginBottom: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ width: 400 }}>
                <Select
                  aria-label={`selected pipeline ${selectedPipeline?.displayName}`}
                  isDisabled={isEmpty(pipelineVersionOptions)}
                  value={selectedPipeline}
                  options={pipelineVersionOptions}
                  getOptionLabel={(r) => r.label}
                  onChange={(r) => {
                    if (r === null) {
                      return;
                    }
                    setSelectedPipeline(r.value);
                  }}
                  menuPortalTarget={getPopupRoot()}
                />
              </div>
              {isEmpty(pipelineVersionOptions) && <Spinner />}
            </div>
            {selectedPipeline && (
              <div style={{ width: '400px', marginTop: '0.5rem' }}>
                <AoUStylizedString
                  text={
                    pipelinesList.find((pipeline) => pipeline.pipelineVersion === selectedPipeline.pipelineVersion)
                      ?.description
                  }
                />
              </div>
            )}
          </div>

          {!isLoading && !isLoadingQuota && (
            <>
              {/* Displays all STRING inputs, one after another */}
              {pipelineInputs
                .filter((input) => input.type === 'STRING')
                .map((input) => {
                  return (
                    <PipelineStringInput
                      input={input}
                      onChange={(value) =>
                        setSelectedUserInputs((prev) => ({
                          ...prev,
                          [input.name]: value,
                        }))
                      }
                      onValidation={(error) => handleInputValidation(input.name, error)}
                      validationError={validationErrors[input.name]}
                      value={selectedUserInputs[input.name]}
                      key={`${input.name}`}
                    />
                  );
                })}

              {/* Displays all FLOAT inputs, one after another */}
              {pipelineInputs
                .filter((input) => input.type === 'FLOAT')
                .map((input) => {
                  return (
                    <PipelineFloatInput
                      input={input}
                      onChange={(value) =>
                        setSelectedUserInputs((prev) => ({
                          ...prev,
                          [input.name]: value,
                        }))
                      }
                      onValidation={(error) => handleInputValidation(input.name, error)}
                      validationError={validationErrors[input.name]}
                      value={selectedUserInputs[input.name]}
                      key={`${input.name}`}
                    />
                  );
                })}

              {/* Displays optional run description */}
              {selectedPipeline && <PipelineRunDescription value={runDescription} onChange={setRunDescription} />}

              {/* Displays all FILE inputs, one after another */}
              {pipelineInputs
                .filter((input) => input.type === 'FILE')
                .map((input) => {
                  return (
                    <PipelineFileInput
                      key={`${input.name}`}
                      input={input}
                      uploadState={uploadState[input.name]}
                      selectedFile={selectedUserInputs[input.name] || null}
                      setUploadState={setUploadState}
                      onValidation={(error) => handleInputValidation(input.name, error)}
                      validationError={validationErrors[input.name]}
                      onUploadComplete={preparedJobId ? () => onUploadComplete(preparedJobId) : undefined}
                      onFileSelect={(file) => {
                        setSelectedUserInputs((prev) => ({
                          ...prev,
                          [input.name]: file,
                        }));
                      }}
                    />
                  );
                })}
              {/* Submit button */}
              {!submittedJobId && quota && (
                <>
                  {!meetsMinimumQuota && (
                    <div
                      style={{
                        marginTop: '1rem',
                        width: '500px',
                        border: '1px solid #8f95a0',
                        borderRadius: '4px',
                        padding: '1rem',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                        }}
                      >
                        <Icon icon='warning-standard' size={36} style={{ color: '#DB3214', marginRight: '1rem' }} />
                        <div>
                          You do not have enough quota remaining to run this pipeline. Please{' '}
                          <Link
                            href={`mailto:${SCIENTIFIC_SERVICES_SUPPORT_EMAIL}?subject=Request%20a%20quote%20for%20quota`}
                            style={{ color: '#46A3E9', fontWeight: 'bold' }}
                          >
                            request a quote
                          </Link>{' '}
                          for additional quota.
                        </div>
                      </div>
                    </div>
                  )}
                  <ButtonPrimary
                    disabled={
                      isSubmitting ||
                      !areAllRequiredInputsFilled() ||
                      !meetsMinimumQuota ||
                      Object.keys(validationErrors).length > 0
                    }
                    style={{ margin: '1rem 0', padding: '1rem', fontSize: '1rem', width: 500 }}
                    onClick={handleSubmit}
                  >
                    {isSubmitting ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}>
                        <Spinner />
                        Submitting...
                      </div>
                    ) : (
                      'Submit'
                    )}
                  </ButtonPrimary>
                </>
              )}
              {submittedJobId && (
                <>
                  <div>
                    <div
                      style={{
                        width: 500,
                        border: '1px solid #8f95a0',
                        borderRadius: '4px',
                        padding: '1rem',
                        marginTop: '1rem',
                        backgroundColor: '#fff',
                        display: 'flex',
                        flexDirection: 'row',
                        alignItems: 'center',
                      }}
                    >
                      <Icon icon='success-standard' size={36} style={{ color: '#74AE43', margin: '0 1rem' }} />
                      <div>
                        Your job has been submitted. You can check the status of that job by going to the{' '}
                        <Link style={{ color: '#46A3E9' }} href={Nav.getLink('pipelines-history')}>
                          Job History
                        </Link>{' '}
                        tab.
                        <div style={{ marginTop: '1rem' }}>
                          <span style={{ fontWeight: 'bold' }}>Job ID:</span> <code>{submittedJobId}</code>
                          <ClipboardButton style={{ marginLeft: '0.5rem' }} text={submittedJobId} />
                        </div>
                      </div>
                    </div>
                  </div>
                  <ButtonPrimary
                    disabled={!selectedPipeline || isSubmitting}
                    style={{ margin: '1rem 0', padding: '1rem', fontSize: '1rem', width: 500 }}
                    onClick={() => {
                      resetSelectedUserInputs();
                      setRunDescription('');
                      setSubmittedJobId(undefined);
                      setUploadState({});
                    }}
                  >
                    Run another job
                  </ButtonPrimary>
                </>
              )}
            </>
          )}
          {(isLoading || isLoadingQuota) && (
            <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Spinner /> Loading pipeline details...
            </div>
          )}
        </div>
        <div>
          <QuotaRemainingWidget selectedPipeline={selectedPipeline} />
          <PipelineOutputsWidget selectedPipelineDetails={pipelineDetails} />
          <HelpfulTipsWidget selectedPipeline={selectedPipeline} />
        </div>
      </div>
    </FooterWrapper>
  );
};
