import React, { ReactNode, useState } from 'react';
import Collapse from 'src/components/Collapse';
import { ValidatedInput } from 'src/components/input';
import colors from 'src/libs/colors';

interface PipelineOutputConfigurationProps {
  value: string;
  onChange: (value: string) => void;
  validationError?: ReactNode;
  onValidation(error?: ReactNode): void;
}

export const PipelineOutputConfiguration: React.FC<PipelineOutputConfigurationProps> = ({
  value,
  onChange,
  validationError,
  onValidation,
}) => {
  const [isVerifying, setIsVerifying] = useState(false);

  const handleChange = async (newValue: string) => {
    onChange(newValue);

    // If empty, clear validation error (it's optional)
    if (!newValue.trim()) {
      onValidation(undefined);
      return;
    }

    // Validate the gs:// path format
    const error = validateGcsPath(newValue);
    if (error) {
      onValidation(error);
      return;
    }

    // Verify access (placeholder implementation)
    setIsVerifying(true);
    try {
      await verifyGcsAccess(newValue);
      onValidation(undefined);
    } catch (err) {
      onValidation('Unable to verify access to this GCS path');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div style={{}}>
      <Collapse title={<h3>Output Configuration</h3>} initialOpenState={false} summaryStyle={{}}>
        <div style={{ marginBottom: '1rem' }}>
          <ValidatedInput
            width={500}
            error={validationError}
            inputProps={{
              'aria-label': 'output configuration path',
              type: 'text',
              value: value || '',
              placeholder: 'gs://bucket-name/path/to/outputs',
              onChange: (e) => handleChange(e),
            }}
          />
          <div style={{ marginTop: '0.5rem', fontStyle: 'italic', maxWidth: 600 }}>
            Specify an optional Google Cloud Storage path to deliver pipeline outputs.
            {isVerifying && <span style={{ color: colors.accent(), marginLeft: '0.5rem' }}>Verifying access...</span>}
          </div>
        </div>
      </Collapse>
    </div>
  );
};

export const validateGcsPath = (path: string): string | undefined => {
  if (!path.trim()) {
    return undefined;
  }

  // Check if it starts with gs://
  if (!path.startsWith('gs://')) {
    return 'Path must start with gs://';
  }

  // Check if there's a bucket name after gs://
  const pathWithoutPrefix = path.slice(5); // Remove 'gs://'
  if (!pathWithoutPrefix || pathWithoutPrefix === '/') {
    return 'Please specify a valid bucket name';
  }

  // Basic validation for valid GCS bucket naming
  const bucketNameMatch = pathWithoutPrefix.match(/^([^/]+)/);
  if (!bucketNameMatch) {
    return 'Invalid bucket name';
  }

  const bucketName = bucketNameMatch[1];
  // GCS bucket names must be 3-63 characters, contain only lowercase letters, numbers, hyphens, underscores, and dots
  const bucketNameRegex = /^[a-z0-9][a-z0-9_.-]{1,61}[a-z0-9]$/;
  if (!bucketNameRegex.test(bucketName)) {
    return 'Invalid bucket name format';
  }

  return undefined;
};

// Placeholder function for verifying GCS access
// This will be replaced with an actual API call when the endpoint is available
const verifyGcsAccess = async (_path: string): Promise<void> => {
  // Simulate API call delay
  await new Promise((resolve) => setTimeout(resolve, 500));

  // Placeholder: always return success for now
  // In the future, this will call the actual verification endpoint
  return Promise.resolve();
};
