import { expect } from '@storybook/test';
import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';

import { QuotaRemainingWidget } from './QuotaRemainingWidget';

jest.mock('src/libs/ajax/teaspoons/Teaspoons', () => ({
  Teaspoons: () => ({
    getQuotaForPipeline: jest.fn().mockResolvedValue({
      pipelineName: 'test_pipeline',
      quotaLimit: 2000,
      quotaConsumed: 750,
      quotaUnits: 'things',
    }),
  }),
}));

jest.mock('src/libs/react-utils', () => ({
  useCancellation: () => ({}),
}));

describe('QuotaRemainingWidget', () => {
  it('displays the correct remaining quota', async () => {
    render(<QuotaRemainingWidget pipelineName='test_pipeline' />);

    await waitFor(() => expect(screen.getByText(/test_pipeline:/i)).toBeInTheDocument());

    expect(screen.getByText('1250 things', { exact: false })).toBeInTheDocument();
    expect(screen.getByText(/Every submitted job will consume at least 500 things/i)).toBeInTheDocument();
  });
});
