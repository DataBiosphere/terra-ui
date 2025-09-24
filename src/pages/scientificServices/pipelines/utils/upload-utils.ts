import { Dispatch, SetStateAction } from 'react';
import { PipelineInputFileUploadState } from 'src/pages/scientificServices/pipelines/components/inputs/PipelineFileInput';

// Returns a function that handles progress events for file uploads
// This function updates the upload state with progress percentage and
// estimated time remaining using a moving average of upload rates
function createProgressEventListener(
  inputName: string,
  inputFile: File,
  sessionUrl: string,
  setUploadState: Dispatch<SetStateAction<Record<string, PipelineInputFileUploadState>>>,
  startTime: number,
  uploadRateSamples: number[],
  lastEtaUpdate: number
) {
  return (event: ProgressEvent) => {
    if (event.lengthComputable) {
      const currentTime = Date.now();
      const elapsedTime = currentTime - startTime;

      // Calculate the upload rate of the most recent progress event
      const totalBytesUploaded = event.loaded;
      const uploadRate = totalBytesUploaded / elapsedTime; // bytes per ms
      const percent = Math.round((totalBytesUploaded / inputFile.size) * 100);

      // Only update ETA every 2 seconds or on the first update, to avoid choppy ETA updates
      if (currentTime - lastEtaUpdate >= 2000 || lastEtaUpdate === 0) {
        uploadRateSamples.push(uploadRate);
        if (uploadRateSamples.length > 5) {
          uploadRateSamples.shift(); // Remove the oldest sample
        }

        const averageUploadRate = uploadRateSamples.reduce((acc, rate) => acc + rate, 0) / uploadRateSamples.length;
        const bytesRemaining = inputFile.size - totalBytesUploaded;
        const estimatedTimeRemainingMs = bytesRemaining / averageUploadRate;

        setUploadState((prev) => ({
          ...prev,
          [inputName]: {
            progress: percent,
            signedUrl: sessionUrl,
            uploadEta: uploadRateSamples.length < 5 ? undefined : estimatedTimeRemainingMs / 1000,
          },
        }));

        lastEtaUpdate = currentTime;
      } else {
        // Last progress event was less than 2 seconds ago, so we'll just update percent progress
        // without changing ETA to keep it smooth
        setUploadState((prev) => ({
          ...prev,
          [inputName]: {
            ...prev[inputName],
            progress: percent,
          },
        }));
      }
    }
  };
}

/* Check the status of a resumable upload session. Returns the last byte that GCS received */
export async function checkUploadStatus(sessionUrl: string): Promise<number> {
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
): Promise<void> {
  // Check current upload status
  const uploadedBytes = await checkUploadStatus(sessionUrl);

  if (uploadedBytes === -1) {
    // Upload already complete
    setUploadState((prev) => ({
      ...prev,
      [inputName]: { ...prev[inputName], progress: 100, errorMessage: undefined },
    }));
    return;
  }

  // Resume upload from where it left off
  const remainingBytes = inputFile.slice(uploadedBytes);

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    const uploadRateSamples: number[] = [];
    const startTime = Date.now();
    const lastEtaUpdate = 0;

    xhr.upload.addEventListener(
      'progress',
      createProgressEventListener(
        inputName,
        inputFile,
        sessionUrl,
        setUploadState,
        startTime,
        uploadRateSamples,
        lastEtaUpdate
      )
    );

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        setUploadState((prev) => ({
          ...prev,
          [inputName]: { ...prev[inputName], progress: 100, errorMessage: undefined },
        }));
        resolve();
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
    xhr.send(remainingBytes);
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
  // Keeps track of all progress measurements to calculate average upload rate and estimated time remaining
  const uploadRateSamples: number[] = [];

  // Step 1: Initiate the resumable upload session.
  // Google will return a session URL in the Location header,
  // which we'll use to upload the file.
  const initRes = await fetch(signedUrl, {
    method: 'POST',
    headers: { 'x-goog-resumable': 'start', 'Content-Type': 'application/octet-stream' },
  });

  const sessionUrl = initRes.headers.get('Location');

  if (!sessionUrl) {
    throw new Error('Failed to get resumable upload session URL');
  }

  // Step 2: Upload the file using XMLHttpRequest for progress tracking
  const startTime = Date.now();
  const lastEtaUpdate = 0;

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener(
      'progress',
      createProgressEventListener(
        inputName,
        inputFile,
        sessionUrl,
        setUploadState,
        startTime,
        uploadRateSamples,
        lastEtaUpdate
      )
    );

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

    xhr.open('PUT', sessionUrl);
    xhr.setRequestHeader('Content-Type', 'application/octet-stream');
    xhr.setRequestHeader('Content-Range', `bytes 0-${inputFile.size - 1}/${inputFile.size}`);
    xhr.send(inputFile);
  });
}
