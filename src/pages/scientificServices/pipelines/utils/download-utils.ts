import { formatBytes } from '@terra-ui-packages/core-utils';

export const getOutputFileSize = async (url: string): Promise<string> => {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    const size = response.headers.get('content-length');
    return size ? formatBytes(Number.parseInt(size)) : 'Unknown size';
  } catch {
    return 'Unknown size';
  }
};
