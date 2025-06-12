import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { Teaspoons, TeaspoonsContract } from 'src/libs/ajax/teaspoons/Teaspoons';
import { PipelineRunResponse } from 'src/libs/ajax/teaspoons/teaspoons-models';
import { asMockedFn, partial, renderWithAppContexts } from 'src/testing/test-utils';

import { ViewErrorModal } from './ViewErrorModal';

jest.mock('src/libs/ajax/teaspoons/Teaspoons');

describe('ViewErrorModal', () => {
  const jobId = 'test-job-id';
  const onDismissMock = jest.fn();

  it('displays loading state initially', () => {
    asMockedFn(Teaspoons).mockReturnValue(
      partial<TeaspoonsContract>({
        getPipelineRunResult: jest.fn().mockReturnValue(new Promise(() => {})),
      })
    );

    renderWithAppContexts(<ViewErrorModal jobId={jobId} onDismiss={onDismissMock} />);

    expect(screen.getByText('Loading error details...')).toBeInTheDocument();
    expect(screen.getByText(`Pipeline Error - ${jobId}`)).toBeInTheDocument();
  });

  it('fetches and displays error information', async () => {
    const mockErrorReport = {
      message: 'Test error message',
      errorCode: 504,
      causes: ['Error cause 1', 'Error cause 2'],
    };

    const mockPipelineRunResponse: Partial<PipelineRunResponse> = {
      errorReport: mockErrorReport,
    };

    asMockedFn(Teaspoons).mockReturnValue(
      partial<TeaspoonsContract>({
        getPipelineRunResult: jest.fn().mockResolvedValue(mockPipelineRunResponse),
      })
    );

    renderWithAppContexts(<ViewErrorModal jobId={jobId} onDismiss={onDismissMock} />);

    await waitFor(() => {
      expect(screen.queryByText('Loading error details...')).not.toBeInTheDocument();
    });

    // Verify error details are displayed
    expect(screen.getByText('Error Message:')).toBeInTheDocument();
    expect(screen.getByText('Test error message')).toBeInTheDocument();

    // Verify error causes are displayed
    expect(screen.getByText('Error Causes:')).toBeInTheDocument();
    expect(screen.getByText('Error cause 1')).toBeInTheDocument();
    expect(screen.getByText('Error cause 2')).toBeInTheDocument();
  });

  it('displays a message when no error details are available', async () => {
    const mockPipelineRunResponse: Partial<PipelineRunResponse> = {};

    asMockedFn(Teaspoons).mockReturnValue(
      partial<TeaspoonsContract>({
        getPipelineRunResult: jest.fn().mockResolvedValue(mockPipelineRunResponse),
      })
    );

    renderWithAppContexts(<ViewErrorModal jobId={jobId} onDismiss={onDismissMock} />);

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText('Loading error details...')).not.toBeInTheDocument();
    });

    // Verify "no error details" message is displayed
    expect(screen.getByText('No detailed error information available for this job.')).toBeInTheDocument();
  });

  it('calls onDismiss when Close button is clicked', async () => {
    const mockPipelineRunResponse: Partial<PipelineRunResponse> = {
      errorReport: {
        errorCode: 500,
        causes: [],
        message: 'Test error',
      },
    };

    asMockedFn(Teaspoons).mockReturnValue(
      partial<TeaspoonsContract>({
        getPipelineRunResult: jest.fn().mockResolvedValue(mockPipelineRunResponse),
      })
    );

    renderWithAppContexts(<ViewErrorModal jobId={jobId} onDismiss={onDismissMock} />);

    await waitFor(() => {
      expect(screen.queryByText('Loading error details...')).not.toBeInTheDocument();
    });

    const user = userEvent.setup();
    await user.click(screen.getByText('Close'));

    // Verify onDismiss was called
    expect(onDismissMock).toHaveBeenCalledTimes(1);
  });

  it('handles errors empty causes array', async () => {
    const mockErrorReport = {
      message: 'Simple error message with no causes',
      errorCode: 500,
      causes: [],
    };

    const mockPipelineRunResponse: Partial<PipelineRunResponse> = {
      errorReport: mockErrorReport,
    };

    asMockedFn(Teaspoons).mockReturnValue(
      partial<TeaspoonsContract>({
        getPipelineRunResult: jest.fn().mockResolvedValue(mockPipelineRunResponse),
      })
    );

    renderWithAppContexts(<ViewErrorModal jobId={jobId} onDismiss={onDismissMock} />);

    await waitFor(() => {
      expect(screen.queryByText('Loading error details...')).not.toBeInTheDocument();
    });

    // Verify error message is displayed
    expect(screen.getByText('Simple error message with no causes')).toBeInTheDocument();

    // Verify causes section is not displayed
    expect(screen.queryByText('Error Causes:')).not.toBeInTheDocument();
  });
});
