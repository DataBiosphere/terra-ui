import React from 'react';
import FooterWrapper from 'src/components/FooterWrapper';
import { imputationTopBar } from 'src/pages/scientificServices/imputation/common/scientific-services-common';

export const JobHistory = () => {
  return (
    <FooterWrapper alwaysShow>
      {imputationTopBar('job history')}
      <div style={{ marginLeft: '2rem', marginTop: '1rem' }}>
        <h3>Job History</h3>
        <div style={{ width: '50%' }}>
          All files associated with jobs will be auto deleted after 2 weeks from completed. For support, email{' '}
          <a href='mailto:scientific-services-support@broadinstitute.org'>
            scientific-services-support@broadinstitute.org
          </a>
        </div>
      </div>
    </FooterWrapper>
  );
};
