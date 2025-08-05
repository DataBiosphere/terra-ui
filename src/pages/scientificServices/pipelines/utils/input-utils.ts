// This file contains user-friendly descriptions/labels for various pipeline inputs.
// Because the Teaspoons UI is meant to be generic and reusable across different pipelines,
// we provide these descriptions here to give users context about what each input is for.
// Eventually, we may want to return these from the backend, but for now we'll put them here.

export interface PipelineInputDescription {
  label: string;
  placeholder?: string;
  helpText?: string;
}

export const INPUT_DESCRIPTIONS: Record<string, PipelineInputDescription> = {
  outputBasename: {
    label: 'Enter prefix for output file',
    placeholder: 'Enter prefix name',
    helpText: 'May only contain alphanumeric characters, dashes, and underscores.',
  },
  multiSampleVcf: {
    label: 'Select a multi-sample VCF file',
  },
};
