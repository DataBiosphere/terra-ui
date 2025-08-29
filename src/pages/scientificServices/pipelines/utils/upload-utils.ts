/* Check the status of a resumable upload session. */
import { Dispatch, SetStateAction } from 'react';
import { InputUploadState } from 'src/pages/scientificServices/pipelines/views/RunJob';

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
      const match = range.match(/bytes=0-(\d+)/);
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

/* Takes the initial POST signedUrl provided by the Teaspoons backend, and
   exchanges it for a resumable upload session URL.
 */
export async function initiateResumableUpload(
  inputName: string,
  inputFile: File,
  signedUrl: string,
  setUploadState: Dispatch<SetStateAction<Record<string, InputUploadState>>>
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

    // Simulate an error by aborting the request after 5 seconds
    const timeoutId = setTimeout(() => {
      xhr.abort();
    }, 5000);

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
      clearTimeout(timeoutId);
      if (xhr.status >= 200 && xhr.status < 300) {
        const endTime = Date.now();
        const duration = endTime - startTime;
        resolve(duration);
      } else {
        reject(new Error(`Upload failed with status ${xhr.status}`));
      }
    });

    xhr.addEventListener('error', () => {
      clearTimeout(timeoutId);
      reject(new Error('Upload failed'));
    });

    xhr.addEventListener('abort', () => {
      clearTimeout(timeoutId);
      reject(new Error('Upload aborted after 1 second'));
    });

    xhr.open('PUT', sessionUrl);
    xhr.setRequestHeader('Content-Type', 'application/octet-stream');
    xhr.setRequestHeader('Content-Range', `bytes 0-${inputFile.size - 1}/${inputFile.size}`);
    xhr.send(inputFile);
  });
}

// Single-request upload with progress tracking
export async function uploadFileWithSignedUrl(
  inputFile: File,
  signedUrl: string,
  onProgress?: (percent: number) => void
): Promise<number> {
  const startTime = Date.now();

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable && onProgress) {
        const percent = Math.round((event.loaded / event.total) * 100);
        onProgress(percent);
      }
    });

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        const endTime = Date.now();
        const duration = endTime - startTime;
        resolve(duration);
      } else {
        reject(new Error(`Upload failed with status ${xhr.status}`));
      }
    });

    xhr.addEventListener('error', () => {
      reject(new Error('Upload failed'));
    });

    xhr.open('PUT', signedUrl);
    xhr.setRequestHeader('Content-Type', 'application/octet-stream');
    xhr.send(inputFile);
  });
}
