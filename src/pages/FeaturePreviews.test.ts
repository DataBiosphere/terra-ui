import { fireEvent, getByText } from '@testing-library/react';
import { h } from 'react-hyperscript-helpers';
import { isFeaturePreviewEnabled, toggleFeaturePreview, useAvailableFeaturePreviews } from 'src/libs/feature-previews';
import { FeaturePreviews } from 'src/pages/FeaturePreviews';
import { asMockedFn, renderWithAppContexts as render } from 'src/testing/test-utils';

jest.mock('src/libs/feature-previews');

describe('FeaturePreviews', () => {
  beforeEach(() => {
    asMockedFn(useAvailableFeaturePreviews).mockReturnValue({
      featurePreviews: [
        // @ts-expect-error
        {
          id: 'feature1',
          title: 'Feature #1',
          description: 'A new feature',
          documentationUrl: 'https://example.com/feature-1-docs',
        },
        // @ts-expect-error
        {
          id: 'feature2',
          title: 'Feature #2',
          description: 'Another new feature',
          feedbackUrl: 'mailto:feature2-feedback@example.com',
        },
      ],
      loading: false,
    });

    asMockedFn(isFeaturePreviewEnabled).mockReturnValue(false);
  });

  it('should render available feature previews', () => {
    const { getAllByRole } = render(h(FeaturePreviews));
    const cells = getAllByRole('cell');

    expect(getByText(cells[1], 'Feature #1')).toBeTruthy();
    expect(getByText(cells[1], 'A new feature')).toBeTruthy();

    expect(getByText(cells[3], 'Feature #2')).toBeTruthy();
    expect(getByText(cells[3], 'Another new feature')).toBeTruthy();
  });

  it('should render whether features are enabled', () => {
    asMockedFn(isFeaturePreviewEnabled).mockImplementation((id) => id === 'feature1');

    const { getAllByRole } = render(h(FeaturePreviews));
    const checkboxes = getAllByRole('checkbox');

    expect(checkboxes[0].getAttribute('aria-checked')).toBe('true');
    expect(checkboxes[1].getAttribute('aria-checked')).toBe('false');
  });

  it('checking a checkbox should toggle feature previews', () => {
    const { getAllByRole } = render(h(FeaturePreviews));
    const checkboxes = getAllByRole('checkbox');

    fireEvent.click(checkboxes[0]);
    expect(toggleFeaturePreview).toHaveBeenCalledWith('feature1', true);

    fireEvent.click(checkboxes[0]);
    expect(toggleFeaturePreview).toHaveBeenCalledWith('feature1', false);
  });

  it('should render documentation link if provided', () => {
    const { getAllByText } = render(h(FeaturePreviews));
    const docLinks = getAllByText('Documentation');
    expect(docLinks.length).toBe(1);
    expect(docLinks[0].getAttribute('href')).toBe('https://example.com/feature-1-docs');
  });

  it('should render feedback link if provided', () => {
    const { getAllByText } = render(h(FeaturePreviews));
    const feedbackLinks = getAllByText('Submit feedback');
    expect(feedbackLinks.length).toBe(1);
    expect(feedbackLinks[0].getAttribute('href')).toBe('mailto:feature2-feedback@example.com');
  });
});
