// This file contains user-friendly descriptions/labels for various pipeline inputs.
// Because the Teaspoons UI is meant to be generic and reusable across different pipelines,
// we provide these descriptions here to give users context about what each input is for.
// Eventually, we may want to return these from the backend, but for now we'll put them here.

export interface PipelineInputDescription {
  label?: string;
  placeholder?: string;
  helpText?: string;
  validationRegex?: string;
}

export const INPUT_DESCRIPTIONS: Record<string, PipelineInputDescription> = {
  outputBasename: {
    label: 'Enter prefix for output file',
    placeholder: 'Enter prefix name',
    helpText: 'May only contain alphanumeric characters, dashes, and underscores.',
    validationRegex: '^[a-zA-Z0-9_.-]+$',
  },
  multiSampleVcf: {
    label: 'Select a multi-sample VCF file',
    validationRegex: '^[a-zA-Z0-9_.-]+$',
  },
  minDr2ForInclusion: {
    label: 'Enter a minimum imputation quality for inclusion',
    placeholder: '0.0',
    helpText:
      'The minimum imputation quality (DR2) for inclusion in output VCF. Value must be between 0 and 1 (inclusive). Default is 0.0',
    validationRegex: String.raw`^(0(\.\d*)?|1(\.0*)?|\.\d+)$`,
  },
};
