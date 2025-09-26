export interface PipelineOutputDescription {
  description: string;
}

export const PIPELINE_OUTPUT_DESCRIPTIONS: Record<string, Record<string, PipelineOutputDescription>> = {
  array_imputation: {
    imputedMultiSampleVcf: {
      description: 'A multi-sample VCF file containing imputed genotypes for all samples',
    },
    imputedMultiSampleVcfIndex: {
      description: 'An index file for the imputed multi-sample VCF file',
    },
    chunksInfo: {
      description: 'A TSV file containing QC information about the chunks used during imputation',
    },
  },
};
