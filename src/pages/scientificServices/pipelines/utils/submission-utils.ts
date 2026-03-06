import { Dispatch, SetStateAction } from 'react';
import { Metrics } from 'src/libs/ajax/Metrics';
import { Teaspoons } from 'src/libs/ajax/teaspoons/Teaspoons';
import { PipelineInput } from 'src/libs/ajax/teaspoons/teaspoons-models';
import Events from 'src/libs/events';
import { PipelineInputFileUploadState } from 'src/pages/scientificServices/pipelines/tabs/run/inputs/file/PipelineFileBasedInput';
import { isFileBasedType } from 'src/pages/scientificServices/pipelines/utils/file-utils';
import { initiateResumableUpload } from 'src/pages/scientificServices/pipelines/utils/upload-utils';

// Helper functions for orchestrating the pipeline run submission process

export async function preparePipelineRun(
  pipelineName: string,
  pipelineVersion: number,
  selectedUserInputs: Record<string, any>,
  description: string
): Promise<{ jobId: string; fileInputUploadUrls: Record<string, { signedUrl: string }> }> {
  const jobId = crypto.randomUUID();

  const finalUserInputs = Object.entries(selectedUserInputs).reduce((acc, [key, value]) => {
    if (typeof value === 'boolean') {
      acc[key] = value;
    } else if (value instanceof File) {
      acc[key] = value.name;
    } else {
      acc[key] = value.trim();
    }
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

export async function uploadPipelineFiles(
  pipelineName: string,
  pipelineVersion: number,
  pipelineInputs: PipelineInput[],
  selectedUserInputs: Record<string, any>,
  fileInputUploadUrls: Record<string, { signedUrl: string }>,
  setUploadState: Dispatch<SetStateAction<Record<string, PipelineInputFileUploadState>>> = () => {}
): Promise<void> {
  await Promise.all(
    pipelineInputs
      .filter((input) => isFileBasedType(input.type))
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

export async function startPipelineRun(jobId: string): Promise<string> {
  await Teaspoons().startPipelineRun(jobId);
  return jobId;
}
