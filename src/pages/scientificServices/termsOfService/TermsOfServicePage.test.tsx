import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { Teaspoons, TeaspoonsContract } from 'src/libs/ajax/teaspoons/Teaspoons';
import * as Nav from 'src/libs/nav';
import { SCIENTIFIC_SERVICES_SUPPORT_EMAIL } from 'src/pages/scientificServices/pipelines/common/scientific-services-common';
import { asMockedFn, partial, renderWithAppContexts as render } from 'src/testing/test-utils';

import { ScientificServicesTermsOfServicePage } from './TermsOfServicePage';

jest.mock('src/libs/ajax/teaspoons/Teaspoons');

jest.mock('src/libs/nav', () => ({
  ...jest.requireActual('src/libs/nav'),
  getLink: jest.fn(() => '/'),
  goToPath: jest.fn(),
  useRoute: jest.fn().mockReturnValue({ params: {}, query: {} }),
}));

const mockTermsOfServiceContent = '# Terms of Service\n\nThese are the terms of service.';
const mockAcceptableUsePolicyContent = '# Acceptable Use Policy\n\nThis is the acceptable use policy.';

const mockGetDocs = jest.fn((docKey: string) => {
  if (docKey === 'termsOfService') return Promise.resolve(mockTermsOfServiceContent);
  if (docKey === 'acceptableUsePolicy') return Promise.resolve(mockAcceptableUsePolicyContent);
  return Promise.reject(new Error('Unknown doc key'));
});

beforeEach(() => {
  asMockedFn(Teaspoons).mockReturnValue(
    partial<TeaspoonsContract>({
      getDocs: mockGetDocs,
    })
  );
});

describe('ScientificServicesTermsOfServicePage', () => {
  describe('initial render', () => {
    it('renders the view with expected elements', async () => {
      render(<ScientificServicesTermsOfServicePage />);
      expect(screen.getByText('Data Science Services Legal Documents')).toBeInTheDocument();
      expect(await screen.findByRole('tab', { name: 'Terms of Service' })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: 'Acceptable Use Policy' })).toBeInTheDocument();
    });

    it('defaults to the Terms of Service tab when no query param is provided', async () => {
      render(<ScientificServicesTermsOfServicePage />);
      const tosTab = await screen.findByRole('tab', { name: 'Terms of Service' });
      expect(tosTab).toHaveAttribute('aria-selected', 'true');
    });

    it('loads and displays the Terms of Service content by default', async () => {
      render(<ScientificServicesTermsOfServicePage />);
      expect(await screen.findByText('Terms of Service', { selector: 'h1, h2, h3' })).toBeInTheDocument();
      expect(mockGetDocs).toHaveBeenCalledWith('termsOfService');
    });
  });

  describe('query param routing', () => {
    it('selects the Terms of Service tab when queryParams.document is termsOfService', async () => {
      render(<ScientificServicesTermsOfServicePage queryParams={{ document: 'termsOfService' }} />);
      const tosTab = await screen.findByRole('tab', { name: 'Terms of Service' });
      expect(tosTab).toHaveAttribute('aria-selected', 'true');
      expect(mockGetDocs).toHaveBeenCalledWith('termsOfService');
    });

    it('selects the Acceptable Use Policy tab when queryParams.document is acceptableUsePolicy', async () => {
      render(<ScientificServicesTermsOfServicePage queryParams={{ document: 'acceptableUsePolicy' }} />);
      const aupTab = await screen.findByRole('tab', { name: 'Acceptable Use Policy' });
      expect(aupTab).toHaveAttribute('aria-selected', 'true');
      expect(mockGetDocs).toHaveBeenCalledWith('acceptableUsePolicy');
    });

    it('falls back to Terms of Service for an invalid queryParams.document value', async () => {
      render(<ScientificServicesTermsOfServicePage queryParams={{ document: 'notAValidDoc' }} />);
      const tosTab = await screen.findByRole('tab', { name: 'Terms of Service' });
      expect(tosTab).toHaveAttribute('aria-selected', 'true');
      expect(mockGetDocs).toHaveBeenCalledWith('termsOfService');
    });
  });

  describe('tab switching', () => {
    it('switches to the Acceptable Use Policy tab and loads its content when clicked', async () => {
      const user = userEvent.setup();
      render(<ScientificServicesTermsOfServicePage />);

      await screen.findByText('Terms of Service', { selector: 'h1, h2, h3' });

      await user.click(screen.getByRole('tab', { name: 'Acceptable Use Policy' }));

      expect(await screen.findByText('Acceptable Use Policy', { selector: 'h1, h2, h3' })).toBeInTheDocument();
      expect(mockGetDocs).toHaveBeenCalledWith('acceptableUsePolicy');
    });

    it('updates the URL query param when switching tabs', async () => {
      const user = userEvent.setup();
      render(<ScientificServicesTermsOfServicePage />);

      await screen.findByText('Terms of Service', { selector: 'h1, h2, h3' });

      await user.click(screen.getByRole('tab', { name: 'Acceptable Use Policy' }));

      expect(Nav.goToPath).toHaveBeenCalledWith(
        'scientific-services-terms-of-service',
        {},
        { document: 'acceptableUsePolicy' }
      );
    });
  });

  describe('error state', () => {
    beforeEach(() => {
      asMockedFn(Teaspoons).mockReturnValue(
        partial<TeaspoonsContract>({
          getDocs: jest.fn().mockRejectedValue(new Error('bla bla error')),
        })
      );
    });

    it('displays an inline error message when the doc fails to load', async () => {
      render(<ScientificServicesTermsOfServicePage />);
      await screen.findByText('Could not load Terms of Service');
      const emailLink = screen.getByRole('link', { name: new RegExp(SCIENTIFIC_SERVICES_SUPPORT_EMAIL) });
      expect(emailLink).toHaveAttribute('href', `mailto:${SCIENTIFIC_SERVICES_SUPPORT_EMAIL}`);
    });
  });
});
