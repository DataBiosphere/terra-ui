import { formatBytes } from '@terra-ui-packages/core-utils';
import { PipelineIOType } from 'src/libs/ajax/teaspoons/teaspoons-models';

export const getOutputFileSize = async (url: string): Promise<string> => {
  const response = await fetch(url, { method: 'HEAD' });

  if (!response.ok) {
    throw new Error(`Failed to fetch file size: ${response.status} ${response.statusText}`);
  }

  const size = response.headers.get('content-length');
  return size ? formatBytes(Number.parseInt(size)) : 'Unknown size';
};

// Checks if a pipeline input/output type is file based
export const isFileBasedType = (type: PipelineIOType | string): boolean => {
  return type === 'FILE' || type === 'MANIFEST';
};
