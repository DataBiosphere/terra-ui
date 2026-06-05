import React, { useCallback, useEffect, useState } from 'react';
import { spinnerOverlay } from 'src/components/common';
import FooterWrapper from 'src/components/FooterWrapper';
import { MarkdownViewer, newWindowLinkRenderer } from 'src/components/markdown';
import { SimpleTabBar } from 'src/components/tabBars';
import { TopBar } from 'src/components/TopBar';
import { Teaspoons } from 'src/libs/ajax/teaspoons/Teaspoons';
import { TeaspoonsDocType } from 'src/libs/ajax/teaspoons/teaspoons-models';
import colors from 'src/libs/colors';
import * as Nav from 'src/libs/nav';
import { SCIENTIFIC_SERVICES_SUPPORT_EMAIL } from 'src/pages/scientificServices/pipelines/common/scientific-services-common';

const TABS: { key: TeaspoonsDocType; title: string }[] = [
  { key: 'termsOfService', title: 'Terms of Service' },
  { key: 'acceptableUsePolicy', title: 'Acceptable Use Policy' },
];

type LoadState = { status: 'loading' } | { status: 'ready'; content: string } | { status: 'error' };

const isValidDocType = (key: unknown): key is TeaspoonsDocType => TABS.some((t) => t.key === key);

export interface ScientificServicesTermsOfServicePageProps {
  queryParams?: { document?: string };
}

export const ScientificServicesTermsOfServicePage = ({ queryParams }: ScientificServicesTermsOfServicePageProps) => {
  const initialTab =
    isValidDocType(queryParams?.document) && queryParams?.document ? queryParams.document : 'termsOfService';
  const [activeTab, setActiveTab] = useState<TeaspoonsDocType>(initialTab);
  const [loadState, setLoadState] = useState<LoadState>({ status: 'loading' });

  const currentTab = TABS.find((t) => t.key === activeTab)!;

  const loadDoc = useCallback(async () => {
    setLoadState({ status: 'loading' });
    try {
      const content = await Teaspoons().getDocs(activeTab);
      setLoadState({ status: 'ready', content });
    } catch {
      setLoadState({ status: 'error' });
    }
  }, [activeTab]);

  useEffect(() => {
    loadDoc();
  }, [loadDoc]);

  const handleTabChange = (key: string) => {
    const docType = key as TeaspoonsDocType;
    setActiveTab(docType);
    Nav.goToPath('scientific-services-terms-of-service', {}, { document: docType });
  };

  return (
    <FooterWrapper alwaysShow>
      <TopBar title='' href={Nav.getLink('root')} />
      <div style={{ padding: '2rem', maxWidth: '900px', margin: '0 auto' }}>
        <h1 style={{ fontSize: 28, fontWeight: 500, marginBottom: '2.5rem' }}>Data Science Services Legal Documents</h1>
        <SimpleTabBar
          aria-label='legal documents'
          value={activeTab}
          onChange={handleTabChange}
          tabs={TABS.map(({ key, title }) => ({ key, title }))}
        >
          {null}
        </SimpleTabBar>
        <div style={{ marginTop: '1.5rem' }}>
          {loadState.status === 'loading' && spinnerOverlay}
          {loadState.status === 'error' && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '4rem 2rem',
                textAlign: 'center',
              }}
            >
              <h2 style={{ marginBottom: '0.75rem', color: colors.dark() }}>Could not load {currentTab.title}</h2>
              <p style={{ color: colors.dark(0.7) }}>
                Please try refreshing the page. If the problem persists, contact us at{' '}
                <a href={`mailto:${SCIENTIFIC_SERVICES_SUPPORT_EMAIL}`} style={{ color: '#46A3E9' }}>
                  {SCIENTIFIC_SERVICES_SUPPORT_EMAIL}
                </a>
                .
              </p>
            </div>
          )}
          {loadState.status === 'ready' && (
            <MarkdownViewer
              renderers={{
                link: newWindowLinkRenderer,
                heading: (text: string, level: number) => `<h${level} style="margin-bottom: 0">${text}</h${level}>`,
              }}
              style={{ lineHeight: 1.6, marginBottom: '3rem' }}
            >
              {loadState.content}
            </MarkdownViewer>
          )}
        </div>
      </div>
    </FooterWrapper>
  );
};
