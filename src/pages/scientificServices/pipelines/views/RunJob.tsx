import { ButtonPrimary, Select, Spinner } from '@terra-ui-packages/components';
import { isEmpty } from 'lodash';
import React, { useEffect, useState } from 'react';
import FooterWrapper from 'src/components/FooterWrapper';
import { TextArea, TextInput } from 'src/components/input';
import { getPopupRoot } from 'src/components/popup-utils';
import { Teaspoons } from 'src/libs/ajax/teaspoons/Teaspoons';
import { Pipeline } from 'src/libs/ajax/teaspoons/teaspoons-models';
import { useCancellation } from 'src/libs/react-utils';
import { pipelinesTopBar } from 'src/pages/scientificServices/pipelines/common/scientific-services-common';
import { HelpfulTipsWidget } from 'src/pages/scientificServices/pipelines/widgets/HelpfulTipsWidget';
import { QuotaRemainingWidget } from 'src/pages/scientificServices/pipelines/widgets/QuotaRemainingWidget';

export const RunJob = () => {
  const signal = useCancellation();

  const [pipelinesList, setPipelinesList] = useState<Pipeline[]>([]);
  const [pipelineVersionOptions, setPipelineVersionOptions] = useState<{ value: Pipeline; label: string }[]>([]);

  // User inputs for the run
  const [selectedPipeline, setSelectedPipeline] = useState<Pipeline>();
  const [runOutputFilePrefix, setRunOutputFilePrefix] = useState<string>('');
  const [runDescription, setRunDescription] = useState<string>('');

  useEffect(() => {
    async function fetchData() {
      const response = await Teaspoons(signal).getPipelines();

      const options = response.results.map((pipeline) => ({
        value: pipeline,
        label: `${pipeline.displayName} - v${pipeline.pipelineVersion}`,
      }));

      setPipelinesList(response.results);
      setPipelineVersionOptions(options);
    }
    fetchData();
  }, [signal]);

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
          <div style={{ width: 500, marginBottom: '1rem' }}>
            <input
              type='file'
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  // eslint-disable-next-line no-console
                  console.log(file); // TODO TSPS-493: support file upload
                }
              }}
            />
          </div>
          <ButtonPrimary style={{ marginTop: '2rem', padding: '1rem', fontSize: '1rem' }} href='#services/pipelines'>
            Submit
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
