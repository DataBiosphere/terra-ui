import React from 'react';
import { Ajax } from 'src/libs/ajax';
import { RemoteMarkdown } from 'src/libs/util/RemoteMarkdown';

const PrivacyPolicy = () => {
  return (
    <RemoteMarkdown
      getRemoteText={() => Ajax().TermsOfService.getPrivacyText()}
      failureMessage="Could not get Privacy Policy"
    />
  );
};

export const navPaths = [
  {
    name: 'privacy',
    path: '/privacy',
    component: PrivacyPolicy,
    public: true,
    title: 'Privacy Policy',
  },
];
