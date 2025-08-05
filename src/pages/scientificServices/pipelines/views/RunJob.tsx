import { ButtonPrimary, Icon, Link, Select, Spinner } from '@terra-ui-packages/components';
import { isEmpty } from 'lodash';
import React, { useEffect, useState } from 'react';
import { ClipboardButton } from 'src/components/ClipboardButton';
import FooterWrapper from 'src/components/FooterWrapper';
import { getPopupRoot } from 'src/components/popup-utils';
import { Teaspoons } from 'src/libs/ajax/teaspoons/Teaspoons';
import { Pipeline, PipelineInput } from 'src/libs/ajax/teaspoons/teaspoons-models';
import * as Nav from 'src/libs/nav';
import { notify } from 'src/libs/notifications';
import { useCancellation } from 'src/libs/react-utils';
import { pipelinesTopBar } from 'src/pages/scientificServices/pipelines/common/scientific-services-common';
import { PipelineFileInput } from 'src/pages/scientificServices/pipelines/components/inputs/PipelineFileInput';
import { PipelineRunDescription } from 'src/pages/scientificServices/pipelines/components/inputs/PipelineRunDescription';
import { PipelineStringInput } from 'src/pages/scientificServices/pipelines/components/inputs/PipelineStringInput';
import { HelpfulTipsWidget } from 'src/pages/scientificServices/pipelines/widgets/HelpfulTipsWidget';
import { QuotaRemainingWidget } from 'src/pages/scientificServices/pipelines/widgets/QuotaRemainingWidget';

async function uploadFileWithSignedUrl(inputFile, signedUrl) {
  return await fetch(signedUrl, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/octet-stream' },
    body: inputFile,
  });
}

export async function prepareUploadStartPipelineRun(
  pipelineName: string,
  pipelineVersion: number,
  selectedUserInputs: Record<string, any>,
  description: string,
  pipelineInputs: PipelineInput[]
): Promise<string> {
  const jobId = crypto.randomUUID();

  const finalInputs = Object.entries(selectedUserInputs).reduce((acc, [key, value]) => {
    if (value instanceof File) {
      acc[key] = value.name; // Use the file name for File inputs
    } else {
      acc[key] = value; // All other inputs can be used as-is
    }
    return acc;
  }, {});

  console.log(finalInputs);

  const { fileInputUploadUrls } = await Teaspoons().preparePipelineRun(
    jobId,
    pipelineName,
    pipelineVersion,
    finalInputs,
    description
  );

  // Gather all FILE inputs and upload them one by one
  pipelineInputs
    .filter((input) => input.type === 'FILE')
    .map(async (input) => {
      const file = selectedUserInputs[input.name];
      const signedUrl = fileInputUploadUrls[input.name].signedUrl;
      if (file instanceof File) {
        // Upload the file using the signed URL
        return uploadFileWithSignedUrl(file, signedUrl);
      }
      throw new Error(`Expected a File for input ${input.name}, but got ${typeof file}`);
    });

  await Teaspoons().startPipelineRun(jobId);
  return jobId;
}

export const RunJob = () => {
  const signal = useCancellation();
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const [pipelinesList, setPipelinesList] = useState<Pipeline[]>([]);
  const [pipelineVersionOptions, setPipelineVersionOptions] = useState<{ value: Pipeline; label: string }[]>([]);

  // Input parameter names for the selected pipeline
  const [pipelineInputs, setPipelineInputs] = useState<PipelineInput[]>([]);

  // User inputs for the run
  const [selectedPipeline, setSelectedPipeline] = useState<Pipeline>();
  const [runDescription, setRunDescription] = useState<string>('');
  const [selectedUserInputs, setSelectedUserInputs] = useState<Record<string, any>>({});

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submittedJobId, setSubmittedJobId] = useState<string>();

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
          return value instanceof File && value.name;
        }
        return value && value.trim() !== '';
      }
      return true;
    });
  };

  useEffect(() => {
    // Update selected user inputs when pipeline inputs change
    resetSelectedUserInputs();
  }, [pipelineInputs]); // eslint-disable-line react-hooks/exhaustive-deps

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

      response.results.map(async (pipeline) => {
        const pipelineName = pipeline.pipelineName;
        const pipelineVersion = pipeline.pipelineVersion;
        const { inputs } = await Teaspoons(signal).getPipelineDetails(pipelineName, pipelineVersion);
        setPipelineInputs(inputs);
        setIsLoading(false);
      });
    }
    fetchData();
  }, [signal]);

  const handleSubmit = async () => {
    if (!selectedPipeline) {
      console.error('Missing required fields');
      return;
    }

    const pipeline = pipelinesList?.find((pipeline) => pipeline?.pipelineVersion === selectedPipeline?.pipelineVersion);
    const pipelineName = pipeline?.pipelineName;

    // Only proceed if we have a valid pipeline name
    if (!pipelineName) {
      console.error('No pipeline selected or pipeline name not found');
      return;
    }

    // Converts the input values to the format expected by the backend (i.e. file names for File inputs)
    const finalInputs = Object.entries(selectedUserInputs).reduce((acc, [key, value]) => {
      if (value instanceof File) {
        acc[key] = value.name; // Use the file name for File inputs
      } else {
        acc[key] = value; // All other inputs can be used as-is
      }
      return acc;
    }, {});

    try {
      setIsSubmitting(true);
      // const jobId = await prepareUploadStartPipelineRun(
      //   pipelineName,
      //   selectedPipeline.pipelineVersion,
      //   selectedUserInputs,
      //   runDescription,
      //   pipelineInputs
      // );
      const jobId = crypto.randomUUID(); // Placeholder for actual job ID generation logic
      notify('success', `Pipeline run submitted. Job ID: ${jobId}`);
      setSubmittedJobId(jobId);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '';
      notify('error', `Pipeline failed to submit. ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <FooterWrapper alwaysShow>
      {pipelinesTopBar('run job')}
      <div style={{ display: 'flex', justifyContent: 'space-between', margin: '1rem 2rem' }}>
        <div style={{ flex: 1, marginRight: '2rem' }}>
          <h3 style={{ marginBottom: '0.5rem' }}>Select a pipeline version</h3>
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
                {
                  pipelinesList.find((pipeline) => pipeline.pipelineVersion === selectedPipeline.pipelineVersion)
                    ?.description
                }
              </div>
            )}
          </div>

          {!isLoading && (
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
                      value={selectedUserInputs[input.name]}
                      key={`${input.name}`}
                    />
                  );
                })}

              {/* Displays optional run description */}
              <PipelineRunDescription value={runDescription} onChange={setRunDescription} />

              {/* Displays all FILE inputs, one after another */}
              {pipelineInputs
                .filter((input) => input.type === 'FILE')
                .map((input) => {
                  return (
                    <PipelineFileInput
                      key={`${input.name}`}
                      input={input}
                      selectedFile={selectedUserInputs[input.name] || null}
                      onFileSelect={(file) => {
                        setSelectedUserInputs((prev) => ({
                          ...prev,
                          [input.name]: file,
                        }));
                      }}
                    />
                  );
                })}
              {!submittedJobId && (
                <ButtonPrimary
                  disabled={!selectedPipeline || isSubmitting || !areAllRequiredInputsFilled()}
                  style={{ margin: '1rem 0', padding: '1rem', fontSize: '1rem', width: 500 }}
                  onClick={handleSubmit}
                >
                  {isSubmitting ? <Spinner size={16} /> : 'Submit'}
                </ButtonPrimary>
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
                    }}
                  >
                    Run another job
                  </ButtonPrimary>
                </>
              )}
            </>
          )}
          {isLoading && (
            <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Spinner /> Loading pipeline details...
            </div>
          )}
        </div>
        <div>
          <QuotaRemainingWidget selectedPipeline={selectedPipeline} />
          <HelpfulTipsWidget selectedPipeline={selectedPipeline} />
        </div>
      </div>
    </FooterWrapper>
  );
};
