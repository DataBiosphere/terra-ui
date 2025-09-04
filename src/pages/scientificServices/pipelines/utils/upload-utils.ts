import { Dispatch, SetStateAction } from 'react';
import { PipelineInputFileUploadState } from 'src/pages/scientificServices/pipelines/views/RunJob';

/* Check the status of a resumable upload session. Returns the last byte that GCS received */
async function checkUploadStatus(sessionUrl: string): Promise<number> {
  const res = await fetch(sessionUrl, {
    method: 'PUT',
    headers: {
      'Content-Length': '0',
      'Content-Range': 'bytes */*',
    },
  });

  if (res.status === 308) {
    const range = res.headers.get('Range');
    if (range) {
      const regex = /bytes=0-(\d+)/;
      const match = regex.exec(range);
      if (match && match[1]) {
        return parseInt(match[1], 10) + 1; // +1 because range is inclusive
      }
    }

    // range wasn't present, so we'll assume nothing has been uploaded yet
    // even if this assumption is wrong, google storage can handle it fine
    return 0;
  }
  if (res.ok) {
    return -1; // Upload complete
  }
  throw new Error('Failed to check upload status');
}

/* Resume an existing resumable upload session */
export async function resumeUpload(
  inputName: string,
  inputFile: File,
  sessionUrl: string,
  setUploadState: Dispatch<SetStateAction<Record<string, PipelineInputFileUploadState>>>
): Promise<number> {
  const startTime = Date.now();

  // Check current upload status
  const uploadedBytes = await checkUploadStatus(sessionUrl);

  if (uploadedBytes === -1) {
    // Upload already complete
    setUploadState((prev) => ({
      ...prev,
      [inputName]: { ...prev[inputName], progress: 100, errorMessage: undefined },
    }));
    return 0;
  }

  // Resume upload from where it left off
  const fileSlice = inputFile.slice(uploadedBytes);

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable) {
        const totalProgress = ((uploadedBytes + event.loaded) / inputFile.size) * 100;
        const percent = Math.round(totalProgress);
        setUploadState((prev) => ({
          ...prev,
          [inputName]: { ...prev[inputName], progress: percent, errorMessage: undefined },
        }));
      }
    });

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        const endTime = Date.now();
        const duration = endTime - startTime;
        setUploadState((prev) => ({
          ...prev,
          [inputName]: { ...prev[inputName], progress: 100, errorMessage: undefined },
        }));
        resolve(duration);
      } else {
        const errorMessage = `Upload failed with status ${xhr.status}`;
        setUploadState((prev) => ({
          ...prev,
          [inputName]: { ...prev[inputName], errorMessage },
        }));
        reject(new Error(errorMessage));
      }
    });

    xhr.addEventListener('error', () => {
      const errorMessage = 'Upload failed due to network error';
      setUploadState((prev) => ({
        ...prev,
        [inputName]: { ...prev[inputName], errorMessage },
      }));
      reject(new Error(errorMessage));
    });

    xhr.open('PUT', sessionUrl);
    xhr.setRequestHeader('Content-Type', 'application/octet-stream');
    xhr.setRequestHeader('Content-Range', `bytes ${uploadedBytes}-${inputFile.size - 1}/${inputFile.size}`);
    xhr.send(fileSlice);
  });
}

/* Takes the initial POST signedUrl provided by the Teaspoons backend, and
   exchanges it for a resumable upload session URL.
 */
export async function initiateResumableUpload(
  inputName: string,
  inputFile: File,
  signedUrl: string,
  setUploadState: Dispatch<SetStateAction<Record<string, PipelineInputFileUploadState>>>
): Promise<number> {
  // Step 1: Initiate the resumable upload session.
  // Google will return a session URL in the Location header,
  // which we'll use to upload the file.
  const initRes = await fetch(signedUrl, {
    method: 'POST',
    headers: { 'x-goog-resumable': 'start' },
  });

  const sessionUrl = initRes.headers.get('Location');

  if (!sessionUrl) {
    throw new Error('Failed to get resumable upload session URL');
  }

  // Step 2: Upload the file using XMLHttpRequest for progress tracking
  const startTime = Date.now();

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable) {
        const percent = Math.round((event.loaded / event.total) * 100);
        setUploadState((prev) => ({
          ...prev,
          [inputName]: { progress: percent, signedUrl: sessionUrl },
        }));
      }
    });

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        const endTime = Date.now();
        const duration = endTime - startTime;
        setUploadState((prev) => ({
          ...prev,
          [inputName]: { ...prev[inputName], progress: 100, errorMessage: undefined },
        }));
        resolve(duration);
      } else {
        const errorMessage = `Upload failed with status ${xhr.status}`;
        setUploadState((prev) => ({
          ...prev,
          [inputName]: { ...prev[inputName], errorMessage },
        }));
        reject(new Error(errorMessage));
      }
    });

    xhr.addEventListener('error', () => {
      const errorMessage = 'Upload failed';
      setUploadState((prev) => ({
        ...prev,
        [inputName]: { ...prev[inputName], errorMessage },
      }));
      reject(new Error(errorMessage));
    });

    xhr.addEventListener('abort', () => {
      const errorMessage = 'Upload aborted after 5 seconds';
      setUploadState((prev) => ({
        ...prev,
        [inputName]: { ...prev[inputName], errorMessage },
      }));
      reject(new Error(errorMessage));
    });

    xhr.open('PUT', sessionUrl);
    xhr.setRequestHeader('Content-Type', 'application/octet-stream');
    xhr.setRequestHeader('Content-Range', `bytes 0-${inputFile.size - 1}/${inputFile.size}`);
    xhr.send(inputFile);
  });
}
