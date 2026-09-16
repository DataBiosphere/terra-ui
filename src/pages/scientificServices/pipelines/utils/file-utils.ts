import { PipelineIOType } from 'src/libs/ajax/teaspoons/teaspoons-models';

export const downloadSignedUrl = (url: string, fileName: string): void => {
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  anchor.rel = 'noopener';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
};

// Checks if a pipeline input/output type is file based
export const isFileLikeType = (type: PipelineIOType | string): boolean => {
  return type === 'FILE' || type === 'MANIFEST';
};
