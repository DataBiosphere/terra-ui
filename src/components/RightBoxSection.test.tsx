import { act, fireEvent, screen } from '@testing-library/react';
import React from 'react';
import { Ajax } from 'src/libs/ajax';
import { asMockedFn, renderWithAppContexts as render } from 'src/testing/test-utils';

import { RightBoxSection } from './RightBoxSection';

type AjaxContract = ReturnType<typeof Ajax>;
jest.mock('src/libs/ajax');

describe('RightBoxSection', () => {
  const captureEvent = jest.fn();

  beforeEach(() => {
    jest.resetAllMocks();
    asMockedFn(Ajax).mockImplementation(
      () =>
        ({
          Metrics: { captureEvent } as Partial<AjaxContract['Metrics']>,
        } as Partial<AjaxContract> as AjaxContract)
    );
  });

  it('displays the title', async () => {
    // Arrange
    // Act
    await act(async () => {
      render(<RightBoxSection title='Test Title' persistenceId='testId' />);
    });
    // Assert
    expect(screen.getByText('Test Title')).toBeInTheDocument();
  });

  it('toggles panel open state when clicked', async () => {
    // Arrange
    // Act
    render(
      <RightBoxSection title='Test Title' persistenceId='testId'>
        Panel Content
      </RightBoxSection>
    );
    const titleElement = screen.getByText('Test Title');
    expect(screen.queryByText('Panel Content')).toBeNull(); // ensuring the panel is closed
    fireEvent.click(titleElement);

    // Assert
    expect(screen.getByText('Panel Content')).toBeInTheDocument();
  });
});
