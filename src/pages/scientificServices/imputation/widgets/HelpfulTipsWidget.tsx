import { Icon } from '@terra-ui-packages/components';
import React from 'react';

export const HelpfulTips = () => (
  <div
    style={{
      backgroundColor: '#f4f6f9',
      width: 400,
      padding: '1rem',
      borderRadius: '4px',
    }}
  >
    <h3 style={{ marginTop: '0.5rem' }}>
      <Icon icon='info-circle' style={{ color: '#5CC88D' }} /> Helpful Tips
    </h3>
    <ul style={{ paddingInlineStart: '1.5rem' }}>
      <li style={{ marginTop: '1rem' }}>Ensure that your file is a valid vcf file</li>
      <li style={{ marginTop: '1rem' }}>VCFs must be generated from GRCh38/hg38</li>
      <li style={{ marginTop: '1rem' }}>Ensure your multi-sample file contains no more than your remaining quota.</li>
      <li style={{ marginTop: '1rem' }}>More guidelines for data formatting</li>
    </ul>
  </div>
);
