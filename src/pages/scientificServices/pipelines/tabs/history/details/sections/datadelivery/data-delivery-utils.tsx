import { Icon, Spinner } from '@terra-ui-packages/components';
import React from 'react';
import colors from 'src/libs/colors';
import { DataDeliveryStatus } from 'src/pages/scientificServices/pipelines/tabs/history/details/sections/datadelivery/DataDeliveryView';
import { GCS_BUCKET_VALIDATION_REGEX } from 'src/pages/scientificServices/pipelines/utils/upload-utils';

export const STATUS_CONFIG: Record<DataDeliveryStatus, { label: string; icon: React.ReactElement }> = {
  NOT_STARTED: {
    label: 'Not Started',
    icon: <Icon icon='circle' size={16} style={{ color: colors.dark(0.4) }} aria-label='Not Started' />,
  },
  RUNNING: {
    label: 'In Progress',
    icon: <Spinner size={16} aria-label='In Progress' />,
  },
  SUCCEEDED: {
    label: 'Delivered',
    icon: <Icon icon='success-standard' size={16} style={{ color: colors.success() }} aria-label='Delivered' />,
  },
  FAILED: {
    label: 'Failed',
    icon: <Icon icon='warning-standard' size={16} style={{ color: colors.danger() }} aria-label='Failed' />,
  },
};

export const gcsPathToConsoleUrl = (gcsPath: string): string => {
  const withoutPrefix = gcsPath.replace(/^gs:\/\//, '');
  return `https://console.cloud.google.com/storage/browser/${withoutPrefix}`;
};

export const validateGcsPath = (path: string): string | undefined => {
  if (!path.trim()) {
    return 'A destination path is required.';
  }
  if (!GCS_BUCKET_VALIDATION_REGEX.test(path)) {
    return 'Invalid Google Cloud Storage path. It should start with gs:// followed by the bucket name and path.';
  }
  return undefined;
};

const ERROR_MESSAGE_MAP: { substring: string; friendly: string }[] = [
  {
    substring: 'service does not have necessary permissions',
    friendly:
      'Broad Scientific Services does not have permission to write to the destination bucket. Please review the sharing instructions and try again.',
  },
  {
    substring: 'user does not have necessary permissions',
    friendly:
      'You do not have permission to write to the destination bucket. Please review the sharing instructions and try again.',
  },
];

export const parseDeliveryError = (raw: string): string => {
  const lower = raw.toLowerCase();
  const match = ERROR_MESSAGE_MAP.find(({ substring }) => lower.includes(substring.toLowerCase()));
  return match?.friendly ?? 'An unexpected error occurred. Please try again.';
};
