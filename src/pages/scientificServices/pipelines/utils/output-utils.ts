export interface PipelineOutputDescription {
  helpText: string;
}

export const PIPELINE_OUTPUT_DESCRIPTIONS: Record<string, Record<string, PipelineOutputDescription>> = {
  array_imputation: {
    imputedMultiSampleVcf: {
      helpText: 'A multi-sample VCF file containing imputed genotypes for all samples',
    },
    imputedMultiSampleVcfIndex: {
      helpText: 'An index file for the imputed multi-sample VCF file',
    },
    chunksInfo: {
      helpText: 'A TSV file containing information about the chunks used during imputation',
    },
  },
};
