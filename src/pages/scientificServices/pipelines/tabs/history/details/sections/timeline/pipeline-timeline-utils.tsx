import { Icon } from '@terra-ui-packages/components';
import React from 'react';
import { PipelineRunResponse } from 'src/libs/ajax/teaspoons/teaspoons-models';
import colors from 'src/libs/colors';
import {
  getPipelineStatusColor,
  getPipelineStatusIcon,
} from 'src/pages/scientificServices/pipelines/utils/pipeline-style-utils';

export interface PipelineTimelineEvent {
  label: string;
  moreInfo?: string;
  status: string;
  timestamp?: string;
}

// While we don't have precise insight into which steps have actually completed, we can infer some stuff:
// If an error message indicates 'QC failure', we know QC checks failed.
// If quota has been charged, we know the pipeline has progressed past QC checks
const getQcEvent = (pipelineRunResult: PipelineRunResponse): PipelineTimelineEvent | undefined => {
  const qcFailed = pipelineRunResult.errorReport?.message?.includes('failed QC');
  const pipelineRunning = pipelineRunResult.jobReport.status === 'RUNNING';
  const quotaCharged = !!pipelineRunResult.pipelineRunReport.quotaConsumed;

  const label = 'Quality Checks';

  if (qcFailed) {
    return { label, status: 'FAILED', moreInfo: 'Input data failed QC checks' };
  }
  if (pipelineRunning && !quotaCharged) {
    return { label, status: 'PENDING', moreInfo: 'Quality checks pending' };
  }
  if (quotaCharged || pipelineRunResult.jobReport.completed) {
    return { label, status: 'SUCCEEDED', moreInfo: 'Input data passed QC checks' };
  }
};

const getQuotaEvent = (pipelineRunResult: PipelineRunResponse): PipelineTimelineEvent | undefined => {
  const quotaCharged = !!pipelineRunResult.pipelineRunReport.quotaConsumed;
  const pipelineFailed = pipelineRunResult.jobReport.status === 'FAILED';
  const pipelineRunning = pipelineRunResult.jobReport.status === 'RUNNING';

  const label = 'Quota Charged';

  if (quotaCharged) {
    return {
      label,
      status: 'SUCCEEDED',
      moreInfo: `${pipelineRunResult.pipelineRunReport.quotaConsumed} ${pipelineRunResult.pipelineRunReport.inputSizeUnits}`,
    };
  }
  if (pipelineFailed) {
    return { label, status: 'CANCELLED', moreInfo: 'No quota charged' };
  }
  if (pipelineRunning) {
    return { label, status: 'PENDING', moreInfo: 'Quota charges pending' };
  }
};

const getTerminalEvent = (pipelineRunResult: PipelineRunResponse): PipelineTimelineEvent => {
  const pipelineStatus = pipelineRunResult.jobReport.status;

  let label = 'Pipeline Running';
  if (pipelineStatus === 'SUCCEEDED') {
    label = 'Pipeline Succeeded';
  } else if (pipelineStatus === 'FAILED') {
    label = 'Pipeline Failed';
  }

  return {
    label,
    timestamp: pipelineRunResult.jobReport.completed,
    status: pipelineRunResult.jobReport.status,
    moreInfo: pipelineStatus === 'RUNNING' ? 'This pipeline is currently running' : undefined,
  };
};

export const calculateTimelineEvents = (pipelineRunResult: PipelineRunResponse): PipelineTimelineEvent[] => {
  const events: PipelineTimelineEvent[] = [];

  // Always push a Submitted event
  events.push({
    label: 'Submitted',
    status: 'SUCCEEDED',
    timestamp: pipelineRunResult.jobReport.submitted,
  });

  // Push a QC event, if we have one
  const qcEvent = getQcEvent(pipelineRunResult);
  if (qcEvent) {
    events.push(qcEvent);
  }

  // Push a quota event, if we have one
  const quotaEvent = getQuotaEvent(pipelineRunResult);
  if (quotaEvent) {
    events.push(quotaEvent);
  }

  // Always push a terminal event
  events.push(getTerminalEvent(pipelineRunResult));

  return events;
};

export const getTimelineEventStatusIcon = (status: string) => {
  if (status === 'CANCELLED') {
    return <Icon icon='ban' size={20} style={{ color: colors.dark(0.6) }} />;
  }
  if (status === 'PENDING') {
    return <Icon icon='circle' size={20} style={{ color: colors.dark(0.6) }} />;
  }
  if (status === 'FAILED') {
    return <Icon icon='error-standard' size={20} style={{ color: getPipelineStatusColor(status) }} />;
  }
  return getPipelineStatusIcon(status, 20);
};
