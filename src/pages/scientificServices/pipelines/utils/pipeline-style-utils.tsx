import { Icon } from '@terra-ui-packages/components';
import { ReactNode } from 'react';
import React from 'react';
import { PipelineRunStatus } from 'src/libs/ajax/teaspoons/teaspoons-models';
import colors from 'src/libs/colors';

export const getPipelineStatusColor = (status: PipelineRunStatus): string => {
  switch (status) {
    case 'SUCCEEDED':
      return colors.success();
    case 'RUNNING':
      return colors.accent();
    case 'FAILED':
      return colors.danger();
    default:
      return colors.accent();
  }
};

export const getPipelineStatusIcon = (status: PipelineRunStatus): ReactNode => {
  switch (status) {
    case 'SUCCEEDED':
      return <Icon icon='success-standard' size={16} style={{ color: colors.success() }} />;
    case 'RUNNING':
      return <Icon icon='sync' size={16} style={{ color: colors.accent() }} />;
    case 'PREPARING':
      return <Icon icon='sync' size={16} style={{ color: colors.warning() }} />;
    case 'FAILED':
      return <Icon icon='warning-standard' size={16} style={{ color: colors.danger() }} />;
    default:
      return null;
  }
};
