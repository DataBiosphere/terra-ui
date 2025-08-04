import { ButtonPrimary, Icon, Link, Select, Spinner } from '@terra-ui-packages/components';
import { isEmpty } from 'lodash';
import React, { useEffect, useState } from 'react';
import { ClipboardButton } from 'src/components/ClipboardButton';
import FooterWrapper from 'src/components/FooterWrapper';
import { TextArea, TextInput } from 'src/components/input';
import { getPopupRoot } from 'src/components/popup-utils';
import { Teaspoons } from 'src/libs/ajax/teaspoons/Teaspoons';
import { Pipeline, PipelineInput } from 'src/libs/ajax/teaspoons/teaspoons-models';
import * as Nav from 'src/libs/nav';
import { notify } from 'src/libs/notifications';
import { useCancellation } from 'src/libs/react-utils';
import { pipelinesTopBar } from 'src/pages/scientificServices/pipelines/common/scientific-services-common';
import { PipelineFileInput } from 'src/pages/scientificServices/pipelines/components/inputs/PipelineFileInput';
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
  file: File,
  pipelineName: string,
  pipelineVersion: number,
  pipelineInputs: Record<string, any>,
  description: string
): Promise<string> {
  const jobId = crypto.randomUUID();

  const { fileInputUploadUrls } = await Teaspoons().preparePipelineRun(
    jobId,
    pipelineName,
    pipelineVersion,
    pipelineInputs,
    description
  );

  const signedUrl = fileInputUploadUrls.multiSampleVcf.signedUrl;

  await uploadFileWithSignedUrl(file, signedUrl);

  await Teaspoons().startPipelineRun(jobId);
  return jobId;
}

export const RunJob = () => {
  const signal = useCancellation();

  const [pipelinesList, setPipelinesList] = useState<Pipeline[]>([]);
  const [pipelineVersionOptions, setPipelineVersionOptions] = useState<{ value: Pipeline; label: string }[]>([]);

  // Input parameter names by pipeline name and version
  const [pipelineInputs, setPipelineInputs] = useState<PipelineInput[]>([]);

  // User inputs for the run
  const [selectedPipeline, setSelectedPipeline] = useState<Pipeline>();
  const [runDescription, setRunDescription] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // TODO: replace this with generic dict of inputs, to support more pipelines
  const [runOutputFilePrefix, setRunOutputFilePrefix] = useState<string>('');
  // const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedUserInputs, setSelectedUserInputs] = useState<Record<string, any>>({});

  useEffect(() => {
    // Update selected user inputs when pipeline inputs change
    const newSelectedUserInputs = pipelineInputs.reduce((acc, input) => {
      acc[input.name] = selectedUserInputs[input.name] || '';
      return acc;
    }, {});
    setSelectedUserInputs(newSelectedUserInputs);
  }, [pipelineInputs]); // eslint-disable-line react-hooks/exhaustive-deps

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submittedJobId, setSubmittedJobId] = useState<string>();

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
    if (!selectedPipeline || !runOutputFilePrefix) {
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

    const pipelineInputsForVersion = pipelineInputs;
    const selectedPipelineInputs = {};

    // E.g. "outputBasename" for array_imputation v1
    const outputPrefixParamName = pipelineInputsForVersion.find(
      (input) => input.type === 'STRING' && input.isRequired
    )?.name;
    if (outputPrefixParamName) {
      selectedPipelineInputs[outputPrefixParamName] = runOutputFilePrefix;
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
      //   selectedFile,
      //   pipelineName,
      //   pipelineVersion,
      //   selectedPipelineInputs,
      //   runDescription
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
                      onChange={() =>
                        setSelectedUserInputs((prev) => ({
                          ...prev,
                          [input.name]: '',
                        }))
                      }
                      value={selectedUserInputs[input.name] || ''}
                      key={`${input.name}`}
                    />
                  );
                })}

              {/* Displays optional run description */}
              <h3 style={{ marginBottom: '0.5rem' }}>
                Enter description <span style={{ fontStyle: 'italic', fontWeight: 'normal' }}> - optional</span>
              </h3>
              <TextArea
                rows={4}
                aria-label='description'
                value={runDescription}
                placeholder='Enter optional description'
                style={{ width: 500 }}
                onChange={setRunDescription}
              />

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
                      requiredSuffix={input.fileSuffix}
                    />
                  );
                })}
              {!submittedJobId && (
                <ButtonPrimary
                  disabled={!selectedPipeline || !runOutputFilePrefix || isSubmitting}
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
                    disabled={!selectedPipeline || !runOutputFilePrefix || isSubmitting}
                    style={{ margin: '1rem 0', padding: '1rem', fontSize: '1rem', width: 500 }}
                    onClick={() => {
                      setRunOutputFilePrefix('');
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
