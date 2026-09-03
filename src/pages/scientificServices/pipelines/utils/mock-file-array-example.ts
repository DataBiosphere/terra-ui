import {
  PipelineRunOutputSignedUrlsResponse,
  PipelineRunResponse,
  PipelineWithDetails,
} from 'src/libs/ajax/teaspoons/teaspoons-models';

/**
 * TSPS-1172: Teaspoons does not yet return FILE_ARRAY outputs. This fixture lets the FILE_ARRAY
 * rendering in JobDetails be previewed in the running app until the backend ships support for it.
 * Navigate to the job history detail page for this job ID to see it: #pipelines/imputation/history/mock-file-array-outputs
 * Remove this file, and its usages in JobDetails.tsx and OutputDetailsModal.tsx, once Teaspoons returns real FILE_ARRAY outputs.
 */
export const MOCK_FILE_ARRAY_JOB_ID = 'mock-file-array-outputs';

const chrFileArray = (suffix: string, sizes: number[]) =>
  sizes.map((sizeInBytes, index) => ({
    metadata: { sizeInBytes },
    value: `test.chr${index + 1}.imputed.${suffix}`,
  }));

export const mockFileArrayPipelineRunResponse: PipelineRunResponse = {
  jobReport: {
    id: MOCK_FILE_ARRAY_JOB_ID,
    description: 'chr split outputs test (local)',
    status: 'SUCCEEDED',
    statusCode: 200,
    submitted: '2026-09-02T14:14:31.675699Z',
    completed: '2026-09-02T16:01:15.165743Z',
    resultURL: `http://localhost:8080/api/pipelineruns/v3/result/${MOCK_FILE_ARRAY_JOB_ID}`,
  },
  pipelineRunReport: {
    pipelineName: 'array_imputation',
    pipelineVersion: 3,
    toolVersion: 'TSPS-1168_split_chr_output_array_imputation',
    userInputs: {
      multiSampleVcf: '/Users/marymorg/Desktop/NA12878_10_duplicate.merged.cleaned.vcf.gz',
      outputBasename: 'test',
      minDr2ForInclusion: '0.0',
    },
    outputs: {
      imputedMultiSampleVcfIndex: chrFileArray(
        'vcf.gz.tbi',
        [
          169605, 178017, 146661, 141085, 132976, 126513, 117594, 107501, 90730, 98712, 99221, 98302, 73020, 67368,
          62660, 60508, 59993, 57345, 41639, 45390, 28446, 27829,
        ]
      ),
      imputedMultiSampleVcf: chrFileArray(
        'vcf.gz',
        [
          43385315, 46276500, 37935463, 37758837, 34737436, 33570214, 31766440, 29650390, 24334849, 26973990, 26295092,
          25891575, 19082656, 17800196, 16516461, 17811622, 16197104, 15181351, 13435155, 12323769, 8753641, 8655855,
        ]
      ),
      contigsInfo: {
        metadata: { sizeInBytes: 901 },
        value: 'test_contig_info.tsv',
      },
      chunksInfo: {
        metadata: { sizeInBytes: 5051 },
        value: 'test_chunk_info.tsv',
      },
    },
    outputExpirationDate: '2026-09-16T16:01:15.165743Z',
    quotaConsumed: 500,
    inputSizeUnits: 'samples',
    inputSize: 10,
    citation:
      'Data Science Services at Broad Clinical Laboratories. (2026, Sep 2). *All of Us + AnVIL Array Imputation* (v3). https://services.terra.bio/',
  },
};

export const mockFileArrayPipelineDetails: PipelineWithDetails = {
  pipelineName: 'array_imputation',
  displayName: 'Array Imputation',
  pipelineVersion: 3,
  description: 'All of Us + AnVIL Array Imputation',
  type: 'imputation',
  inputs: [
    {
      name: 'multiSampleVcf',
      displayName: 'multi-sample VCF file',
      description: 'A bgzipped, multi-sample VCF containing array data from one or more chromosomes to be imputed',
      type: 'FILE',
      isRequired: true,
      fileSuffix: '.vcf.gz',
    },
    {
      name: 'outputBasename',
      displayName: 'output basename',
      description:
        "The prefix for all of the outputs' filenames. May only contain alphanumeric characters, dashes, and underscores",
      type: 'STRING',
      isRequired: true,
    },
    {
      name: 'minDr2ForInclusion',
      displayName: 'minimum imputation quality for inclusion',
      description:
        'The minimum imputation quality (DR2) for inclusion in output VCF. Value must be between 0 and 1 (inclusive). Default is 0.0',
      type: 'FLOAT',
      isRequired: false,
      defaultValue: '0.0',
      minValue: 0,
      maxValue: 1,
    },
  ],
  outputs: [
    {
      name: 'imputedMultiSampleVcf',
      displayName: 'imputed multi-sample VCFs',
      type: 'FILE_ARRAY',
      description: 'One imputed, multi-sample VCF per chromosome',
    },
    {
      name: 'imputedMultiSampleVcfIndex',
      displayName: 'imputed multi-sample VCF indices',
      type: 'FILE_ARRAY',
      description: 'One index file per imputed, multi-sample VCF',
    },
    {
      name: 'contigsInfo',
      displayName: 'imputation contigs QC tsv',
      type: 'FILE',
      description: 'A TSV file containing QC information about the contigs used during imputation',
    },
    {
      name: 'chunksInfo',
      displayName: 'imputation chunks QC tsv',
      type: 'FILE',
      description: 'A TSV file containing QC information about the chunks used during imputation',
    },
  ],
};

const chrSignedUrls = (fileArray: { value: string }[]) =>
  fileArray.map(({ value }) => `https://storage.googleapis.com/mock-bucket/${value}?mock-signature`);

export const mockFileArrayOutputSignedUrls: PipelineRunOutputSignedUrlsResponse = {
  jobId: MOCK_FILE_ARRAY_JOB_ID,
  outputSignedUrls: {
    imputedMultiSampleVcf: chrSignedUrls(
      mockFileArrayPipelineRunResponse.pipelineRunReport.outputs!.imputedMultiSampleVcf as { value: string }[]
    ),
    imputedMultiSampleVcfIndex: chrSignedUrls(
      mockFileArrayPipelineRunResponse.pipelineRunReport.outputs!.imputedMultiSampleVcfIndex as { value: string }[]
    ),
    contigsInfo: 'https://storage.googleapis.com/mock-bucket/test_contig_info.tsv?mock-signature',
    chunksInfo: 'https://storage.googleapis.com/mock-bucket/test_chunk_info.tsv?mock-signature',
  },
  outputExpirationDate: mockFileArrayPipelineRunResponse.pipelineRunReport.outputExpirationDate!,
};
