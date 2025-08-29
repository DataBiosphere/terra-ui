/* Check the status of a resumable upload session. */
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
    // range wasn't present, so no bytes have been uploaded yet
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
  inputFile: File,
  signedUrl: string,
  onProgress?: (percent: number) => void
): Promise<number> {
  // Step 1: Initiate the resumable upload session.
  // Google will return a session URL in the Location header,
  // which we'll use to upload the file.
  const initRes = await fetch(signedUrl, {
    method: 'POST',
    headers: { 'x-goog-resumable': 'start' },
  });

  // Simulate an error by aborting the request after 1 second
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, 1000); // 1 second

  const sessionUrl = initRes.headers.get('Location');
  console.log('Resumable upload session URL:', sessionUrl);

  // Step 2: Upload the file in a single PUT request.
  try {
    const res = await fetch(sessionUrl!, {
      method: 'PUT',
      headers: {
        'Content-Length': inputFile.size.toString(),
        'Content-Type': 'application/octet-stream',
        'Content-Range': `bytes 0-${inputFile.size - 1}/${inputFile.size}`,
      },
      body: inputFile,
      signal: controller.signal,
    });

    if (!res.ok) throw new Error('Upload failed');
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Upload aborted after 1 second');
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }

  return inputFile.size; // todo switch this to return duration
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
