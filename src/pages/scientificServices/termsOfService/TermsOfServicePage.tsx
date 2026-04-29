import React, { useState } from 'react';
import FooterWrapper from 'src/components/FooterWrapper';
import { SimpleTabBar } from 'src/components/tabBars';
import { TopBar } from 'src/components/TopBar';
import { Teaspoons } from 'src/libs/ajax/teaspoons/Teaspoons';
import { TeaspoonsDocType } from 'src/libs/ajax/teaspoons/teaspoons-models';
import * as Nav from 'src/libs/nav';
import { RemoteMarkdown } from 'src/libs/util/RemoteMarkdown';
import { SCIENTIFIC_SERVICES_SUPPORT_EMAIL } from 'src/pages/scientificServices/pipelines/common/scientific-services-common';

type DocTab = 'termsOfService' | 'acceptableUsePolicy';

const TABS: { key: DocTab; title: string; docKey: TeaspoonsDocType }[] = [
  { key: 'termsOfService', title: 'Terms of Service', docKey: 'termsOfService' },
  { key: 'acceptableUsePolicy', title: 'Acceptable Use Policy', docKey: 'acceptableUsePolicy2' },
];

export const ScientificServicesTermsOfServicePage = () => {
  const [activeTab, setActiveTab] = useState<DocTab>('termsOfService');

  const currentTab = TABS.find((t) => t.key === activeTab)!;

  return (
    <FooterWrapper alwaysShow>
      <TopBar title='' href={Nav.getLink('root')} />
      <div style={{ padding: '2rem', maxWidth: '900px', margin: '0 auto' }}>
        <h1 style={{ fontSize: 28, fontWeight: 500, marginBottom: '2.5rem' }}>Scientific Services Legal Documents</h1>
        <SimpleTabBar
          aria-label='legal documents'
          value={activeTab}
          onChange={(key) => setActiveTab(key as DocTab)}
          tabs={TABS.map(({ key, title }) => ({ key, title }))}
        >
          {null}
        </SimpleTabBar>
        <div style={{ marginTop: '1.5rem' }}>
          <RemoteMarkdown
            key={activeTab}
            style={{ lineHeight: 1.6 }}
            getRemoteText={() =>
              Teaspoons()
                .getDocs(currentTab.docKey)
                .then((r) => r)
            }
            failureMessage={`Could not load ${currentTab.title}. Please refresh the page or contact ${SCIENTIFIC_SERVICES_SUPPORT_EMAIL} for assistance.`}
          />
        </div>
      </div>
    </FooterWrapper>
  );
};

export const navPaths = [
  {
    name: 'scientific-services-terms-of-service',
    path: '/pipelines/terms-of-service',
    component: ScientificServicesTermsOfServicePage,
    public: true,
    title: 'Terms of Service',
  },
];
