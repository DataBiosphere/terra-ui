import { ButtonPrimary, Select, Spinner } from '@terra-ui-packages/components';
import { isEmpty } from 'lodash';
import React, { useEffect, useState } from 'react';
import FooterWrapper from 'src/components/FooterWrapper';
import { TextArea, TextInput } from 'src/components/input';
import { getPopupRoot } from 'src/components/popup-utils';
import { Teaspoons } from 'src/libs/ajax/teaspoons/Teaspoons';
import { Pipeline } from 'src/libs/ajax/teaspoons/teaspoons-models';
import { notify } from 'src/libs/notifications';
import { useCancellation } from 'src/libs/react-utils';
import { pipelinesTopBar } from 'src/pages/scientificServices/pipelines/common/scientific-services-common';
import { PipelineInputSelector } from 'src/pages/scientificServices/pipelines/components/PipelineInputSelector';
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
  const [pipelineInputs, setPipelineInputs] = useState<Record<string, any>>({});

  // User inputs for the run
  const [selectedPipeline, setSelectedPipeline] = useState<Pipeline>();
  const [runOutputFilePrefix, setRunOutputFilePrefix] = useState<string>('');
  const [runDescription, setRunDescription] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    async function fetchData() {
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
        const pipelineNameVersion = `${pipelineName}${pipelineVersion}`;
        const newInputs = {};
        newInputs[pipelineNameVersion] = inputs;
        setPipelineInputs(Object.assign(pipelineInputs, newInputs));
      });
    }
    fetchData();
  }, [signal, pipelineInputs]);

  const handleSubmit = async () => {
    if (!selectedFile || !selectedPipeline || !runOutputFilePrefix) {
      console.error('Missing required fields');
      return;
    }

    const pipeline = pipelinesList?.find((pipeline) => pipeline?.pipelineVersion === selectedPipeline?.pipelineVersion);
    const pipelineName = pipeline?.pipelineName;
    const pipelineVersion = selectedPipeline?.pipelineVersion || 0;

    // Only proceed if we have a valid pipeline name
    if (!pipelineName) {
      console.error('No pipeline selected or pipeline name not found');
      return;
    }

    const pipelineInputsForVersion = pipelineInputs[`${pipelineName}${pipelineVersion}`];

    const selectedPipelineInputs = {};

    // E.g. "multiSampleVcf" for array_imputation v1
    const fileNameParam = pipelineInputsForVersion.find((input) => input.type === 'FILE' && input.isRequired)?.name;
    selectedPipelineInputs[fileNameParam] = selectedFile.name;

    // E.g. "outputBasename" for array_imputation v1
    const outputPrefixParamName = pipelineInputsForVersion.find(
      (input) => input.type === 'STRING' && input.isRequired
    )?.name;

    selectedPipelineInputs[outputPrefixParamName] = runOutputFilePrefix;

    try {
      setIsSubmitting(true);
      await prepareUploadStartPipelineRun(
        selectedFile,
        pipelineName,
        pipelineVersion,
        selectedPipelineInputs,
        runDescription
      );
      // TODO: use a better way to navigate to the pipelines history page
      window.location.href = '#services/pipelines/history';
      notify('success', 'Pipeline run submitted');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      notify('error', `Pipeline failed to submit: ${errorMessage}`);
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
          <h3 style={{ marginBottom: '0.5rem' }}>Enter prefix for output file *</h3>
          <TextInput
            aria-label='output file prefix'
            type='text'
            value={runOutputFilePrefix}
            placeholder='Enter prefix name'
            style={{ width: 400 }}
            onChange={setRunOutputFilePrefix}
          />
          <div style={{ marginTop: '0.5rem', marginBottom: '2rem', fontStyle: 'italic' }}>
            May only contain alphanumeric characters, dashes, and underscores.
          </div>
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
          <h3 style={{ marginBottom: '0.5rem' }}>Upload file *</h3>
          <PipelineInputSelector selectedFile={selectedFile} onFileSelect={setSelectedFile} />

          <ButtonPrimary
            disabled={!selectedPipeline || !runOutputFilePrefix || !selectedFile || isSubmitting}
            style={{ margin: '1rem 0', padding: '1rem', fontSize: '1rem', width: 500 }}
            onClick={handleSubmit}
          >
            {isSubmitting ? <Spinner size={16} /> : 'Submit'}
          </ButtonPrimary>
        </div>
        <div>
          <QuotaRemainingWidget selectedPipeline={selectedPipeline} />
          <HelpfulTipsWidget selectedPipeline={selectedPipeline} />
        </div>
      </div>
    </FooterWrapper>
  );
};
