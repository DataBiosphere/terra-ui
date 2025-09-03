import { Dispatch, SetStateAction } from 'react';
import { Metrics } from 'src/libs/ajax/Metrics';
import { Teaspoons } from 'src/libs/ajax/teaspoons/Teaspoons';
import { PipelineInput } from 'src/libs/ajax/teaspoons/teaspoons-models';
import Events from 'src/libs/events';
import { initiateResumableUpload } from 'src/pages/scientificServices/pipelines/utils/upload-utils';
import { PipelineInputFileUploadState } from 'src/pages/scientificServices/pipelines/views/RunJob';

// Helper functions for orchestrating the pipeline run submission process

async function preparePipelineRun(
  pipelineName: string,
  pipelineVersion: number,
  selectedUserInputs: Record<string, any>,
  description: string
): Promise<{ jobId: string; fileInputUploadUrls: Record<string, { signedUrl: string }> }> {
  const jobId = crypto.randomUUID();

  const finalUserInputs = Object.entries(selectedUserInputs).reduce((acc, [key, value]) => {
    acc[key] = value instanceof File ? value.name : value;
    return acc;
  }, {} as Record<string, any>);

  const { fileInputUploadUrls } = await Teaspoons().preparePipelineRun(
    jobId,
    pipelineName,
    pipelineVersion,
    finalUserInputs,
    description
  );

  return { jobId, fileInputUploadUrls };
}

async function uploadPipelineFiles(
  pipelineName: string,
  pipelineVersion: number,
  pipelineInputs: PipelineInput[],
  selectedUserInputs: Record<string, any>,
  fileInputUploadUrls: Record<string, { signedUrl: string }>,
  setUploadState: Dispatch<SetStateAction<Record<string, PipelineInputFileUploadState>>> = () => {}
): Promise<void> {
  await Promise.all(
    pipelineInputs
      .filter((input) => input.type === 'FILE')
      .map(async (input) => {
        const file = selectedUserInputs[input.name];
        const signedUrl = fileInputUploadUrls[input.name]?.signedUrl;

        if (!(file instanceof File)) {
          throw new Error(`Expected a File for input ${input.name}, but got ${typeof file}`);
        }

        try {
          const duration = await initiateResumableUpload(input.name, file, signedUrl, setUploadState);

          Metrics().captureEvent(Events.teaspoons.fileUpload, {
            pipelineName,
            pipelineVersion,
            fileSize: file.size,
            fileType: file.type,
            fileUploadDurationMillis: duration,
          });
        } catch (error) {
          setUploadState((prev) => ({
            ...prev,
            [input.name]: {
              ...prev[input.name],
              errorMessage: error instanceof Error ? error.message : 'Upload failed',
            },
          }));
          throw error;
        }
      })
  );
}

async function startPipelineRun(jobId: string): Promise<void> {
  await Teaspoons().startPipelineRun(jobId);
}

export async function prepareUploadStartPipelineRun(
  pipelineName: string,
  pipelineVersion: number,
  selectedUserInputs: Record<string, any>,
  description: string,
  pipelineInputs: PipelineInput[],
  setUploadState: Dispatch<SetStateAction<Record<string, PipelineInputFileUploadState>>> = () => {}
): Promise<string> {
  const { jobId, fileInputUploadUrls } = await preparePipelineRun(
    pipelineName,
    pipelineVersion,
    selectedUserInputs,
    description
  );

  await uploadPipelineFiles(
    pipelineName,
    pipelineVersion,
    pipelineInputs,
    selectedUserInputs,
    fileInputUploadUrls,
    setUploadState
  );

  await startPipelineRun(jobId);

  return jobId;
}
