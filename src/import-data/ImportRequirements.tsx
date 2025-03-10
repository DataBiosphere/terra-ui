import React, { ReactNode } from 'react';

import { requiresSecurityMonitoring, sourceHasAccessControl } from './import-requirements';
import { ImportRequest } from './import-types';

export interface ImportRequirementsProps {
  importRequest: ImportRequest;
}

export const ImportRequirements = (props: ImportRequirementsProps): ReactNode => {
  const { importRequest } = props;

  const isSecurityMonitoringRequired = requiresSecurityMonitoring(importRequest);
  const hasAccessControl = sourceHasAccessControl(importRequest);

  const hasAnyRequirements = isSecurityMonitoringRequired || hasAccessControl !== false;
  if (!hasAnyRequirements) {
    return null;
  }

  return (
    <>
      <p>Your data selection:</p>
      <ul style={{ paddingLeft: '2ch' }}>
        {isSecurityMonitoringRequired && (
          <li style={{ marginBottom: '0.5rem' }}>
            Requires additional security monitoring on the destination workspace.
          </li>
        )}
        {hasAccessControl !== false && (
          <>
            <li style={{ marginBottom: '0.5rem' }}>May add Data Access Controls to the destination workspace.</li>
            <li style={{ marginBottom: '0.5rem' }}>May require being an owner of the destination workspace.</li>
          </>
        )}
      </ul>
    </>
  );
};
