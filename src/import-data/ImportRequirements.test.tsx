import { render, screen } from '@testing-library/react';
import React from 'react';

import {
  anvilPfbImportRequests,
  gcpTdrSnapshotImportRequest,
  protectedGcpTdrSnapshotImportRequest,
} from './__fixtures__/import-request-fixtures';
import { ImportRequest } from './import-types';
import { ImportRequirements } from './ImportRequirements';

describe('ImportRequirements', () => {
  it('should show the required cloud platform if any', () => {
    // Arrange
    const importRequest = gcpTdrSnapshotImportRequest;
    const expectedCloudPlatform = 'Google Cloud Platform';

    // Act
    render(<ImportRequirements importRequest={importRequest} />);

    // Assert
    screen.getByText(`Requires a ${expectedCloudPlatform} destination workspace.`);
  });

  it.each([
    { importRequest: protectedGcpTdrSnapshotImportRequest, requirementExpected: true },
    { importRequest: gcpTdrSnapshotImportRequest, requirementExpected: false },
    { importRequest: anvilPfbImportRequests[0], requirementExpected: true },
  ] as { importRequest: ImportRequest; requirementExpected: boolean }[])(
    'should show the security monitoring requirement if any',
    ({ importRequest, requirementExpected }) => {
      // Act
      render(<ImportRequirements importRequest={importRequest} />);

      // Assert
      const isRequirementShown = !!screen.queryByText(
        'Requires additional security monitoring on the destination workspace.'
      );
      expect(isRequirementShown).toBe(requirementExpected);
    }
  );

  it.each([
    { importRequest: gcpTdrSnapshotImportRequest, requirementExpected: false },
    {
      importRequest: { ...gcpTdrSnapshotImportRequest, snapshotAccessControls: ['example-group'] },
      requirementExpected: true,
    },
    { importRequest: anvilPfbImportRequests[0], requirementExpected: true },
  ] as { importRequest: ImportRequest; requirementExpected: boolean }[])(
    'should show the access control requirement if any',
    ({ importRequest, requirementExpected }) => {
      // Act
      render(<ImportRequirements importRequest={importRequest} />);

      // Assert
      const isRequirementShown = !!screen.queryByText('May add Data Access Controls to the destination workspace.');
      expect(isRequirementShown).toBe(requirementExpected);
    }
  );
});
