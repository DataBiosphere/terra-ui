import { ButtonPrimary, Icon, Link, Select, Spinner } from '@terra-ui-packages/components';
import { isEmpty } from 'lodash';
import React, { ReactNode, useEffect, useState } from 'react';
import { ClipboardButton } from 'src/components/ClipboardButton';
import { LabeledCheckbox } from 'src/components/common';
import { getPopupRoot } from 'src/components/popup-utils';
import { Metrics } from 'src/libs/ajax/Metrics';
import { Pipeline, PipelineInput } from 'src/libs/ajax/teaspoons/teaspoons-models';
import colors from 'src/libs/colors';
import Events from 'src/libs/events';
import * as Nav from 'src/libs/nav';
import { useRoute } from 'src/libs/nav';
import { notify } from 'src/libs/notifications';
import { PipelinesLayout } from 'src/pages/scientificServices/pipelines/common/PipelinesLayout';
import { SCIENTIFIC_SERVICES_SUPPORT_EMAIL } from 'src/pages/scientificServices/pipelines/common/scientific-services-common';
import { useUserQuota } from 'src/pages/scientificServices/pipelines/hooks/useUserQuota';
import { PipelineBooleanInput } from 'src/pages/scientificServices/pipelines/tabs/run/inputs/boolean/PipelineBooleanInput';
import {
  PipelineFileBasedInput,
  PipelineInputFileUploadState,
} from 'src/pages/scientificServices/pipelines/tabs/run/inputs/file/PipelineFileBasedInput';
import { PipelineFloatInput } from 'src/pages/scientificServices/pipelines/tabs/run/inputs/float/PipelineFloatInput';
import { PipelineRunDescription } from 'src/pages/scientificServices/pipelines/tabs/run/inputs/PipelineRunDescription';
import { PipelineStringInput } from 'src/pages/scientificServices/pipelines/tabs/run/inputs/string/PipelineStringInput';
import { HelpfulTipsWidget } from 'src/pages/scientificServices/pipelines/tabs/run/widgets/HelpfulTipsWidget';
import { PipelineOutputsWidget } from 'src/pages/scientificServices/pipelines/tabs/run/widgets/PipelineOutputsWidget';
import { QuotaDetailsWidget } from 'src/pages/scientificServices/pipelines/tabs/run/widgets/QuotaDetailsWidget';
import { AoUStylizedString } from 'src/pages/scientificServices/pipelines/utils/AoUStylizedString';
import { isFileLikeType } from 'src/pages/scientificServices/pipelines/utils/file-utils';
import {
  preparePipelineRun,
  startPipelineRun,
  uploadPipelineFiles,
} from 'src/pages/scientificServices/pipelines/utils/submission-utils';
import { GCS_PATH_VALIDATION_REGEX } from 'src/pages/scientificServices/pipelines/utils/upload-utils';

interface RunJobContentProps {
  pipelines: Pipeline[];
}

const RunJobContent = ({ pipelines: pipelinesList }: RunJobContentProps) => {
  const [pipelineVersionOptions, setPipelineVersionOptions] = useState<{ value: Pipeline; label: string }[]>([]);
  const [uploadState, setUploadState] = useState<Record<string, PipelineInputFileUploadState>>({});
  const [preparedJobId, setPreparedJobId] = useState<string>();

  // Input parameter names for the selected pipeline
  const [pipelineInputs, setPipelineInputs] = useState<PipelineInput[]>([]);

  // User inputs for the run
  const [selectedPipeline, setSelectedPipeline] = useState<Pipeline>();
  const [runDescription, setRunDescription] = useState<string>('');
  const [selectedUserInputs, setSelectedUserInputs] = useState<Record<string, any>>({});
  const [validationErrors, setValidationErrors] = useState<Record<string, ReactNode | undefined>>({});
  const [sharingConfirmedFiles, setSharingConfirmedFiles] = useState<Record<string, boolean>>({});

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submittedJobId, setSubmittedJobId] = useState<string>();
  const [agreeToTerms, setAgreeToTerms] = useState<boolean>(false);

  const { quota, pipelineDetails, meetsMinimumQuota, isLoading: isLoadingQuota } = useUserQuota(selectedPipeline);

  const resetSelectedUserInputs = () => {
    const newSelectedUserInputs = pipelineInputs.reduce((acc, input) => {
      acc[input.name] = '';
      return acc;
    }, {});
    setSelectedUserInputs(newSelectedUserInputs);
  };

  const areInputsValid = () => {
    return pipelineInputs.every((input) => {
      const value = selectedUserInputs[input.name];

      // for non-file inputs, check that a non-empty value is provided if the input is required
      if (input.isRequired && !isFileLikeType(input.type)) {
        return value && value.trim() !== '';
      }

      // Required file inputs must include either a File object or a GCS path (with sharing confirmed).
      // Optional file inputs may be blank, but if provided they follow the same validation rules.
      if (isFileLikeType(input.type) && (input.isRequired || value)) {
        // Allow either a File object (local upload) or a string (gs cloud path)
        if (typeof value === 'string') {
          // For GCS paths, require sharing confirmation
          return (
            GCS_PATH_VALIDATION_REGEX.test(value) &&
            value.endsWith(input.fileSuffix || '') &&
            sharingConfirmedFiles[input.name]
          );
        }
        return value instanceof File && value.name && value.name.endsWith(input.fileSuffix || '');
      }
      return true;
    });
  };

  // Handles updating the input validation map
  const handleInputValidation = (inputName: string, error?: ReactNode) => {
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

  const handleSharingConfirmationChange = (inputName: string, isConfirmed: boolean) => {
    setSharingConfirmedFiles((prev) => ({
      ...prev,
      [inputName]: isConfirmed,
    }));
  };

  async function onUploadComplete(jobId: string) {
    const submittedJobId = await startPipelineRun(jobId);
    setSubmittedJobId(submittedJobId);
    setIsSubmitting(false);
  }

  const handlePipelineSubmissionError = async (error: unknown, fallbackMessage: string) => {
    let errorMessage = fallbackMessage;

    if (error instanceof Response) {
      try {
        const errorData = await error.json();
        errorMessage = errorData.message || fallbackMessage;
      } catch {
        // If parsing fails, use the fallback message
        errorMessage = fallbackMessage;
      }
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }

    notify('error', `Error: ${errorMessage}`);
    setIsSubmitting(false);
  };

  useEffect(() => {
    // Clear selected user inputs when pipeline inputs change
    resetSelectedUserInputs();
  }, [pipelineInputs]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    // Update pipeline inputs when pipeline details change
    if (pipelineDetails?.inputs) {
      setPipelineInputs(pipelineDetails.inputs);
    }
  }, [pipelineDetails]);

  const { query } = useRoute();

  useEffect(() => {
    if (pipelinesList && pipelinesList.length > 0) {
      const options = pipelinesList.map((pipeline) => ({
        value: pipeline,
        label: `${pipeline.displayName} - v${pipeline.pipelineVersion}`,
      }));

      setPipelineVersionOptions(options);

      // If query params are provided, try to find the matching pipeline
      const { pipelineName, version } = query as { pipelineName?: string; version?: string };
      if (pipelineName) {
        const matchingPipelines = pipelinesList.filter((p) => p.pipelineName === pipelineName);
        if (matchingPipelines.length > 0) {
          if (version) {
            const versionNumber = parseInt(version);
            const exactMatch = matchingPipelines.find((p) => p.pipelineVersion === versionNumber);
            setSelectedPipeline(exactMatch ?? matchingPipelines[0]);
          } else {
            // Default to the first match (assumed to be the latest version)
            setSelectedPipeline(matchingPipelines[0]);
          }
          return;
        }
      }

      // Automatically select the most recent pipeline (default behavior)
      setSelectedPipeline(pipelinesList[0]);
    }
  }, [pipelinesList]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmit = async () => {
    if (!selectedPipeline) {
      // This should not happen as the submit button is disabled when no pipeline is selected,
      // but it's helpful as a type-guard here since Typescript obviously can't infer that
      notify('error', 'Please select a pipeline before submitting.');
      return;
    }

    // This should not happen as the submit button is disabled when the checkbox is unselected,
    // but it's helpful as a type-guard here
    if (!agreeToTerms) {
      notify(
        'error',
        'You must agree to the Scientific Services Terms of Service and Acceptable Use Policy before submitting a job.'
      );
      return;
    }

    const pipelineName = selectedPipeline.pipelineName;
    const pipelineVersion = selectedPipeline.pipelineVersion;

    // Filter out empty string inputs to avoid sending them to the backend.
    // At this point we've already validated required inputs are filled, so this
    // will only remove optional inputs that the user left blank.
    const filteredUserInputs = Object.fromEntries(
      Object.entries(selectedUserInputs).filter(([_, value]) => value !== '')
    );

    setIsSubmitting(true);

    let preparedJobId: string;
    let fileInputUploadUrls: Record<string, { signedUrl: string }>;

    // Prepare pipeline run
    try {
      const result = await preparePipelineRun(
        pipelineName,
        pipelineVersion,
        filteredUserInputs,
        runDescription,
        agreeToTerms
      );
      preparedJobId = result.jobId;
      fileInputUploadUrls = result.fileInputUploadUrls;
      setPreparedJobId(preparedJobId);
    } catch (error) {
      handlePipelineSubmissionError(error, 'Failed to prepare pipeline run');
      return;
    }

    // Upload pipeline input files (only if there are local files to upload)
    const hasLocalFilesToUpload = pipelineInputs
      .filter((input) => isFileLikeType(input.type))
      .some((input) => filteredUserInputs[input.name] instanceof File);

    if (hasLocalFilesToUpload) {
      try {
        await uploadPipelineFiles(
          pipelineName,
          pipelineVersion,
          pipelineInputs,
          filteredUserInputs,
          fileInputUploadUrls,
          setUploadState
        );
      } catch (error) {
        handlePipelineSubmissionError(error, 'File upload failed');
        return;
      }
    }

    // Submit the pipeline run
    try {
      await onUploadComplete(preparedJobId);
    } catch (error) {
      handlePipelineSubmissionError(error, 'Failed to start pipeline run');
      return;
    }

    setIsSubmitting(false);
    Metrics().captureEvent(Events.teaspoons.submitJob, {
      pipelineName,
      pipelineVersion,
    });
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', margin: '1rem 2rem' }}>
      <div style={{ flex: 1, marginRight: '2rem' }}>
        <h3 style={{ marginBottom: '0.5rem' }}>
          Select a pipeline version <span style={{ color: colors.danger() }}>*</span>
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
                  Nav.updateSearch({ pipelineName: r.value.pipelineName, version: r.value.pipelineVersion });
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

        {!isEmpty(pipelineInputs) && !isLoadingQuota && (
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

            {/* Displays all BOOLEAN inputs, one after another */}
            {pipelineInputs
              .filter((input) => input.type === 'BOOLEAN')
              .map((input) => {
                return (
                  <PipelineBooleanInput
                    value={selectedUserInputs[input.name]}
                    input={input}
                    key={`${input.name}`}
                    onChange={(value) => {
                      setSelectedUserInputs((prev) => ({
                        ...prev,
                        [input.name]: value,
                      }));
                    }}
                  />
                );
              })}

            {/* Displays all FILE or MANIFEST inputs, one after another */}
            {pipelineInputs
              .filter((input) => isFileLikeType(input.type))
              .map((input) => {
                return (
                  <PipelineFileBasedInput
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
                    onSharingConfirmationChange={handleSharingConfirmationChange}
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
                      <Icon icon='warning-standard' size={36} style={{ color: colors.danger(), marginRight: '1rem' }} />
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
                <div style={{ marginTop: '2rem' }}>
                  <LabeledCheckbox checked={agreeToTerms} onChange={setAgreeToTerms}>
                    <span>
                      {' '}
                      I have read and agree to the{' '}
                      <Link
                        href={Nav.getLink('scientific-services-terms-of-service', {}, { document: 'termsOfService' })}
                        target='_blank'
                        rel='noopener noreferrer'
                        style={{ color: '#46A3E9' }}
                      >
                        Scientific Services Terms of Service and Acceptable Use Policy
                      </Link>
                      <span style={{ color: colors.danger(), fontWeight: 'bold' }}> *</span>
                    </span>
                  </LabeledCheckbox>
                </div>
                <ButtonPrimary
                  disabled={
                    isSubmitting ||
                    !areInputsValid() ||
                    !meetsMinimumQuota ||
                    Object.keys(validationErrors).length > 0 ||
                    !agreeToTerms
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
                    <Icon icon='success-standard' size={36} style={{ color: colors.success(), margin: '0 1rem' }} />
                    <div>
                      Your job has been submitted. You can check the status of that job by going to the{' '}
                      <Link
                        style={{ color: '#46A3E9' }}
                        href={Nav.getLink('pipelines-job-detail', { jobId: submittedJobId })}
                      >
                        Job Details
                      </Link>{' '}
                      page.
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
                    setAgreeToTerms(false);
                  }}
                >
                  Run another job
                </ButtonPrimary>
              </>
            )}
          </>
        )}
        {(isEmpty(pipelineInputs) || isLoadingQuota) && (
          <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Spinner /> Loading pipeline details...
          </div>
        )}
      </div>
      <div>
        <QuotaDetailsWidget selectedPipeline={selectedPipeline} />
        <PipelineOutputsWidget selectedPipelineDetails={pipelineDetails} />
        <HelpfulTipsWidget selectedPipeline={selectedPipeline} />
      </div>
    </div>
  );
};

export const RunJob = () => {
  return <PipelinesLayout activeTab='run job' render={({ pipelines }) => <RunJobContent pipelines={pipelines} />} />;
};
