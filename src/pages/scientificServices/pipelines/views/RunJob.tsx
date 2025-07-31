import { ButtonPrimary, Icon, Select, Spinner } from '@terra-ui-packages/components';
import { isEmpty } from 'lodash';
import React, { useEffect, useRef, useState } from 'react';
import FooterWrapper from 'src/components/FooterWrapper';
import { TextArea, TextInput } from 'src/components/input';
import { getPopupRoot } from 'src/components/popup-utils';
import { Teaspoons } from 'src/libs/ajax/teaspoons/Teaspoons';
import { Pipeline } from 'src/libs/ajax/teaspoons/teaspoons-models';
import { useCancellation } from 'src/libs/react-utils';
import { pipelinesTopBar } from 'src/pages/scientificServices/pipelines/common/scientific-services-common';
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
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleBrowseClick();
    }
  };

  const handleFileInputClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleClearFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

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
      // todo cleanup
      window.location.href = '#services/pipelines/history';
    } catch (error) {
      console.error('Failed to submit pipeline run:', error);
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
          <div
            style={{
              width: 500,
              marginBottom: '1rem',
              border: '1px solid #8f95a0',
              padding: '1rem',
              borderRadius: '4px',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div
              role='button'
              tabIndex={0}
              style={{
                borderRadius: '8px',
                border: '1px dashed #46A3E9',
                padding: '2rem',
                minHeight: '120px',
                background: 'rgba(128, 198, 236, 0.20)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
              onClick={handleBrowseClick}
              onKeyDown={handleKeyPress}
            >
              <input
                ref={fileInputRef}
                type='file'
                onChange={handleFileChange}
                onClick={handleFileInputClick}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  opacity: 0,
                  cursor: 'pointer',
                }}
              />
              <div>
                {selectedFile ? (
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div
                      style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'left' }}
                    >
                      <Icon icon='success-standard' size={24} style={{ color: '#74AE43' }} />
                      <span style={{ color: '#333', paddingLeft: '0.5rem', fontWeight: 600 }}>{selectedFile.name}</span>
                    </div>
                    <button
                      type='button'
                      onClick={handleClearFile}
                      style={{
                        zIndex: 1,
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: '#666',
                        alignItems: 'center',
                        justifyContent: 'center',
                        // UX note: the click-space of the button is 1.5x larger than the icon
                        // to make it easier to click
                        width: '36px',
                        height: '36px',
                      }}
                      aria-label='Remove selected file'
                    >
                      <Icon icon='times' size={24} color='#4D72AA' />
                    </button>
                  </div>
                ) : (
                  <>
                    {/* TODO (TSPS-554): actually implement a Dropzone here */}
                    Drop file or{' '}
                    <span
                      style={{
                        color: '#46A3E9',
                        fontWeight: 600,
                        textDecoration: 'underline',
                        cursor: 'pointer',
                      }}
                    >
                      browse
                    </span>
                  </>
                )}
              </div>
            </div>
            <ButtonPrimary
              disabled={!selectedPipeline || !runOutputFilePrefix || !selectedFile || isSubmitting}
              style={{ marginTop: '1rem', padding: '1rem', fontSize: '1rem' }}
              onClick={handleSubmit}
            >
              {isSubmitting ? <Spinner size={16} /> : 'Submit'}
            </ButtonPrimary>
          </div>
        </div>
        <div>
          <QuotaRemainingWidget selectedPipeline={selectedPipeline} />
          <HelpfulTipsWidget selectedPipeline={selectedPipeline} />
        </div>
      </div>
    </FooterWrapper>
  );
};
