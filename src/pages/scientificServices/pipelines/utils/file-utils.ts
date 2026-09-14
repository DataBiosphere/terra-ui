import { PipelineIOType } from 'src/libs/ajax/teaspoons/teaspoons-models';

/**
 * Starts a browser download of a signed URL.
 *
 * Uses a programmatically clicked anchor rather than window.open: the signed URL is fetched when the
 * user clicks Download, and by the time that fetch resolves the browser no longer considers the
 * window.open to be user-initiated, so popup blockers eat it (and eat all but the first of several
 * downloads started in quick succession).
 *
 * Note that the download attribute is ignored for cross-origin URLs, so whether the browser saves
 * the file or renders it is up to the Content-Disposition header on the signed URL.
 */
export const downloadSignedUrl = (url: string, fileName: string): void => {
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  anchor.rel = 'noopener';
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
};

// Checks if a pipeline input/output type is file based
export const isFileLikeType = (type: PipelineIOType | string): boolean => {
  return type === 'FILE' || type === 'MANIFEST';
};
